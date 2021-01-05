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

    //    _createObjectFromLines(fileLines)

        textArea.value = fileLines.join('\n');
    }

    reader.onerror = (e) => alert(e.target.error.name);

    reader.readAsText(file);
})

const _createObjectFromLines = (fileLines) => {
    const talkObj = {};
    fileLines.forEach(line => {
        const digitRegex = /\d+\s*min/
        const digitsFound = line.match(digitRegex);

        if (digitsFound) {
            const talkTitle = line.substring(0, digitsFound.index).trim();
            const talkLength = parseInt(digitsFound[0], 10);
            talkObj[talkTitle] = talkLength;
        } else {
            const lightningMatch = line.match(/\lightning/i);
            const talkTitle = line.substring(0, lightningMatch.index).trim();
            const talkLength = 5;
            talkObj[talkTitle] = talkLength;
        }

    })
}