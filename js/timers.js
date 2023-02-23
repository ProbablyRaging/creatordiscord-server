const cronjob = require('cron').CronJob;
const videoList = require('../schema/video-list');
const extUsers = require('../schema/users');

module.exports = async () => {
    // Update user stats and clear video list
    const clearVideoList = new cronjob('0 0 * * *', async function () {
        // Delete all but 5 videos
        const videosToDelete = await videoList.find().sort({ watches: -1 });
        const videoDeletionPromises = [];
        for (let i = 0; i < videosToDelete.length - 5; i++) {
            videoDeletionPromises.push(
                videoList.deleteOne({ _id: videosToDelete[i]._id })
            );
        }
        await Promise.all(videoDeletionPromises);
    });
    clearVideoList.start();

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