const mongoose = require('mongoose');

const notifsSchema = new mongoose.Schema({
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
}, {
    timestamps: true // This will add createdAt and updatedAt fields with timestamps
})

const adminNotifications = mongoose.model('adminNotifications', notifsSchema);

module.exports = adminNotifications;