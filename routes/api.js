const router = require('express').Router();
const extUsers = require('../schema/users');
const videoList = require('../schema/video-list');
const fetch = require('node-fetch');

router.post('/getuser', async (req, res) => {
    // Fetch a user and return the results
    const result = await extUsers.findOne({ userId: req.body.userId });
    if (result) res.send({ "result": result });
    if (!result) res.send({ "result": false });
});

router.post('/addvideo', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
        try {
            // Additional formatting of video id to prevent errors
            req.body.videoId = req.body.videoId.replace(/&\S*|&$/g, '');
            // If not a valid youtube video ID
            const regex = /^[a-zA-Z0-9_-]{11}$/;
            if (!regex.test(req.body.videoId) || req.body.videoId.length !== 11) {
                res.send({ error: 'Not a valid video ID' });
                return;
            }
            // Fetch the YouTube video page and If the video is unavailable or private,
            //return an error response and exit the function
            const resolve = await fetch(`https://www.youtube.com/watch?v=${req.body.videoId}`);
            const response = await resolve.text();
            if (response.includes(`This video isn't available any more`) || response.includes(`This is a private video`)) {
                res.send({ error: `Video is private, unavailable or doesn't exist` });
                return;
            }
            // Fetch the video data
            const videoResult = await videoList.findOne({ userId: req.body.userId });
            const oneDay = 24 * 60 * 60 * 1000;
            // Create an entry if the video doesn't exist in the queue yet
            if (!videoResult) {
                // Fetch the user's data
                const userResult = await extUsers.findOne({ userId: req.body.userId });
                const currentSubmissions = !userResult?.submissions ? 0 : userResult.submissions;
                videoList.create({
                    userId: req.body.userId,
                    videoId: req.body.videoId,
                    watches: 0,
                    expires: new Date().valueOf() + oneDay
                });
                // Update the user's tokens and submission count
                extUsers.updateOne(
                    { userId: req.body.userId },
                    { tokens: userResult.tokens - 5, submissions: currentSubmissions + 1 },
                    { upsert: true }
                ).exec();
                res.send({ message: 'Successfully added to the queue' });

            } else {
                // If the video already exists in the queue
                res.send({ error: `You already have a video in the queue` });
            }
        } catch (err) {
            // If an error occurs, return an error response and log the error
            res.send({ error: 'Unknown error occurred' });
            console.error('There was a problem: ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.get('/videolist', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
        try {
            const results = await videoList.find().sort({ watches: 1 });
            if (results.length < 1) {
                res.send({ error: 'No videos in queue' });
            } else {
                let videoData = [];
                let watchCount = 0;
                results.forEach(result => {
                    videoData.push({ videoId: result.videoId, watches: result.watches, userId: result.userId, expires: result.expires });
                    watchCount = watchCount + result.watches;
                });
                res.send({ videoList: videoData, watchCount: watchCount });
            }
        } catch (err) {
            res.send({ error: 'Unknown error occurred' });
            console.error('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/addtokens', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
        try {
            // Fetch the user and add the appropriate amount of tokens
            const userResult = await extUsers.findOne({ userId: req.body.userId });
            // If user has reached daily cap, return
            const currentTokens = !userResult.tokens ? 0 : userResult.tokens;
            const currentTokenCap = !userResult?.tokenCap ? 0 : userResult.tokenCap;
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
            res.send({ error: 'Unknown error occurred' });
            console.error('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/addwatch', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
        try {
            // Update the videos watch count
            const videoResult = await videoList.findOne({ videoId: req.body.videoId });
            const currentWatches = !videoResult?.watches ? 0 : videoResult.watches;
            await videoList.updateOne(
                { videoId: req.body.videoId },
                { watches: currentWatches + req.body.amount },
                { upsert: false }
            );
            // Update the watchee's view count
            const watcheeResult = await extUsers.findOne({ userId: videoResult.userId });
            const currentViews = !watcheeResult?.views ? 0 : watcheeResult.views;
            await extUsers.updateOne(
                { userId: videoResult.userId },
                { views: currentViews + req.body.amount },
                { upsert: false }
            );
            // Update the watcher's watch count
            const watcherResult = await extUsers.findOne({ userId: req.body.userId });
            const currentUserWatches = !watcherResult?.watches ? 0 : watcherResult?.watches;
            await extUsers.updateOne(
                { userId: req.body.userId },
                { watches: currentUserWatches + req.body.amount },
                { upsert: false }
            );
            res.send({ message: 'Watch added' });
        } catch (err) {
            res.send({ error: 'Unknown error occurred' });
            console.error('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/addlike', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
        try {
            // Fetch the liked video's data
            const videoResult = await videoList.findOne({ videoId: req.body.videoId });
            // Update the watchee's view count
            const userResult = await extUsers.findOne({ userId: videoResult.userId });
            const currentLikes = !userResult?.likes ? 0 : userResult.likes;
            extUsers.updateOne(
                { userId: videoResult.userId },
                { likes: currentLikes + req.body.amount },
                { upsert: true }
            ).exec();
            res.send({ message: 'Like added' });
        } catch (err) {
            res.send({ error: 'Unknown error occurred' });
            console.error('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/logout', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
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
            res.send({ error: 'Unknown error occurred' });
            console.error('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

module.exports = router;