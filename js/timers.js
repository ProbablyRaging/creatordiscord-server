const cronjob = require('cron').CronJob;
const videoList = require('../schema/video-list');

module.exports = async () => {
    // Clear video list
    const clearVideoList = new cronjob('0 0 * * *', async function () {
        await videoList.deleteMany({});
    });
    clearVideoList.start();
}