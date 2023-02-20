const router = require('express').Router();
const passport = require('passport');
const discordStrategy = require('../js/discord_auth');

router.get('/', (req, res, next) => {
    passport.authenticate('discord');
});

router.get('/redirect', (req, res, next) => {
    passport.authenticate('discord', {
        failureRedirect: '/error',
        successReturnToOrRedirect: '/auth/proceed',
        keepSessionInfo: false,
    })(req, res, next);
});

router.get('/proceed', async (req, res) => {
    const userId = req.user ? req.user.id : '';
    res.redirect(`/auth/success?user=${userId}`);
});

router.get('/success', async (req, res) => {
    res.render('success', { message: 'Successfully logged in. You can close this window.' });
});

module.exports = router;