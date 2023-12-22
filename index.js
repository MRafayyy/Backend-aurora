const { urlencoded } = require('express');
const express = require('express')
const app = require('express')();
require('./db/db')
const register = require('./model/registrationInfo')
const Nadra = require('./model/NadraModel')
const FcmDeviceToken = require('./model/FCMToken')

const jwt = require('jsonwebtoken');
const crypto = require('crypto-js')
const cors = require('cors')
const { main, main2 } = require('./SendMail');
const FCM = require('fcm-node')

app.use(urlencoded({ extended: false }))
app.use(express.json())
app.use(cors())

// app.use()
// app.use('/',(req,res)=>{
//     res.send({"hey":"np"})
// })


const pushNotifs = () => {
    const fcm = new FCM('AAAADz1-KfI:APA91bGJ-sKa3F15DexhEXHxHp_XWl4dEoC6HChxD6cJF42ad9RzvTj0K0KfxwCLLeAA54nWSGHwxN8ZYd2EIbBHztsXGu57ZG7jt-QKT8peIQYvyhMEWj03oX1kO2I0AYR8KVbs09gO')
}

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
            let u = req.body.userId;
            let response = await Nadra.findOneAndUpdate({ name: req.body.name, fathers_name: req.body.fathers_name, cnic: req.body.cnic, gender: req.body.gender }, { $set: { userId: req.body.userId } }, { new: true });
            // let response2 = await Nadra.findOneAndUpdate({})
            console.log(response)
            if (response === null) {
                res.send(false)
                console.log(response)
            }
            else {
                let eresponse = await register.findOne({ userId: u })
                console.log(eresponse)
                let mail = await main2(eresponse.email);
                if (mail) {

                }
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
        password: req.body.password,
    }

    try {
        jwt.sign({ userInfo }, secretKey, { expiresIn: '100000s' }, async (err, token) => {

            let encryptedToken = crypto.AES.encrypt(token, secretKey).toString();

            try {


                let t1 = await FcmDeviceToken.findOne({ DeviceToken: req.body.FcmDeviceToken }) //for device token
                if (t1 == null) {

                    let t2 = await FcmDeviceToken.create({ DeviceToken: req.body.FcmDeviceToken }) //for device token
                }
            } catch (error) {
                console.log("fmc token error")
            }


            let response = await register.findOneAndUpdate(userInfo, { $set: { Token: token, FCMDeviceToken: req.body.FcmDeviceToken } }, { new: true })
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




app.post('/forgotpassword', cors(), async (req, res) => {

    try {
        let response = await register.findOne(req.body);

        if (response !== null) {
            let mail = await main(response.email, response.userId, response.password)
            if (mail === true) {

                res.send({ success: true });
            }
            else {
                res.send({ success: false })
                console.log("jaldi dedia response")
            }
        }
        else {
            res.send({ success: false })
        }
        console.log(response.email)

    } catch (error) {
        console.log(error)
    }
})


app.get('/sendFCM', async (req, res) => {



    try {
        let totalTokens = await FcmDeviceToken.find({})
        console.log(totalTokens)
        // res.json(totalTokens)

        const fcm = new FCM('AAAADz1-KfI:APA91bGJ-sKa3F15DexhEXHxHp_XWl4dEoC6HChxD6cJF42ad9RzvTj0K0KfxwCLLeAA54nWSGHwxN8ZYd2EIbBHztsXGu57ZG7jt-QKT8peIQYvyhMEWj03oX1kO2I0AYR8KVbs09gO')
        let dv = []
        totalTokens.forEach((value, index) => {
            dv.push(value.DeviceToken)
        })

        fcm.send({
            registration_ids: dv,
            content_available: true,
            mutable_content: true,
            notification: {
                body: "This is an FCM notification message!",
                title: "From node js",
                imageUrl: 'https://my-cdn.com/app-logo.png',
                icon: "https://my-cdn.com/app-logo.png",
                sound: "mySound",
                
            },
        }, (err, response) => {
            if (err) {
                console.log("---------------"+err)
            }
            if (response) {
                console.log(response)

            }
        })

        // for (let i = 0; i < totalTokens.length; i++) {

            // ---------------------------------
        //     // await admin.messaging().sendMulticast({
        //     //     tokens: [
        //     //      totalTokens[i].DeviceToken
        //     //     ], // ['token_1', 'token_2', ...]
        //     //     notification: {
        //     //       title: 'Basic Notification',
        //     //       body: 'This is a basic notification sent from the server!',
        //     //       imageUrl: 'https://my-cdn.com/app-logo.png',
        //     //     },
        //     //   });
        // ---------------------------------
        //     // POST https://fcm.googleapis.com/v1/projects/myproject-b5ae1/messages:send HTTP/1.1
        //     let url = 'https://fcm.googleapis.com/fcm/send'
        //     let response = await fetch(url, {
        //         method: 'POST',
        //         headers: {
        //             'Content-Type': 'application/json',
        //             'Authorization': 'Bearer AAAADz1-KfI:APA91bGJ-sKa3F15DexhEXHxHp_XWl4dEoC6HChxD6cJF42ad9RzvTj0K0KfxwCLLeAA54nWSGHwxN8ZYd2EIbBHztsXGu57ZG7jt-QKT8peIQYvyhMEWj03oX1kO2I0AYR8KVbs09gO'
        //         },
        //         body: JSON.stringify({

        //             "data": {},
        //             "notification": {
        //                 "body": "This is an FCM notification message!",
        //                 "title": "FCM Message"
        //             },
        //             "to": totalTokens[i].DeviceToken,
        //         }

        //         )

        //     })
        // }
        //     response = response.json()

    } catch (error) {
        console.log("error isssssssss:"+error)
    }

})





app.listen(3000, () => {
    console.log('server running on port 3000')
})



// require('./SendMail')
