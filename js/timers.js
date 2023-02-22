const cronjob = require('cron').CronJob;
const videoList = require('../schema/video-list');
const extUsers = require('../schema/users');

module.exports = async () => {
    // Clear video list
    const clearVideoList = new cronjob('0 0 * * *', async function () {
        const results = await videoList.find().sort({ watches: -1 });;
        for (let i = 0; i < results.length - 5; i++) {
            await videoList.deleteOne({ _id: results[i]._id });
        }
    });
    clearVideoList.start();
    // Reset token caps
    const resetTokenCaps = new cronjob('0 0 * * *', async function () {
        const results = await extUsers.find();
        for (const data of results) {
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