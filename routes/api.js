const { getYoutubeVideoId, getTwitchVideoId, getYouTubeVideoData, getTwitchVideoData } = require('../js/utils');
const router = require('express').Router();
const extUsers = require('../schema/users');
const videoList = require('../schema/video_list');
const channelList = require('../schema/channel_list');
const resources = require('../schema/resources');
const resourcesMin = require('../schema/resources_min');
const fetch = require('node-fetch');
const { default: axios } = require('axios');

router.post('/validate', async (req, res) => {
    console.log(req.headers);
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
        const results = await extUsers.findOne({ sessionId: req.body.data });
        res.send({ data: results });
    }
});

router.get('/videolist', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
        try {
            const page = req.query.page || 1;
            const results = await videoList.find().limit(30).skip((page - 1) * 30).sort({ dateAdded: -1 });

            if (results.length < 1) {
                res.send({ error: 'No videos found' });
            } else {
                res.send({ videoList: results });
            }
        } catch (err) {
            res.send({ error: 'Unknown error occurred' });
            console.error('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.get('/channellist', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
        try {
            const results = await channelList.find().limit(10).sort({ channelName: 1 });
            if (results.length < 1) {
                res.send({ error: 'No channels found' });
            } else {
                res.send({ channelList: results });
            }
        } catch (err) {
            res.send({ error: 'Unknown error occurred' });
            console.error('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/channelvideos', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
        try {
            const results = await videoList.find({ channelId: req.body.data }).sort({ dateAdded: -1 });
            if (results.length < 1) {
                res.send({ error: 'No videos found' });
            } else {
                res.send({ videoList: results });
            }
        } catch (err) {
            res.send({ error: 'Unknown error occurred' });
            console.error('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/filter', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
        try {
            if (req.body.data === 'newest') {
                const results = await videoList.find().sort({ dateAdded: -1 });
                if (results.length < 1) {
                    res.send({ error: 'No videos found' });
                } else {
                    res.send({ videoList: results });
                }
            } else if (req.body.data === 'oldest') {
                const results = await videoList.find().sort({ dateAdded: 1 });
                if (results.length < 1) {
                    res.send({ error: 'No videos found' });
                } else {
                    res.send({ videoList: results });
                }
            } else if (req.body.data === 'youtube') {
                const results = await videoList.find({ platform: 'youtube' }).sort({ dateAdded: -1 });
                if (results.length < 1) {
                    res.send({ error: 'No videos found' });
                } else {
                    res.send({ videoList: results });
                }
            } else if (req.body.data === 'twitch') {
                const results = await videoList.find({ platform: 'twitch' }).sort({ dateAdded: -1 });
                if (results.length < 1) {
                    res.send({ error: 'No videos found' });
                } else {
                    res.send({ videoList: results });
                }
            }
        } catch (err) {
            res.send({ error: 'Unknown error occurred' });
            console.error('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/addvideo_youtube', async (req, res) => {
    // const origin = req.headers?.origin;
    // if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
    const videoId = getYoutubeVideoId(req.body.data);
    if (videoId) {
        // Get video data
        await getYouTubeVideoData(req, res, videoId);
    } else {
        res.send({ error: `Not a valid video URL or ID` });
    }
    // }
});

router.post('/addvideo_twitch', async (req, res) => {
    // const origin = req.headers?.origin;
    // if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
    const videoId = getTwitchVideoId(req.body.data);
    if (videoId) {
        // Get video data
        await getTwitchVideoData(req, res, videoId);
    } else {
        res.send({ error: `Not a valid video URL or ID` });
    }
    // }
});

router.post('/logout', async (req, res) => {
    const origin = req.headers?.origin;
    if (origin && (origin.includes(process.env.API_KEY) || origin.includes(process.env.API_KEY_DEV))) {
        try {
            extUsers.updateOne({
                sessionId: req.body.data
            }, {
                expires: null,
                sessionId: null
            }, {
                upsert: true
            }).exec();
            res.send({ message: 'Successfully logged out' });
        } catch (err) {
            res.send({ error: 'Unknown error occurred' });
            console.error('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

/**
 * The following are routes used solely for forthecontent.xyz
 */
router.get('/membercount', async (req, res) => {
    const origin = req.headers?.referer;
    if (origin && (origin.includes('creatordiscord.xyz'))) {
        try {
            const resolve = await fetch(`https://discord.com/api/v9/guilds/${process.env.SERVER_ID}?with_counts=true`, { headers: { "Authorization": `${process.env.API_TOKEN}` } });
            const data = await resolve.json();
            const memberCount = parseInt(data.approximate_member_count).toLocaleString();
            res.send({ message: memberCount });
        } catch (err) {
            res.send({ error: 'Unknown error occurred' });
            console.log('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/resources', async (req, res) => {
    const origin = req.headers?.referer;
    if (origin && (origin.includes('creatordiscord.xyz') || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        try {
            if (req.body.resource) {
                const result = await resources.findOne({ slug: req.body.resource });
                if (result) {
                    res.send({ message: result });
                } else {
                    res.send({ error: 'No data' });
                }
            } else if (req.body.page) {
                const { page } = req.body;
                const pageSize = 6;
                const skip = (page - 1) * pageSize;
                const results = await resourcesMin.find().skip(skip).limit(pageSize);
                if (results.length > 0) {
                    res.send({ message: results });
                } else {
                    res.send({ error: 'No results found' });
                }
            } else {
                const results = await resourcesMin.find();
                if (results.length > 0) {
                    res.send({ message: results });
                } else {
                    res.send({ error: 'No results found' });
                }
            }
        } catch (err) {
            res.send({ error: 'Unknown error occurred' });
            console.log('There was a problem: ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/createresource', async (req, res) => {
    const origin = req.headers?.referer;
    if (origin && (origin.includes('creatordiscord.xyz') || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        try {
            if (req.body.slug) {
                await resources.create({
                    title: req.body.title,
                    snippet: req.body.snippet,
                    keywords: req.body.keywords,
                    thumb: req.body.thumb,
                    raw: req.body.raw,
                    slug: req.body.slug,
                    date: req.body.date
                });
                await resourcesMin.create({
                    title: req.body.title,
                    snippet: req.body.snippet,
                    thumb: req.body.thumb,
                    slug: req.body.slug
                });
                res.send({ message: 'Ok' });
            } else {
                res.send({ error: 'No slug provided' });
            }
        } catch (err) {
            res.send({ error: 'Unknown error occurred' });
            console.log('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/updateresource', async (req, res) => {
    const origin = req.headers?.referer;
    if (origin && (origin.includes('creatordiscord.xyz') || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        try {
            if (req.body.slug) {
                await resources.updateOne(
                    { slug: req.body.slug },
                    {
                        title: req.body.title,
                        thumb: req.body.thumb,
                        keywords: req.body.keywords,
                        raw: req.body.raw,
                        slug: req.body.newSlug
                    },
                    { upsert: false }
                ).exec();
                await resourcesMin.updateOne(
                    { slug: req.body.slug },
                    {
                        title: req.body.title,
                        thumb: req.body.thumb,
                        slug: req.body.newSlug
                    },
                    { upsert: false }
                ).exec();
                res.send({ message: 'Ok' });
            } else {
                res.send({ error: 'No slug provided' });
            }
        } catch (err) {
            res.send({ error: 'Unknown error occurred' });
            console.log('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/deleteresource', async (req, res) => {
    const origin = req.headers?.referer;
    if (origin && (origin.includes('creatordiscord.xyz') || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        try {
            if (req.body.slug) {
                await resources.deleteOne({ slug: req.body.slug }).exec();
                await resourcesMin.deleteOne({ slug: req.body.slug }).exec();
                res.send({ message: 'Ok' });
            } else {
                res.send({ error: 'No slug provided' });
            }
        } catch (err) {
            res.send({ error: 'Unknown error occurred' });
            console.log('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.post('/validates', (req, res) => {
    const origin = req.headers?.referer;
    if (origin && (origin.includes('creatordiscord.xyz') || origin.includes('localhost') || origin.includes('127.0.0.1'))) {
        try {
            if (req.body.loginToken) {
                if (req.body.loginToken === process.env.EDITOR_TOKEN) {
                    res.send({ cookie: process.env.COOKIE_SECRET });
                } else {
                    res.status(401).send({ error: 'Incorrect password' });
                }
            } else if (req.body.validateToken && req.body.validateToken.includes(process.env.COOKIE_SECRET)) {
                res.send({ success: true });
            } else {
                res.send({ error: 'Unknown request' });
            }
        } catch (err) {
            console.log('There was a problem : ', err);
        }
    } else {
        res.send({ message: 'Access denied' });
    }
});

router.get('/ghrepos', async (req, res) => {
    const query = `{
        user(login: "ProbablyRaging") {
          pinnedItems(first: 6, types: REPOSITORY) {
            nodes {
              ... on Repository {
                name
                description
                stargazerCount
                forkCount
                primaryLanguage {
                  name
                }
              }
            }
          }
        }
      }`;

    const githubRepos = await fetch(`https://api.github.com/graphql`, {
        method: 'POST',
        body: JSON.stringify({ query }),
        headers: {
            Authorization: `Bearer ${process.env.GH_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });
    const response = await githubRepos.json();
    res.send({ repos: response });
});

module.exports = router;