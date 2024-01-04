const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({

    senderId:  [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "register"
        }
    ],
    recepientId:  [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "register"
        }
    ],
    messageType: {
        type: String,
        enum: ['text', 'json']
    },
    message: String,
    imageUrl: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
})

const MESSAGE = mongoose.model('MESSAGE', messageSchema)

module.exports = MESSAGE;