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
        // console.log(fileLines)
        const conferenceTalks = createObjectsArrayFromLines(fileLines); //an array of talk objects
        console.log(conferenceTalks)

        //make a function that takes the array of objects and returns an object with morningSessions and afternoonSession properties--
        // const returnObj = {
        //     morningSessions: {
        //         1: [{title: 'session name', length: 45}],
        //         2: [{title: 'session name', length: 45}]
        //     },
        //     morningSessions: {
        //         1: [{title: 'session name', length: 45}],
        //         2: [{title: 'session name', length: 45}]
        //     }
        // }
        const talksSplitBySession = splitMorningAndAfternoonSessions(conferenceTalks)
        console.log(talksSplitBySession)

        //take that returned object and create an array of strings to render out as lines

        // const conferenceTalksWithTrackAndSession = scheduleTalksForConference(conferenceTalks)
        // console.log(conferenceTalksWithTrackAndSession)

        // textArea.value = fileLines.join('\n');
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

    // const _addToPreviousTrackMorningSessionIfPossible = (talkObj) => {
    //     if (previousTrack) {
    //         //check if it fits in the previous morning session
    //         const sumOfPreviousTrackMorningTalks = returnObj.morningSessions[previousTrack].reduce((acc, obj) => { return acc + obj.length }, 0)
    //         const fitsIntoPreviousTrackMorningTalks = sumOfPreviousTrackMorningTalks + talkObj.length <= morningSessionLimit;
    //         if (sumOfPreviousTrackMorningTalks < morningSessionLimit && fitsIntoPreviousTrackMorningTalks) {
    //             //add it in
    //             returnObj.morningSessions[previousTrack].push(talkObj);
    //             //increment morning count
    //             // morningSessionCount += talkObj.length;
    //             return true;
    //         }
    //     }
    //     return false;
    // }

    talks.forEach(talk => {

        talk.track = currentTrack;
        const talkFitsInMorningSession = morningSessionCount + talk.length <= morningSessionLimit;
        const talkFitsInAfternoonSession = afternoonSessionCount + talk.length <= afternoonSessionLimit;
        const morningSessionFulfilled = morningSessionCount === morningSessionLimit;
        const afternoonSessionMinReached = afternoonSessionCount >= afternoonSessionMinimum;

        const sumOfPreviousTrackMorningTalks = returnObj.morningSessions[previousTrack]?.reduce((acc, obj) => { return acc + obj.length }, 0);
        const talkFitsInPrevTrackMorningSession = sumOfPreviousTrackMorningTalks + talk.length <= morningSessionLimit;
        if (previousTrack && sumOfPreviousTrackMorningTalks < morningSessionLimit && talk && talkFitsInPrevTrackMorningSession) {
            //check if it fits in the previous track morning session
            returnObj.morningSessions[previousTrack].push(talk);
        } else if (talkFitsInMorningSession && talk.length != 5) {
            //if it fits in the morning session and the length is not 5, add it in
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

            if (talk.length != 5) {
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
    console.log('RETURN', returnObj, talks);
}

// const scheduleTalksForConference = (talks) => {
//     const totalTimeInMinutes = talks.reduce((acc, obj) => { return acc + obj.length }, 0);
//     const minimumTalkTimeForTrack = 6 * 60;
//     const numberOfPossibleTracks = Math.floor(totalTimeInMinutes/minimumTalkTimeForTrack);
//     const leewayInMinutes = totalTimeInMinutes % minimumTalkTimeForTrack;

//     const morningSessionLimit = 3 * 60;
//     let morningSessionCount = 0;
//     const afternoonSessionLimit = 4 * 60;
//     const afternoonSessionMinimum = 3 * 60;
//     let afternoonSessionCount = 0;
//     let currentTrack = 'Track 1'

//     for (let i=0; i<talks.length; i++) {
//         const talk = talks[i];

//         talk.track = currentTrack;
//         const talkFitsInMorningSession = morningSessionCount + talk.length <= morningSessionLimit;
//         const morningSessionFulfilled = morningSessionCount === morningSessionLimit;
//         const talkFitsInAfternoonSession = afternoonSessionCount + talk.length <= afternoonSessionLimit;
//         const afternoonSessionMinReached = afternoonSessionCount >= afternoonSessionMinimum;
//         let fortyFiveLimitReached = false;

//         if (talkFitsInMorningSession && talk.length != 5 && !talk.session) {
//             if (talk.length == 45 && !fortyFiveLimitReached) {
//                 //if there's another 45 left out there sessionless, find it and set the session
//                 let anotherFortyFive;
//                 // for (let j=i+1; j<talks.length; j++) {
//                 //     if (talks[j].length == 45 && !talks[j].session) {
//                 //         anotherFortyFive = talks[j]
//                 //         break;
//                 //     }
//                 // }

//                 if (anotherFortyFive) {
//                     anotherFortyFive.session = 'morning';
//                     morningSessionCount += anotherFortyFive.length;
//                     fortyFiveLimitReached = true;
//                 }

//                 if (fortyFiveLimitReached) {
//                     talk.session = 'morning'
//                     morningSessionCount += talk.length
//                 } else {
//                     talk.session = 'afternoon'
//                     afternoonSessionCount += talk.length
//                 }

//             } else {
//                 morningSessionCount += talk.length
//                 talk.session = 'morning'
//             }

//         } else if (talkFitsInAfternoonSession && !talk.session) {
//             afternoonSessionCount += talk.length
//             talk.session = 'afternoon'

//         } else {
//             //does not fit in morning or afternoon (minimum), so must create new track
//             //if easily fits into afternoon session, make it an afternoon session in this track
//             let trackNumber = +currentTrack.substring(currentTrack.length -1, currentTrack.length);
//             trackNumber++;
//             currentTrack = 'Track ' + trackNumber;
//             talk.track = currentTrack;
//             if (talk.length == 60 || talk.length == 30 || talk.length == 45) {
//                 talk.session = 'morning'
//                 morningSessionCount = talk.length;
//                 afternoonSessionCount = 0;
//             } else {
//                 talk.session = 'afternoon';
//                 afternoonSessionCount = talk.length;
//                 morningSessionCount = 0;
//             }
//         }
//     }
//     return talks
// }