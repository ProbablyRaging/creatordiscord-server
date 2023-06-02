require('dotenv').config();
const express = require('express');
const next = require('next');

const port = process.env.PORT;
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

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

const server = express();

server.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

server.use(bodyParser.json({ limit: '50mb' }));
server.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

server.use(session({
    secret: 'some secret',
    saveUninitialized: false,
    resave: false
}));
server.use(passport.session());
server.use(express.static(path.join(__dirname, 'public')));

server.set('view engine', 'ejs');
server.set('views', [
    path.join(__dirname, '/views')
]);

// Extension routes
const auth = require('./routes/auth');
server.use('/auth', auth);

const success = require('./routes/success');
server.use('/success', success);

const error = require('./routes/error');
server.use('/error', error);

// API routes
const api = require('./routes/api');
server.use('/api', api);

// Next.js request handler
app.prepare().then(() => {
    server.get('*', (req, res) => {
        return handle(req, res);
    });

    server.listen(port, () => {
        console.log(`Listening on port: ${port}`);
    });
});
