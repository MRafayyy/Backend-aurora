const mongoose = require('mongoose');
const {Schema} = mongoose;

const registrationSchema = new Schema({
    name: String,
    userId: String, 
    email: String,
    password: String,
    Token: String,
    FCMDeviceToken: String,
    is_online: String,
    friendRequests: Array,
    sentfriendRequests: Array
    // date: {type: Date, default: Date.now}
})

const register = mongoose.model('register', registrationSchema);

module.exports = register;