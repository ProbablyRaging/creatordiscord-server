require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT;
const { mongodb } = require('./mongo');
const bodyParser = require('body-parser');
const compression = require('compression');
const passport = require('passport');
const session = require('express-session');
const startTimers = require('./js/timers');
const path = require('path');

// Connect to the database
mongodb.then(() => {
    console.log('Connected to the database');
}).catch(err => {
    console.error(`${path.basename(__filename)} There was a problem connecting to the database: `, err);
});

startTimers();

app.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

app.use(session({
    secret: 'some secret',
    saveUninitialized: false,
    resave: false
}));
app.use(passport.session());
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', [
    path.join(__dirname, '/views'),
    path.join(__dirname, '/next')  // Add path to Next.js app's .next directory
]);

// Extension routes
const auth = require('./routes/auth');
app.use('/auth', auth);

const success = require('./routes/success');
app.use('/success', success);

const error = require('./routes/error');
app.use('/error', error);

// API routes
const api = require('./routes/api');
app.use('/api', api);

// Next.js route
const nextApp = require('next')({ dev: process.env.NODE_ENV !== 'production' });
const nextHandler = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
    app.get('/next/*', (req, res) => {
        nextHandler(req, res);
    });

    app.get('*', (req, res) => {
        nextHandler(req, res);
    });

    app.listen(port, () => {
        console.log(`Listening on port: ${port}`);
    });
}).catch((err) => {
    console.error('Error starting Next.js:', err);
});