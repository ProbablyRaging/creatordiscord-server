require('dotenv').config();
const express = require('express');
const app = express();
const port = process.env.PORT;
const { mongodb } = require('./mongo');
const bodyParser = require('body-parser');
const slashes = require('connect-slashes');
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
    path.join(__dirname, '/views')
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

// app.use((req, res, next) => {
//     if (req.path.substr(-1) === '/' && req.path.length > 1) {
//         console.log(req.path);
//         const newPath = req.path.slice(0, -1);
//         const query = req.url.slice(req.path.length);
//         res.redirect(301, newPath + query);
//     } else {
//         next();
//     }
// });

// React app route
app.use(express.static(path.join(__dirname, 'dist')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.get('/resources', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'resources', 'index.html'));
});

app.get('/resources/:slug', (req, res) => {
    const { slug } = req.params;
    res.sendFile(path.join(__dirname, 'dist', 'resources', slug, 'index.html'));
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
    console.log(`Listening on port: ${port}`);
});
