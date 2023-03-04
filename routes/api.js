const { getYoutubeVideoId } = require('../js/utils');
const router = require('express').Router();
const extUsers = require('../schema/users');
const videoList = require('../schema/video-list');
const fetch = require('node-fetch');

router.post('/getuser', async (req, res) => {
    // Fetch user's data
    const result = await extUsers.findOne({ userId: req.body.userId });
    // Fetch user's Discord avatar
    if (result && result.userId) {
        const userData = await fetch(`https://discord.com/api/v10/users/${result.userId}`, {
            method: 'GET',
            headers: {
                Authorization: `${process.env.API_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        const response = await userData.json();
        res.send({ result: result, avatar: response.avatar });
    } else {
        res.send({ error: 'Unknown user' });
    }
});

router.get('/getusers', async (req, res) => {
    // Fetch user data
    const results = await extUsers.find();
    // Sort high to low for watches
    // Watches
    results.sort(function (a, b) {
        return (b.watches || 0) - (a.watches || 0);
    });
    const watches = results.slice(0, 50);
    // Views
    results.sort(function (a, b) {
        return (b.views || 0) - (a.views || 0);
    });
    const views = results.slice(0, 50);
    // Likes
    results.sort(function (a, b) {
        return (b.likes || 0) - (a.likes || 0);
    });
    const likes = results.slice(0, 50);
    if (results) {
        res.send({ watches: watches, views: views, likes: likes });
    } else {
        res.send({ error: 'No data found' });
    }
});

router.post('/addvideo', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
        try {
            // Fetch user data and check token count
            const userResult = await extUsers.findOne({ userId: req.body.userId });
            if (!userResult || !userResult.tokens || userResult.tokens < 5) {
                res.send({ error: `You don't have enough tokens` });
                return;
            }
            // Get the video ID from the submitted URL or string
            const videoId = getYoutubeVideoId(req.body.videoId);
            if (videoId) {
                // Fetch the YouTube video page and If the video is unavailable or private,
                //return an error response and exit the function
                const resolve = await fetch(`https://www.youtube.com/watch?v=${videoId}`);
                const response = await resolve.text();
                if (response.includes(`This video isn't available any more`) || response.includes(`This is a private video`)) {
                    res.send({ error: `Video is private, unavailable, or doesn't exist` });
                    return;
                }
                // Fetch the video data
                const hasVideoInQueue = await videoList.findOne({ userId: req.body.userId });
                const videoAlreadyInQueue = await videoList.findOne({ videoId: videoId });
                if (videoAlreadyInQueue) {
                    res.send({ error: `This video is already in the queue` });
                    return;
                }
                const oneDay = 24 * 60 * 60 * 1000;
                // Create an entry if the video doesn't exist in the queue yet
                if (!hasVideoInQueue) {
                    // Fetch the user's data
                    const userResult = await extUsers.findOne({ userId: req.body.userId });
                    const currentSubmissions = !userResult?.submissions ? 0 : userResult.submissions;
                    videoList.create({
                        userId: req.body.userId,
                        videoId: videoId,
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
            } else {
                res.send({ error: `Not a valid video URL or ID` });
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

router.post('/usertokens', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
        try {
            const userResult = await extUsers.findOne({ userId: req.body.userId });
            if (userResult) {
                res.send({ tokens: userResult.tokens });
            } else {
                res.send({ error: 'No user data found' });
            }
        } catch (err) {
            res.send({ error: 'Unknown error occurred' });
            console.error('There was a problem : ', err);
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
            if (!videoResult) return;
            const currentWatches = !videoResult?.watches ? 0 : videoResult?.watches;
            await videoList.updateOne(
                { videoId: req.body.videoId },
                { watches: currentWatches + req.body.amount },
                { upsert: false }
            );
            // Update the watchee's view count
            const watcheeResult = await extUsers.findOne({ userId: videoResult.userId });
            const currentViews = !watcheeResult?.views ? 0 : watcheeResult?.views;
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
            if (!videoResult) return;
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

router.post('/sendnotification', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
        try {
            const createChannel = await fetch(`https://discord.com/api/v10/users/@me/channels`, {
                method: 'POST',
                headers: {
                    Authorization: `${process.env.API_TOKEN}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipient_id: req.body.userId
                })
            });
            const channelData = await createChannel.json();
            if (channelData.id) {
                await fetch(`https://discord.com/api/v10/channels/${channelData.id}/messages`, {
                    method: 'POST',
                    headers: {
                        Authorization: `${process.env.API_TOKEN}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        content: `**Extension Notification** \n> You are eligible to submit a new video \n\n*Disable notifications via the extension's settings menu*`
                    })
                });
            }
            res.send({ message: 'Notification sent' });
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
                expires: null
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