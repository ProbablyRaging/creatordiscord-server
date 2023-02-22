const router = require('express').Router();
const extUsers = require('../schema/users');
const videoList = require('../schema/video-list');
const { msToHours } = require('../js/utils');
const fetch = require('node-fetch');

router.post('/getuser', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && origin.includes(process.env.API_KEY)) {
        // Fetch a user and return the results
        const result = await extUsers.findOne({ userId: req.body.userId });
        if (result) res.send({ "result": result });
        if (!result) res.send({ "result": false });
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/submitvideoid', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && origin.includes(process.env.API_KEY)) {
        try {
            // Fetch the YouTube video page and If the video is unavailable or private,
            //return an error response and exit the function
            const resolve = await fetch(`https://www.youtube.com/watch?v=${req.body.videoId}`);
            const response = await resolve.text();
            if (response.includes(`This video isn't available any more`) || response.includes(`This is a private video`)) {
                res.send({ error: `Video is private, unavailable or doesn't exist` });
                return;
            }
            // Fetch the video data
            const videoResult = await videoList.findOne({ videoId: req.body.videoId });
            const oneDay = 24 * 60 * 60 * 1000;
            // Create an entry if the video doesn't exist in the queue yet
            if (!videoResult) {
                // Fetch the user's data
                const userResult = await extUsers.findOne({ userId: req.body.userId });
                // Check if the user reached their daily limit
                if (new Date().valueOf() < userResult.limit) {
                    res.send({ error: `You must wait ${msToHours(userResult.limit)}` });
                    return;
                } else {
                    // If the users hasn't reached their daily limit
                    videoList.create({
                        userId: req.body.userId,
                        videoId: req.body.videoId,
                        watches: 0
                    });
                    // Update the user's daily limit timestamp
                    extUsers.updateOne(
                        { userId: req.body.userId },
                        { tokens: userResult.tokens - 5, limit: new Date().valueOf() + oneDay },
                        { upsert: true }
                    ).exec();
                    res.send({ message: 'Successfully added to the queue' });
                }
            } else {
                // If the video already exists in the queue
                res.send({ error: `Already in the queue` });
            }
        } catch (err) {
            // If an error occurs, return an error response and log the error
            res.send({ error: 'An error occurred' });
            console.error('There was a problem: ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.get('/videolist', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && origin.includes(process.env.API_KEY)) {
        try {
            const results = await videoList.find().sort({ watches: 1 });;
            if (results.length < 1) {
                res.send({ error: 'No videos in queue' });
            } else {
                let videoData = [];
                results.forEach(result => {
                    videoData.push(result.videoId);
                });
                res.send({ videoList: videoData });
            }
        } catch (err) {
            console.error('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/addtokens', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && origin.includes(process.env.API_KEY)) {
        try {
            // Fetch the user and add the appropriate amount of tokens
            const userResult = await extUsers.findOne({ userId: req.body.userId });
            // If user has reached daily cap, return
            const currentTokens = !userResult.tokens ? 0 : userResult.tokens;
            const currentTokenCap = !userResult.tokenCap ? 0 : userResult.tokenCap;
            if (userResult.tokenCap >= 10) {
                res.send({ message: 'Daily tokens cap reached' });
                return;
            } else {
                extUsers.updateOne(
                    { userId: req.body.userId },
                    {
                        tokens: currentTokens + req.body.amount,
                        tokenCap: currentTokenCap + req.body.amount
                    },
                    { upsert: true }
                ).exec();
                res.send({ message: 'Tokens added' });
            }
        } catch (err) {
            res.send({ error: 'An error occurred' });
            console.error('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/addwatch', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && origin.includes(process.env.API_KEY)) {
        try {
            // Fetch the video data and increment the watch count
            const videoResult = await videoList.findOne({ videoId: req.body.videoId });
            const currentWatches = !videoResult.watches ? 0 : videoResult.watches;
            videoList.updateOne(
                { videoId: req.body.videoId },
                { watches: currentWatches + req.body.amount },
                { upsert: true }
            ).exec();
            res.send({ message: 'Watch added' });
        } catch (err) {
            res.send({ error: 'An error occurred' });
            console.error('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/logout', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && origin.includes(process.env.API_KEY)) {
        try {
            extUsers.updateOne({
                userId: req.body.userId
            }, {
                expires: 0
            }, {
                upsert: true
            }).exec();
            res.send({ message: 'Successfull' });
        } catch (err) {
            res.send({ error: 'An error occurred' });
            console.error('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

module.exports = router;