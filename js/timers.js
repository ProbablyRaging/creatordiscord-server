const cronjob = require('cron').CronJob;
const videoList = require('../schema/video-list');
const extUsers = require('../schema/users');

module.exports = async () => {
    // Update user stats and clear video list
    const clearVideoList = new cronjob('0 0 * * *', async function () {
        // Update user stats
        const userResults = await videoList.find();
        const userStatsPromises = userResults.map(async (data) => {
            if (data.watches > 0) {
                const userData = await extUsers.findOne({ userId: data.userId });
                const currentViews = !userData.views ? 0 : userData.views;
                const currentSubmissions = !userData.submissions ? 0 : userData.submissions;
                await extUsers.updateOne(
                    { userId: data.userId },
                    {
                        views: currentViews + data.watches,
                        submissions: currentSubmissions + 1
                    },
                    { upsert: true }
                );
            }
        });
        await Promise.all(userStatsPromises);

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

    // Hourly update user stats
    // const updateUserStats = new cronjob('0 * * * *', async function () {
        // Update user stats
        // const userResults = await videoList.find();
        // for (const data of userResults) {
        //     if (data.watches > 0 && data.userId === '438434841617367080') {
        //         const userData = await extUsers.findOne({ userId: data.userId });
        //         const currentViews = !userData.views ? 0 : userData.views;
        //         const prevViews = !userData.prevViews ? 0 : userData.prevViews;
        //         const currentSubmissions = !userData.submissions ? 0 : userData.submissions;
        //         const prevSubmissions = !userData.prevSubmissions ? 0 : userData.prevSubmissions;
        //         await extUsers.updateOne(
        //             { userId: data.userId },
        //             {
        //                 views: currentViews - prevViews + data.watches,
        //                 submissions: currentSubmissions - prevSubmissions + 1,
        //                 prevViews: currentViews,
        //                 prevSubmissions: currentSubmissions
        //             },
        //             { upsert: true }
        //         );
        //     }
        // }
    // });
    // updateUserStats.start();

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