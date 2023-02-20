const router = require('express').Router();

router.get('/queuefinished', async (req, res) => {
    res.render('success', { message: `End of queue` });
});

module.exports = router;