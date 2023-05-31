const mongoose = require('mongoose');

const resourcesminSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    snippet: {
        type: String,
        required: true
    },
    thumb: {
        type: String,
        required: true
    },
    slug: {
        type: String,
        required: true
    }
});

module.exports = mongoose.model('resources_min', resourcesminSchema);