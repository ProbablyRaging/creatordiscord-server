const mongoose = require('mongoose');

const resourcesSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    snippet: {
        type: String,
        required: true
    },
    raw: {
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
    },
    date: {
        type: String,
        required: true
    },
});

module.exports = mongoose.model('resources', resourcesSchema);