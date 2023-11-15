const videoList = require('../schema/video_list');
const channelList = require('../schema/channel_list');
const { default: axios } = require('axios');
const abbreviate = require('number-abbreviate');

function formatNumber(number) {
    const stringToNumer = parseInt(number);
    if (stringToNumer < 1000) return stringToNumer;
    const abbreviated = abbreviate(stringToNumer, 1);
    return abbreviated.replace(/[a-z]$/, match => match.toUpperCase());
}

function getYoutubeVideoId(string) {
    if (!string) return;
    string = string.replace(/&\S*|&$/g, '');
    // Check if the input string matches the video ID pattern
    const videoIdPattern = /^[\w\-_]{11}$/;
    if (videoIdPattern.test(string)) {
        return string;
    }
    // Otherwise, match http/https and youtu.be, youtube.com, and youtube.com/shorts/
    const urlPattern = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/|be\.com\/shorts\/)([\w\-_]*)(?:&t=[\dhms]+)?/i;
    const matchArray = urlPattern.exec(string);

    if (matchArray && matchArray[1]) {
        return matchArray[1];
    }
    // If no match is found, return null
    return null;
}

function getTwitchVideoId(string) {
    if (!string) return;
    string = string.replace(/&\S*|&$/g, '');
    // Check if the input string matches the Twitch video URL pattern
    const twitchPattern = /(?:https?:\/\/)?(?:www\.)?twitch\.tv\/videos\/(\d+)/;
    const matchArray = string.match(twitchPattern);

    if (matchArray && matchArray[1]) {
        return matchArray[1];
    }
    // If no match is found, return null
    return null;
}

async function getYouTubeVideoData(req, res, videoId) {
    const response = await axios.get(`https://youtube.googleapis.com/youtube/v3/videos?part=snippet,statistics,status,liveStreamingDetails&id=${videoId}&key=${process.env.GAPI_KEY}`);
    const videoData = response.data.items[0];
    const videoSnippet = videoData?.snippet;
    const videoStatus = videoData?.status.privacyStatus;
    const videoStats = videoData?.statistics;
    const videoLive = videoData?.liveStreamingDetails;

    // Check if the video exists, is unavailable, or is private
    if (!videoSnippet) return res.send({ error: `Unable to find a video with ID ${videoId}` });
    if (videoStatus !== 'public') return res.send({ error: `Please set the video's visibility to 'public'` });
    if (videoLive && !videoLive.actualEndTime) return res.send({ error: `Please end the stream before adding your video` });

    // Only allow videos to be added once
    try {
        const videoIdExists = await videoList.findOne({ videoId: videoId });
        if (!videoIdExists) {
            await videoList.create({
                title: videoSnippet.title,
                channel: videoSnippet.channelTitle,
                channelId: videoSnippet.channelId,
                views: formatNumber(videoStats.viewCount),
                videoId: videoId,
                url: `https://www.youtube.com/watch?v=${videoId}`,
                thumbnail: videoSnippet.thumbnails.high.url,
                userId: req.body.userId,
                platform: 'youtube',
                dateAdded: new Date()
            });
            res.send({ message: 'Successfully added video' });
            // Get channel data
            getYouTubeChannelData(req, res, videoSnippet.channelId);
        } else {
            res.send({ error: `This video has already been added` });
            return;
        }
    } catch (err) {
        res.send({ error: 'Unknown error occurred' });
        console.error('There was a problem : ', err);
    }
}

async function getYouTubeChannelData(req, res, channelId) {
    const response = await axios.get(`https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&id=${channelId}&key=${process.env.GAPI_KEY}`);
    const channelData = response.data.items[0];
    const channelSnippet = channelData?.snippet;
    const channelStats = channelData?.statistics;

    if (!channelSnippet || !channelStats) return;

    // Add channel data if it doeasn't already exist
    try {
        const channelListExists = await channelList.findOne({ channelId: channelId });
        if (!channelListExists) {
            channelList.create({
                channelId: channelId,
                name: channelSnippet.title,
                url: `https://www.youtube.com/channel/${channelSnippet.customUrl}`,
                subscriberCount: formatNumber(channelStats.subscriberCount),
                videoCount: formatNumber(channelStats.videoCount),
                avatar: channelSnippet.thumbnails.default.url,
                handle: channelSnippet.customUrl,
                joinDate: new Date()
            });
        } else {
            await channelList.findOneAndUpdate({
                channelId: channelId,
            }, {
                name: channelSnippet.title,
                url: `https://www.youtube.com/channel/${channelSnippet.customUrl}`,
                subscriberCount: formatNumber(channelStats.subscriberCount),
                videoCount: formatNumber(channelStats.videoCount),
                avatar: channelSnippet.thumbnails.default.url,
                handle: channelSnippet.customUrl,
            });
        }
    } catch (err) {
        console.error('There was a problem : ', err);
    }
}

async function getTwitchVideoData(req, res, videoId) {
    const getAccessToken = await axios.post(`https://id.twitch.tv/oauth2/token?client_id=${process.env.TAPI_ID}&client_secret=${process.env.TAPI_SECRET}&grant_type=client_credentials`);
    const accessToken = getAccessToken.data.access_token;
    const response = await axios.get(`https://api.twitch.tv/helix/videos?id=${videoId}`, { headers: { 'Authorization': `Bearer ${accessToken}`, 'Client-Id': process.env.TAPI_ID } });
    const videoData = response.data.data[0];

    // Check if the video exists, is unavailable, or is private
    if (!videoData) return res.send({ error: `Unable to find a video with ID ${videoId}` });
    if (videoData?.viewable !== 'public') return res.send({ error: `Please set the video's visibility to 'public'` });

    // Only allow videos to be added once
    try {
        const videoIdExists = await videoList.findOne({ videoId: videoId });
        if (!videoIdExists) {
            await videoList.create({
                title: videoData.title,
                channel: videoData.user_name,
                channelId: videoData.user_id,
                views: formatNumber(videoData.view_count),
                videoId: videoId,
                url: videoData.url,
                thumbnail: videoData.thumbnail_url.replace('%{width}', '320').replace('%{height}', '180'),
                userId: req.body.userId,
                platform: 'twitch',
                dateAdded: new Date()
            });
            res.send({ message: 'Successfully added video' });
            // Get channel data
            getTwitchChannelData(req, res, videoData.user_id, accessToken);
        } else {
            res.send({ error: `This video has already been added` });
            return;
        }
    } catch (err) {
        res.send({ error: 'Unknown error occurred' });
        console.error('There was a problem : ', err);
    }
}

async function getTwitchChannelData(req, res, channelId, accessToken) {
    const response = await axios.get(`https://api.twitch.tv/helix/users?id=${channelId}`, { headers: { 'Authorization': `Bearer ${accessToken}`, 'Client-Id': process.env.TAPI_ID } });
    const channelData = response.data.data[0];
    const getFollowerCount = await axios.get(`https://api.twitch.tv/helix/channels/followers?broadcaster_id=${channelId}`, { headers: { 'Authorization': `Bearer ${accessToken}`, 'Client-Id': process.env.TAPI_ID } });
    const followerCount = getFollowerCount.data.total;

    // Add channel data if it doeasn't already exist
    try {
        const channelListExists = await channelList.findOne({ channelId: channelId });
        if (!channelListExists) {
            channelList.create({
                channelId: channelId,
                name: channelData.display_name,
                url: `https://www.twitch.tv/${channelData.login}`,
                subscriberCount: formatNumber(followerCount),
                avatar: channelData.profile_image_url,
                joinDate: new Date()
            });
        } else {
            await channelList.findOneAndUpdate({
                channelId: channelId,
            }, {
                name: channelData.display_name,
                url: `https://www.twitch.tv/${channelData.login}`,
                subscriberCount: formatNumber(followerCount),
                avatar: channelData.profile_image_url,
            });
        }
    } catch (err) {
        console.error('There was a problem : ', err);
    }
}

module.exports = {
    getYoutubeVideoId,
    getTwitchVideoId,
    getYouTubeVideoData,
    getTwitchVideoData
}