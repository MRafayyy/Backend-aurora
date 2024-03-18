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
    is_online: Number,
    nadra_verified: Number,
    rescue_video_download_urls: [
        {
            download_link: String,
            date: {type: Date, default: Date.now}
        }
    ],
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