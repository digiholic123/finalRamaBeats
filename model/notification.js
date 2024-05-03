const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: {
            type: String,
            required: true
    },
    message: {
        type: String,
        required: true
    },
    modified:{
        type: String,
        required: true
        }
    },
    {
        versionKey : false
    });

module.exports = mongoose.model('notification', notificationSchema);
