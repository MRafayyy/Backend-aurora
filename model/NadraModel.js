const mongoose = require('mongoose');

const NADRA = new mongoose.Schema({
name: String,
fathers_name: String,
cnic: Number,
gender: String,
userId: String
})

const Nadra = mongoose.model('Nadra', NADRA)

module.exports = Nadra;