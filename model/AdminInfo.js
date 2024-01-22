const mongoose = require('mongoose');
const { Schema } = mongoose;

const adminSchema = new Schema({
    name: String,
    adminId: {
        type: String,
        unique: true
    },
    email: String,
    password: String,
    Token: String,
    // FCMDeviceToken: String,
    // is_online: String,
    // nadra_verified: Number,
    // friendRequests: [
    //     {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "register"
    //     }
    // ],
    // friends: [
    //     {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "register"
    //     }
    // ],
    // sentfriendRequests: [
    //     {
    //         type: mongoose.Schema.Types.ObjectId,
    //         ref: "register"
    //     }
    // ],
    // date: {type: Date, default: Date.now}
})

const Admin = mongoose.model('AdminInfo', adminSchema);

module.exports = Admin;