const mongoose = require('mongoose');
const mongodb = require('mongodb');
//first oyKxoUadefks1uIO
// Jxz556eRnvEqLdGs
let url = 'mongodb+srv://Rafay123:Jxz556eRnvEqLdGs@cluster1.pfcvref.mongodb.net/?retryWrites=true&w=majority'
// ,{useNewUrlParser: true, useUnifiedTopology: true}
mongoose.connect(url).then(()=>{
    console.log("mongoose connected")
}).catch((error)=>{
    console.log(error)
})
