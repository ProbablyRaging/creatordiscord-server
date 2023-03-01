const cronjob = require('cron').CronJob;
const videoList = require('../schema/video-list');
const extUsers = require('../schema/users');
const fetch = require('node-fetch');

module.exports = async () => {
    // Update user stats and clear video list
    const removeExpiredVideos = new cronjob('*/5 * * * *', async function () {
        const videoResults = await videoList.find();
        // Make sure there are always 5 videos in the queue
        if (videoResults.length <= 5) {
            // Give each video one extra hour to expire
            const oneHour = 1 * 60 * 60 * 1000;
            for (const data of videoResults) {
                await videoList.updateOne({
                    videoId: data.videoId
                }, {
                    expires: new Date().valueOf() + oneHour
                }, {
                    upsert: true
                });
            }
        } else {
            for (const data of videoResults) {
                if (new Date().valueOf() > data.expires) {
                    await videoList.deleteOne({ videoId: data.videoId });
                }
            }
        }
    });
    removeExpiredVideos.start();

    // Remove entries from users who no longer exist in the server or have no
    // used the extension in over a month
    const removeOldUser = new cronjob('0 0 * * *', async function () {
        const results = await extUsers.find();
        for (const data of results) {
            try {
                // Not longer in server
                const response = await fetch(`https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/members/${data.userId}`, {
                    method: 'GET',
                    headers: {
                        Authorization: `${process.env.API_TOKEN}`
                    }
                });
                if (response.statusText === 'Not Found') {
                    await extUsers.deleteOne({ _id: data._id });
                    console.log(`Removed ${data.userId}. Reason: ${response.statusText}`);
                }
                // Not used extension in a month
                const oneMonth = 30 * 24 * 60 * 60 * 1000;
                if (data.expires && data.expires < (new Date().valueOf() - oneMonth)) {
                    await extUsers.deleteOne({ _id: data._id });
                    console.log(`Removed ${data.userId}. Reason: Stale account`);
                }
            } catch (err) {
                console.log('There was a problem : ', err);
            }
        }
    });
    removeOldUser.start();

    // Reset token caps
    const resetTokenCaps = new cronjob('0 0 * * *', async function () {
        const userResults = await extUsers.find();
        for (const data of userResults) {
            await extUsers.updateOne({
                userId: data.userId
            }, {
                tokenCap: 0
            }, {
                upsert: true
            });
        }
    });
    resetTokenCaps.start();
}