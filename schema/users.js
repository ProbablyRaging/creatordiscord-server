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
    views: {
        type: Number,
        required: false
    },
    likes: {
        type: Number,
        required: false
    },
    submissions: {
        type: Number,
        required: false
    },
    watches: {
        type: Number,
        required: false
    },
    prevSubmissions: {
        type: Number,
        required: false
    },
    prevViews: {
        type: Number,
        required: false
    }
});

module.exports = mongoose.model('extensionusers', usersSchema)