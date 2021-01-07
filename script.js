const inputElem = document.querySelector('input');
const textArea = document.querySelector('textarea');
const reader = new FileReader();

inputElem.addEventListener('change', () => {
    const files = inputElem.files;
    if (files.length == 0) return;
    const file = files[0];

    reader.onload = (e) => {
        const file = e.target.result;
        const fileLines = file.split(/\r\n|\n/);
        const conferenceTalks = createObjectsArrayFromLines(fileLines);
        const talksSplitBySession = splitMorningAndAfternoonSessions(conferenceTalks);
        const arrayOfTracks = scheduleTimesForSessions(talksSplitBySession);
        textArea.value = arrayOfTracks.flat().join('\n');
    }

    reader.onerror = (e) => alert(e.target.error.name);

    reader.readAsText(file);
})

const createObjectsArrayFromLines = (fileLines) => {
    const talks = [];

    fileLines.forEach(line => {
        const digitRegex = /\d+\s*min/
        const digitsFound = line.match(digitRegex);

        const talk = {};
        if (digitsFound) {
            const talkTitle = line.substring(0, digitsFound.index).trim();
            const talkLength = parseInt(digitsFound[0], 10);
            talk.title = talkTitle;
            talk.length = talkLength;
        } else {
            const lightningMatch = line.match(/\lightning/i);
            const talkTitle = line.substring(0, lightningMatch.index).trim();
            talk.title = talkTitle;
            talk.length = 5;
        }
        talks.push(talk);
    })
    return talks
}

const splitMorningAndAfternoonSessions = (talks) => {
    let returnObj = {
        morningSessions: {
            // 1: []
        },
        afternoonSessions: {
            // 1: []
        }
    }
    const totalTimeInMinutes = talks.reduce((acc, obj) => { return acc + obj.length }, 0);
    const minimumTalkTimeForTrack = 6 * 60;
    const numberOfPossibleTracks = Math.floor(totalTimeInMinutes/minimumTalkTimeForTrack);
    const leewayInMinutes = totalTimeInMinutes % minimumTalkTimeForTrack;

    const morningSessionLimit = 3 * 60;
    let morningSessionCount = 0;
    const afternoonSessionLimit = 4 * 60;
    const afternoonSessionMinimum = 3 * 60;
    let afternoonSessionCount = 0;
    let currentTrack = 1;
    let previousTrack;

    const oddTalks = talks.filter(talk => talk.length % 30 !== 0)
    const evenTalks = talks.filter(talk => talk.length % 30 === 0)
    const sortedTalks = [...oddTalks, ...evenTalks]

    sortedTalks.forEach(talk => {
        talk.track = currentTrack;
        const talkFitsInMorningSession = morningSessionCount + talk.length <= morningSessionLimit;
        const talkFitsInAfternoonSession = afternoonSessionCount + talk.length <= afternoonSessionLimit;
        const morningSessionFulfilled = morningSessionCount === morningSessionLimit;
        const afternoonSessionMinReached = afternoonSessionCount >= afternoonSessionMinimum;

        const sumOfPreviousTrackMorningTalks = returnObj.morningSessions[previousTrack]?.reduce((acc, obj) => { return acc + obj.length }, 0);
        const talkFitsInPrevTrackMorningSession = sumOfPreviousTrackMorningTalks + talk.length <= morningSessionLimit;
        let oddTalkCount = 0;

       if (talkFitsInMorningSession && talk.length != 5 && oddTalkCount < 2) {
            //if it fits in the morning session and the length is not 5, add it in
            if (talk.length === 45) oddTalkCount++
            morningSessionCount += talk.length
            talk.session = 'morning'
            returnObj.morningSessions[currentTrack] ? returnObj.morningSessions[currentTrack].push(talk) : returnObj.morningSessions[currentTrack] = [talk];
        } else if (talkFitsInAfternoonSession) {
            //else if fits in to afternoon session, add it in
            afternoonSessionCount += talk.length
            talk.session = 'afternoon'
            returnObj.afternoonSessions[currentTrack] ? returnObj.afternoonSessions[currentTrack].push(talk) : returnObj.afternoonSessions[currentTrack] = [talk];
        } else {
            // set the currentTrack and previousTrack
            previousTrack = currentTrack;
            currentTrack++;

            //add the current talk to the new 'current track'
            talk.track = currentTrack;

            if (talk.length != 5 && talk.length != 45) {
                talk.session = 'morning'
                returnObj.morningSessions[currentTrack] ? returnObj.morningSessions[currentTrack].push(talk) : returnObj.morningSessions[currentTrack] = [talk];
                morningSessionCount = talk.length;
                afternoonSessionCount = 0;
            } else {
                talk.session = 'afternoon';
                returnObj.afternoonSessions[currentTrack] ? returnObj.afternoonSessions[currentTrack].push(talk) : returnObj.afternoonSessions[currentTrack] = [talk];
                afternoonSessionCount = talk.length;
                morningSessionCount = 0;
            }
        }

    })
    return returnObj;
}

const scheduleTimesForSessions = (talks) => {
    const allTracksArray = [];
    for (let i=1; i<=Object.keys(talks.morningSessions).length; i++) {

        const currentTrack = talks.morningSessions[i][0].track;

        const lunchHour = [{ title: 'Lunch', length: 60, }]
        const networkingEvent = [{ title: 'Networking Event', length: 60}]
        const allSessions = [...talks.morningSessions[i], ...lunchHour, ...talks.afternoonSessions[i], ...networkingEvent];

        const d = new Date(2021, 01, 01, 09, 00);

        const trackArray = [];
        allSessions.forEach(session => {
            const talkString = `Track ${currentTrack}  ${d.toLocaleTimeString()}  ${session.title}  ${session.length} min`;
            trackArray.push(talkString);
            d.setMinutes(d.getMinutes() + session.length);
        })
        allTracksArray.push(trackArray)
    }
    return allTracksArray;
}
