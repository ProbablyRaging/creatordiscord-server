const router = require('express').Router();
const extUsers = require('../schema/users');
const videoList = require('../schema/video-list');
const { msToHours } = require('../js/utils');
const fetch = require('node-fetch');

router.post('/getuser', async (req, res) => {
    // Fetch a user and return the results
    const result = await extUsers.findOne({ userId: req.body.userId });
    if (result) res.send({ "result": result });
    if (!result) res.send({ "result": false });
});

router.post('/submitvideoid', async (req, res) => {
    try {
        // Fetch the YouTube video page
        const resolve = await fetch(`https://www.youtube.com/watch?v=${req.body.videoId}`);
        const response = await resolve.text();
        // If the video is unavailable or private, return an error response and exit the function
        if (response.includes(`This video isn't available any more`) || response.includes(`This is a private video`)) {
            res.send({ error: `Video is private, unavailable or doesn't exist` });
            return;
        }
        // Check if there is an existing video list in the database, and add the new video ID to it
        const userResult = await extUsers.findOne({ userId: req.body.userId });
        const result = await videoList.findOne();
        const oneDay = 24 * 60 * 60 * 1000;
        if (!result) {
            videoList.create({
                videoIds: [req.body.videoId]
            });
            extUsers.updateOne(
                { userId: req.body.userId },
                { tokens: userResult.tokens - 5, limit: new Date().valueOf() + oneDay },
                { upsert: true }
            ).exec();
            res.send({ message: 'Successfully added to queue' });
        } else {
            const currentList = result.videoIds;
            // If the video is already in the queue or if the user has already
            // submitted a video today, return an error response and exit the function
            if (currentList.includes(req.body.videoId)) {
                res.send({ error: `Video already in queue, try again tomorrow` });
                return;
            } if (new Date().valueOf() < userResult.limit) {
                res.send({ error: `You've already submitted a video today \n Submit again in ${msToHours(userResult.limit)}` });
                return;
            } else {
                // Otherwise, add the video to the queue, deduct 5 tokens from the user's account
                // and set a timestamp to only allow one submission per day
                let updatedList = currentList;
                updatedList.push(req.body.videoId);
                videoList.updateOne(
                    { _id: result._id },
                    { videoIds: updatedList },
                    { upsert: true }
                ).exec();
                extUsers.updateOne(
                    { userId: req.body.userId },
                    { tokens: userResult.tokens - 5, limit: new Date().valueOf() + oneDay },
                    { upsert: true }
                ).exec();
                res.send({ message: 'Successfully added to queue' });
            }
        }
    } catch (err) {
        // If an error occurs, return an error response and log the error
        res.send({ error: 'An error occurred' });
        console.error('There was a problem: ', err);
    }
});

router.post('/addtokens', async (req, res) => {
    try {
        // Fetch the user and add the appropriate amount of tokens
        const userResult = await extUsers.findOne({ userId: req.body.userId });
        // If user has reached daily cap, return
        const currentTokens = !userResult.tokens ? 0 : userResult.tokens;
        const currentTokenCap = !userResult.tokenCap ? 0 : userResult.tokenCap;
        if (userResult.tokenCap >= 5) {
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
});

router.get('/videolist', async (req, res) => {
    try {
        const result = await videoList.findOne();
        if (!result) {
            res.send({ error: 'No videos in queue' });
        } else {
            res.send({ videoList: result.videoIds });
        }
    } catch (err) {
        console.error('There was a problem : ', err);
    }
});

router.post('/logout', async (req, res) => {
    try {
        extUsers.updateOne({
            userId: req.body.userId
        },{
            expires: 0
        },{
            upsert: true
        }).exec();
        res.send({ message: 'Successfull' });
    } catch (err) {
        res.send({ error: 'An error occurred' });
        console.error('There was a problem : ', err);
    }
});

module.exports = router;