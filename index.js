const { urlencoded } = require('express');
const express = require('express')
const app = require('express')();
require('./db/db')
const register = require('./model/registrationInfo')
const Nadra = require('./model/NadraModel')
const jwt = require('jsonwebtoken');
const crypto = require('crypto-js')

app.use(urlencoded({ extended: false }))
app.use(express.json())


// app.use('/',(req,res)=>{
//     res.send({"hey":"np"})
// })
app.post('/EnterNadraInfo', async (req, res) => {
    // if(req.body === null){

    try {
        let response = await Nadra.insertMany(req.body);
        console.log(response)
        //    res.send(response)
        res.send(true)
    } catch (error) {
        console.log(error)
    }
    // }
})

app.post('/VerifyNadraInfo', async (req, res) => {
    if (req.body !== null) {
        try {
            let response = await Nadra.findOneAndUpdate({ name: req.body.name, fathers_name: req.body.fathers_name, cnic: req.body.cnic, gender: "female" }, { $set: { userId: req.body.userId } });
            // let response2 = await Nadra.findOneAndUpdate({})
            console.log(response)
            if (response === null) {
                res.send(false)
                console.log(response)
            }
            else {
                res.send(true)
            }
        } catch (error) {
            console.log(error)
        }
    }
})

app.post('/register', async (req, res) => {
    const obj1 = req.body;
    console.log(obj1);
    try {
        let response2 = await register.findOne(obj1);
        if (response2 === null) {

            let response = await register.insertMany(obj1)
            res.send(true);
        }
        else {
            res.send(false)
        }
    } catch (error) {
        console.log(error)
    }
})

const checkLoginInfo = async (req, res, next) => {
    try {
        console.log(req.body.userId);
        console.log(req.body.password);
        let response = await register.findOne({ userId: req.body.userId, password: req.body.password })
        if (response === null) {
            // res.send("login credentials did not match")
            res.send({ success: false, reason: 'Login credentials did not match' })
            // console.log(response)
        }
        else {
            next();
        }
    } catch (error) {
        console.log(error)
        // res.send("login credentials did not match")
    }
}
const secretKey = "hey";

app.post('/login', checkLoginInfo, (req, res) => {
    // res.send("u can login")
    const userInfo = {
        userId: req.body.userId,
        password: req.body.password
    }

    try {
        jwt.sign({ userInfo }, secretKey, { expiresIn: '300s' }, async (err, token) => {

            let encryptedToken = crypto.AES.encrypt(token, secretKey).toString();




            let response = await register.findOneAndUpdate(userInfo, { $set: { Token: token } }, { new: true })
            // let response = await register.findOneAndUpdate({userId: req.body.userId, password: req.body.password},{$set : {Token : token}},{new: true})
            // console.log(response)
            // res.send(true);

            if (response !== null) {
                res.send({ success: true, token: encryptedToken });
            }
        })
    } catch (error) {
        console.log(error)
    }
})

app.post('/verifyToken', async function verifyToken(req, res) {
    
    let decryptedToken = (crypto.AES.decrypt(req.body.password, secretKey)).toString(crypto.enc.Utf8);
    jwt.verify(decryptedToken, secretKey, (error, authData) => {
        if (error) {
            res.send({ success: false })
        }
        else {
            res.send({ success: true, authData })
        }
    })
})



app.listen(3000, () => {
    console.log('server running on port 3000')
})