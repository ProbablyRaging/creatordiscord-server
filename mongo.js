const mongoose = require('mongoose');
const path = require('path');

// Remove dep warning
mongoose.set('strictQuery', true);

const mongodb = mongoose.connect(process.env.DB_PATH, { useNewUrlParser: true, useUnifiedTopology: true })
    .catch(err => console.error(`${path.basename(__filename)} There was a problem connecting to the database: `, err));
    
module.exports = { mongodb }