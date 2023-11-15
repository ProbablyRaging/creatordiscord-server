const cronjob = require('cron').CronJob;
const videoList = require('../schema/video_list');
const extUsers = require('../schema/users');
const fetch = require('node-fetch');

module.exports = async () => {
    // await videoList.deleteMany({ videoId: 'HYTb75LSFBc' })

    // let int = 0;
    // setInterval(async () => {
    //     await videoList.create({
    //         title: `I'm Not A Murderer! - The Mythical Rust Server - Episode 1`,
    //         channel: `ContentCreator`,
    //         channelId: `UCIjouN_iuJswbC6MJltMl_A`,
    //         views: `16.2K`,
    //         videoId: `gAw_-ny6b-E`,
    //         url: `https://www.youtube.com/watch?v=gAw_-ny6b-E`,
    //         thumbnail: `https://i.ytimg.com/vi/gAw_-ny6b-E/mqdefault.jpg`,
    //         userId: '',
    //         platform: 'youtube',
    //         dateAdded: new Date()
    //     });
    //     int++
    //     console.log(`Done: `, int);
    // }, 500);


    // // Update user stats and clear video list
    // const removeExpiredVideos = new cronjob('*/5 * * * *', async function () {
    //     const videoResults = await videoList.find();
    //     // Make sure there are always 5 videos in the queue
    //     if (videoResults.length <= 5) {
    //         return;
    //     } else {
    //         for (const data of videoResults) {
    //             if (new Date().valueOf() > data.expires) {
    //                 await videoList.deleteOne({ videoId: data.videoId });
    //             }
    //         }
    //     }
    // });
    // removeExpiredVideos.start();

    // // Check if videos have been deleted, unlisted, or privated
    // const removeDeadVideos = new cronjob('*/30 * * * *', async function () {
    //     const videoResults = await videoList.find();
    //     // Make sure there are always 5 videos in the queue
    //     for (const data of videoResults) {
    //         const resolve = await fetch(`https://www.youtube.com/watch?v=${data.videoId}`);
    //         const response = await resolve.text();
    //         if (response.includes(`This video isn't available any more`) || response.includes(`This is a private video`)) {
    //             console.log('Removing', data.videoId);
    //             await videoList.deleteOne({ videoId: data.videoId });
    //         }
    //     }
    // });
    // removeDeadVideos.start();

    // // Remove entries from users who no longer exist in the server or have no
    // // used the extension in over a month
    // const removeOldUser = new cronjob('0 0 * * *', async function () {
    //     const results = await extUsers.find();
    //     for (const data of results) {
    //         try {
    //             // Not longer in server
    //             const response = await fetch(`https://discord.com/api/v10/guilds/${process.env.GUILD_ID}/members/${data.userId}`, {
    //                 method: 'GET',
    //                 headers: {
    //                     Authorization: `${process.env.API_TOKEN}`
    //                 }
    //             });
    //             if (response.statusText === 'Not Found') {
    //                 await extUsers.deleteOne({ _id: data._id });
    //                 console.log(`Removed ${data.userId}. Reason: ${response.statusText}`);
    //             }
    //             // Not used extension in a month
    //             const oneMonth = 30 * 24 * 60 * 60 * 1000;
    //             if (data.expires && data.expires < (new Date().valueOf() - oneMonth)) {
    //                 await extUsers.deleteOne({ _id: data._id });
    //                 console.log(`Removed ${data.userId}. Reason: Stale account`);
    //             }
    //         } catch (err) {
    //             console.log('There was a problem : ', err);
    //         }
    //     }
    // });
    // removeOldUser.start();

    // // Reset token caps
    // const resetTokenCaps = new cronjob('0 0 * * *', async function () {
    //     const userResults = await extUsers.find();
    //     for (const data of userResults) {
    //         await extUsers.updateOne({
    //             userId: data.userId
    //         }, {
    //             tokenCap: 0
    //         }, {
    //             upsert: true
    //         });
    //     }
    // });
    // resetTokenCaps.start();
}