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

       const conferenceTalks = createObjectFromLines(fileLines)

       const conferenceTalksWithTrackAndSession = scheduleTalksForConference(conferenceTalks)
       console.log(conferenceTalksWithTrackAndSession);

        // textArea.value = fileLines.join('\n');
    }

    reader.onerror = (e) => alert(e.target.error.name);

    reader.readAsText(file);
})

const createObjectFromLines = (fileLines) => {
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

const scheduleTalksForConference = (talks) => {
    console.log(talks)
    const morningSessionLimit = 3 * 60;
    let morningSessionCount = 0;
    const afternoonSessionLimit = 5 * 60; //can be 4hrs
    const afternoonSessionMinimum = 4 * 60;
    let afternoonSessionCount = 0;
    const maximumTimeForTrack = 8 * 60;
    let currentTrack = 'Track 1'

    talks.forEach(talk => {
        talk.track = currentTrack;
        const talkFitsInMorningSession = morningSessionCount + talk.length <= morningSessionLimit;
        const morningSessionFulfilled = morningSessionCount === morningSessionLimit;
        const talkFitsInAfternoonSession = afternoonSessionCount + talk.length <= afternoonSessionLimit;
        const afternoonSessionMinReached = afternoonSessionCount >= afternoonSessionMinimum;

        let fortyFiveCount = 0;

        if (talkFitsInMorningSession && (talk.length == 60 || talk.length == 30 || talk.length == 45) && fortyFiveCount <= 2) {
            //must fill up the morning session first
            if (talk.length == 45) fortyFiveCount++

            morningSessionCount += talk.length
            talk.session = 'morning'
        } else if (talkFitsInAfternoonSession && !afternoonSessionMinReached) {
            afternoonSessionCount += talk.length
            talk.session = 'afternoon'
        } else {
            //does not fit in morning or afternoon, so must create new track
            let trackNumber = +currentTrack.substring(currentTrack.length -1, currentTrack.length);
            trackNumber++;
            currentTrack = 'Track ' + trackNumber;
            talk.track = currentTrack;
            if (talk.length == 60 || talk.length == 30) {
                talk.session = 'morning'
                morningSessionCount = talk.length;
                afternoonSessionCount = 0;
            } else {
                talk.session = 'afternoon';
                afternoonSessionCount = talk.length;
                morningSessionCount = 0;
            }
        }
    })
    return talks
}