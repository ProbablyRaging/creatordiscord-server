const mongoose = require('mongoose');

const subscriptionsSchema = mongoose.Schema({
    paymentId: {
        type: String,
        required: true
    },
    customerEmail: {
        type: String,
        required: true
    },
    activated: {
        type: Boolean,
        require: false
    }
});

module.exports = mongoose.model('subscriptions', subscriptionsSchema);