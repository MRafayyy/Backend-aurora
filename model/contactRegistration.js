const mongoose = require('mongoose');
const {Schema} = require('mongoose');


const contactsSchema = new Schema({

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
    userSpecificNotifications: [
        {
            date: {
                type: String,
                required: true
            },
            time: {
                type: String,
                required: true
            },
            title: String,
            body: String
        }
    ],

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
})


const contactsRegister = mongoose.model('contactsRegister', contactsSchema);

module.exports = contactsRegister;

