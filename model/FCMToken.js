const mongoose = require('mongoose');

const fcmTokenSchema = new mongoose.Schema({
    DeviceToken: String
})

const FcmDeviceToken = mongoose.model('FcmDeviceToken', fcmTokenSchema);

module.exports = FcmDeviceToken;