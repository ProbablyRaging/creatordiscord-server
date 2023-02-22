const router = require('express').Router();

router.get('/', async (req, res) => {
    const { message } = req.query;
    const defaultMessage = 'An unknown error occurred';
    res.render('error', { message: message || defaultMessage });
});

module.exports = router;