function msToHours(timestamp) {
    const diffInMs = timestamp - new Date().valueOf();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const minsRemaining = diffInMins % 60;
    const concatRemaining = `${diffInHours} hours and ${minsRemaining} mins`
    return concatRemaining
}

function getYoutubeVideoId(string) {
    string = string.replace(/&\S*|&$/g, '');
    // Check if the input string matches the video ID pattern
    const videoIdPattern = /^[\w\-_]{11}$/;
    if (videoIdPattern.test(string)) {
        return string;
    }
    // Otherwise, match http/https and youtu.be, youtube.com, and youtube.com/shorts/
    const urlPattern = /http(?:s?):\/\/(?:www\.)?youtu(?:be\.com\/watch\?v=|\.be\/|be\.com\/shorts\/)([\w\-_]*)(?:&t=[\dhms]+)?/i;
    // The execution of this regex returns the first YouTube video ID, or null
    const matchArray = urlPattern.exec(string);
    if (matchArray) {
        return matchArray[1];
    }
    // If no match is found, return null
    return null;
}

module.exports = {
    msToHours,
    getYoutubeVideoId
}