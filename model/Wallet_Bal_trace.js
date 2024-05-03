const mongoose = require('mongoose');

const walletTracing = new mongoose.Schema({
        walletBal_12oClock: {
            type: Number,
            required: true
        },
        createdAt:{
            type: String,
            required: true
        }
    },
    {
        versionKey : false
    });

module.exports = mongoose.model('walletTracing', walletTracing);
