const { urlencoded } = require('express');
const express = require('express')
const app = require('express')();
require('./db/db')
const register = require('./model/registrationInfo')
const Nadra = require('./model/NadraModel')


app.use(urlencoded({extended:false}))
app.use(express.json())


// app.use('/',(req,res)=>{
//     res.send({"hey":"np"})
// })
app.post('/EnterNadraInfo',async(req,res)=>{
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
app.post('/VerifyNadraInfo',async(req,res)=>{
    if(req.body !== null){
        try {
            let response = await Nadra.findOneAndUpdate({name : req.body.name, fathers_name: req.body.fathers_name, cnic: req.body.cnic, gender: "female"},{$set:{userId: req.body.userId}});
            // let response2 = await Nadra.findOneAndUpdate({})
            console.log(response)
            if(response===null){
                res.send(false)
                console.log(response)
            }
            else{
                res.send(true)
            }
        } catch (error) {
            console.log(error)
        }
    }
})

app.post('/register',async(req,res)=>{
    const obj1 = req.body;
    console.log(obj1);
    try {
        let response2 = await register.findOne(obj1);
        if(response2===null){

            let response = await register.insertMany(obj1)
            res.send(true);
        }
        else{
            res.send(false)
        }
    } catch (error) {
        console.log(error)
    }
})

const checkLoginInfo=async(req,res,next)=>{
    try {
        console.log(req.body.userId);
        console.log(req.body.password);
        let response = await register.findOne({userId: req.body.userId, password: req.body.password})
        if(response===null){
            // res.send("login credentials did not match")
            res.send(false)
            console.log(response)
        }
        else{
            next();
        }
    } catch (error) {
        console.log(error)
        // res.send("login credentials did not match")
    }
    }
    
    app.post('/login',checkLoginInfo,(req,res)=>{
        // res.send("u can login");
        res.send(true);
    
    })



    app.listen(3000,()=>{
        console.log('server running on port 3000')
    })