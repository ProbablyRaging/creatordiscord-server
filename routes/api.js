const router = require('express').Router();
const extUsers = require('../schema/users');
const videoList = require('../schema/video-list');

router.post('/getuser', async (req, res) => {
    const result = await extUsers.findOne({ userId: req.body.userId });
    if (result) res.send({ "result": result });
    if (!result) res.send({ "result": false });
});

router.post('/submitvideoid', async (req, res) => {
    try {
        const result = await videoList.findOne();
        if (!result) {
            videoList.create({
                videoIds: [req.body.videoId]
            });
        } else {
            const currentList = result.videoIds;
            let updatedList = currentList;
            updatedList.push(req.body.videoId);
            videoList.updateOne(
                { _id: result._id },
                { videoIds: updatedList },
                { upsert: true }
            ).exec();
        }
        const userResult = await extUsers.findOne({ userId: req.body.userId });
        extUsers.updateOne(
            { userId: req.body.userId },
            { tokens: userResult.tokens - 5 },
            { upsert: true }
        ).exec();
        res.sendStatus(200);
    } catch (err) {
        res.sendStatus(500);
        console.error('There was a problem: ', err);
    }
});

router.post('/addtokens', async (req, res) => {
    try {
        const userResult = await extUsers.findOne({ userId: req.body.userId });
        const currentTokens = userResult.tokens < 1 ? 0 : userResult.tokens;
        extUsers.updateOne(
            { userId: req.body.userId },
            { tokens: currentTokens + req.body.amount },
            { upsert: true }
        ).exec();
        res.sendStatus(200);
    } catch (err) {
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

module.exports = router;