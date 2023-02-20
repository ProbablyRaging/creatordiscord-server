const mongoose = require('mongoose');

const videoListSchema = mongoose.Schema({
    videoIds: {
        type: Array,
        required: false
    }
});

module.exports = mongoose.model('videolists', videoListSchema)