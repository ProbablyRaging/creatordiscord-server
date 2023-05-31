const mongoose = require('mongoose');

const videoListSchema = mongoose.Schema({
    userId: {
        type: String,
        required: false
    },
    videoId: {
        type: String,
        required: false
    },
    channelId: {
        type: String,
        required: false
    },
    watches: {
        type: Number,
        required: false
    },
    expires: {
        type: String,
        required: false
    }
});

module.exports = mongoose.model('videolists', videoListSchema)