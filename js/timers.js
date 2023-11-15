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
    // }, 1500);
}