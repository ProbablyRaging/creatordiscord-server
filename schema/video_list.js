const mongoose = require('mongoose');

const videoListSchema = mongoose.Schema({
    title: {
        type: String,
        required: false
    },
    channel: {
        type: String,
        required: false
    },
    channelId: {
        type: String,
        required: false
    },
    views: {
        type: String,
        required: false
    },
    videoId: {
        type: String,
        required: false
    },
    url: {
        type: String,
        required: false
    },
    thumbnail: {
        type: String,
        required: false
    },
    userId: {
        type: String,
        required: false
    },
    platform: {
        type: String,
        required: false
    },
    comments: {
        type: Array,
        required: false
    },
    dateAdded: {
        type: Date,
        required: false
    }
});

module.exports = mongoose.model('videolists', videoListSchema)