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
    },
    tokens: {
        type: Number,
        required: false
    },
    tokenCap: {
        type: Number,
        required: false
    },
    limit: {
        type: String,
        required: false
    },
    views: {
        type: Number,
        required: false
    },
    submissions: {
        type: Number,
        required: false
    }
});

module.exports = mongoose.model('extensionusers', usersSchema)