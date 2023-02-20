const mongoose = require('mongoose');

const usersSchema = mongoose.Schema({
    userId: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    tokens: {
        type: Number,
        required: false
    },
    accessToken: {
        type: String,
        required: true
    },
    refreshToken: {
        type: String,
        required: true
    },
    expires: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('extensionusers', usersSchema)