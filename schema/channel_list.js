const mongoose = require('mongoose');

const channelListSchema = mongoose.Schema({
    channelId: {
        type: String,
        required: false
    },
    name: {
        type: String,
        required: false
    },
    url: {
        type: String,
        required: false
    },
    subscriberCount: {
        type: String,
        required: false
    },
    videoCount: {
        type: String,
        required: false
    },
    avatar: {
        type: String,
        required: false
    },
    handle: {
        type: String,
        required: false
    },
    joinDate: {
        type: Date,
        required: false
    },
});

module.exports = mongoose.model('channellists', channelListSchema)