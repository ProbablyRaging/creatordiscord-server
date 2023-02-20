const router = require('express').Router();

router.get('/', async (req, res) => {
    res.render('error', { message: 'An unknown error occurred' });
});

router.get('/queuefinished', async (req, res) => {
    res.render('error', { message: `` });
});

router.get('/emptyqueue', async (req, res) => {
    res.render('error', { message: 'The video queue is empty' });
});

module.exports = router;