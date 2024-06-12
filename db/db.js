const mongoose = require('mongoose');
const mongodb = require('mongodb');
require('dotenv').config()
//first oyKxoUadefks1uIO
// Jxz556eRnvEqLdGs
let mongoServer = process.env.MONGO_DB_SERVER_KEY
let url = mongoServer
// ,{useNewUrlParser: true, useUnifiedTopology: true}
mongoose.connect(url).then(()=>{
    console.log("mongoose connected")
}).catch((error)=>{
    console.log(error)
})
