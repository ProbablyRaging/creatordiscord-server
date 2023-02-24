const cronjob = require('cron').CronJob;
const videoList = require('../schema/video-list');
const extUsers = require('../schema/users');

module.exports = async () => {
    // Update user stats and clear video list
    const removeExpiredVideos = new cronjob('*/10 * * * *', async function () {
        const videoResults = await videoList.find();
        // Make sure there are always 5 videos in the queue
        if (videoResults.length <= 5) return;
        for (const data of videoResults) {
            if (new Date().valueOf() > data.expires) {
                await videoList.deleteOne({ videoId: data.videoId });
            }
        }
    });
    removeExpiredVideos.start();

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