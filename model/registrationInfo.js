const mongoose = require('mongoose');
const { Schema } = mongoose;

const registrationSchema = new Schema({
    name: String,
    userId: {
        type: String,
        unique: true
    },
    email: String,
    password: String,
    Token: String,
    FCMDeviceToken: String,
    is_online: String,
    nadra_verified: Number,
    friendRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "register"
        }
    ],
    friends: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "register"
        }
    ],
    sentfriendRequests: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "register"
        }
    ],
    // date: {type: Date, default: Date.now}
})

const register = mongoose.model('register', registrationSchema);

module.exports = register;