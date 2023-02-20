function msToHours(timestamp) {
    const diffInMs = timestamp - new Date().valueOf();
    const diffInMins = Math.floor(diffInMs / (1000 * 60));
    const diffInHours = Math.floor(diffInMins / 60);
    const minsRemaining = diffInMins % 60;
    const concatRemaining = `${diffInHours} hours and ${minsRemaining} mins`
    return concatRemaining
}

module.exports = {
    msToHours
}