const router = require('express').Router();

router.get('/', async (req, res) => {
    const { message } = req.query;
    const defaultMessage = '';
    res.render('success', { message: message || defaultMessage });
});

module.exports = router;