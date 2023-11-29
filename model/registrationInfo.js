const mongoose = require('mongoose');
const {Schema} = mongoose;

const registrationSchema = new Schema({
    userId: String, 
    password: String,
    Token: String
    // date: {type: Date, default: Date.now}
})

const register = mongoose.model('register', registrationSchema);

module.exports = register;