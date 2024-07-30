const mongoose = require('mongoose');
const mongodb = require('mongodb');
require('dotenv').config()
let mongoServer = process.env.MONGO_DB_SERVER_KEY
let url = mongoServer
mongoose.connect(url).then(()=>{
    console.log("mongoose connected")
}).catch((error)=>{
    console.log(error)
})
