/* -------------- Initialize variables -------------- */
var zhoraiTextColour = "#5d3e9f";
var stages = ['sayHi', 'zAskName', 'respondWithName', 'zAskPlace', 'respondWithPlace', 'zFinish'];
var currStage = 0;
var infoLabel;
var recordButton;
var zhoraiSpeakBtn;
var zhoraiSpeechBox;
// good voices: Alex pitch 2, Google US English 1.5, Google UK English Female 1.5, Google UK English Male 2
var zhoraiVoice = window.speechSynthesis.getVoices().filter(function (voice) {
    return voice.name == 'Google US English';
})[0];
var currBtnIsMic = true;
var dataFilename = "../../website-server-side/receive-text/data/names.txt";
var currName = '';
var currPlace = '';


/* -------------- Initialize functions -------------- */
/**
 * Speaks with the voice set by zhoraiVoice
 * @param {*} text 
 * @param {*} callback 
 */
function speakText(text, callback) {
    // FROM https://developers.google.com/web/updates/2014/01/Web-apps-that-talk-Introduction-to-the-Speech-Synthesis-API
    var msg = new SpeechSynthesisUtterance(makePhonetic(text));

    msg.voice = zhoraiVoice; // Note: some voices don't support altering params
    //msg.voiceURI = 'native';
    msg.volume = 1; // 0 to 1
    msg.rate = 1.1; // 0.1 to 10
    msg.pitch = 1.5; // 0 to 2
    msg.lang = 'en-US';

    if (callback) {
        console.log('callback!! ' + callback);
        msg.onend = callback;
    }

    // set the button to the "hear again" button
    msg.onstart = switchButtonTo('speakBtn');

    window.speechSynthesis.speak(msg);
}

function showPurpleText(text) {
    zhoraiSpeechBox.innerHTML = '<p style="color:' + zhoraiTextColour + '">' + text + '</p>';
}

/**
 * Replaces "Zhorai" with "Zor-eye":
 * @param {*} text 
 */
function makePhonetic(text) {
    text = text.replace(/Zhorai/gi, 'Zor-eye');
    text = text.replace(/Zorai/gi, 'Zor-eye');
    text = text.replace(/Zohrai/gi, 'Zor-eye');
    text = text.replace(/Zoreye/gi, 'Zor-eye');
    return text;
}

/**
 * Returns list of english voices:
 */
function getEnglishVoices() {
    englishVoices = [];
    speechSynthesis.getVoices().forEach(function (voice) {
        if (voice.lang.includes("en")) {
            // console.log(voice.name, voice.default ? voice.default : '');
            englishVoices.push(voice);
        }
    });
    return englishVoices;
}

/**
 * Swaps the visible button from a mic to a zhorai-talk button (or vice versa)
 * @param {*} toButton If toButton is not specified, it flips the current button, 
 * otherwise, toButton can be specified as 'micBtn' or 'speakBtn'
 */
function buttonSwap(toButton) {
    if (!toButton) {
        if (currBtnIsMic) {
            // swap to zhorai speak button:
            recordButton.hidden = true;
            zhoraiSpeakBtn.hidden = false;
        } else {
            // swap to mic button:
            recordButton.hidden = false;
            zhoraiSpeakBtn.hidden = true;
        }
        currBtnIsMic = !currBtnIsMic;
    } else {
        switchButtonTo(toButton);
    }
}

/**
 * Switches the button to the specified button (either 'micBtn' or 'speakBtn')
 * @param {*} toButton 
 */
function switchButtonTo(toButton) {
    if (toButton == 'micBtn') {
        recordButton.hidden = false;
        zhoraiSpeakBtn.hidden = true;
        currBtnIsMic = true;
    } else if (toButton == 'speakBtn') {
        recordButton.hidden = true;
        zhoraiSpeakBtn.hidden = false;
        currBtnIsMic = false;
    } else if (!toButton) {
        console.log('No button specified. Not switching button.');
    } else {
        console.error('Unknown button: ' + toButton + '. Did not switch button.');
    }

}

function startStage() {
    var zhoraiSpeech = '';
    var goToNext = false;
    var toButton = null;
    switch (stages[currStage]) {
        case 'sayHi':
            console.log("starting sayHi stage... with micbtn");
            // have student say, "Hi Zhorai"
            // 1. write, "Say hi" in textbox
            infoLabel.innerHTML = 'Say "hi"!';
            // 2. prep mic button:
            toButton = 'micBtn';
            break;
        case 'zAskName':
            // have zhorai say, "Hi there! What’s your name?"
            var phrases = ["Hello there! I don't think we've met. What's your name?",
                "Hello! I don't remember meeting you before. What's your name?",
                "Hi there! What’s your name?"
            ];
            zhoraiSpeech = chooseRandomPhrase(phrases);
            goToNext = true;
            toButton = 'micBtn';
            break;
        case 'respondWithName':
            // 1. write "what's your name?"
            infoLabel.innerHTML = 'Zhorai says, "What\'s your name?"';
            // have student say, "I’m <name>" or "<name>" etc.
            // this will take us to the "afterRecording" and then "introReceiveData()" 
            // method and zhorai will respond
            toButton = 'micBtn';
            break;
        case 'zAskPlace':
            // todo have zhorai say, "Hello <name>, pleased to meet you. Where are you from?"
            break;
        case 'respondWithPlace':
            // todo have student say, "I’m from <place>" or "<place>" etc.
            // this will take us to the "afterRecording" and then "introReceiveData()" 
            // method and zhorai will respond
            break;
        case 'zFinish':
            // todo have zhorai say, "That sounds like an interesting place! 
            // I have never heard of <place> before."
            break;
        default:
            console.error("Unknown stage for conversation with Zhorai: " + stages[currStage]);
    }
    console.log('startstage gotonext: ' + goToNext);
    console.log('startstage speech: ' + zhoraiSpeech);
    finishStage(goToNext, zhoraiSpeech, toButton);
}

/**
 * when the record button is clicked, start recording and prep for the next stage
 */
function onRecord() {
    // TODO -- recordButtonClick --> pass in afterRecording??
    recordButtonClick({
        callback: afterRecording
    });

}

function afterRecording(recordedSpeech) {
    var recordingIsGood = false;
    var zhoraiSpeech = '';
    console.log("AFTER RECORDING!");
    switch (stages[currStage]) {
        case 'sayHi':
            // test to see if what they said was correct... e.g., "I didn't quite catch that"
            var greetings = ['hi', 'hello', 'hey', 'yo', 'howdy', 'sup', 'hiya',
                'g\'day', 'what\'s up', 'good morning', 'good afternoon', 'meet'
            ];
            var regex = new RegExp(greetings.join("|"), "i");
            var saidHi = regex.test(recordedSpeech);
            if (saidHi) {
                recordingIsGood = true;
            } else {
                var phrases = ["Sorry, what was that?", "Oh, pardon?"];
                zhoraiSpeech = chooseRandomPhrase(phrases);
            }
            // clear memory so that we don't have two name sentences:
            clearMemory();
            break;
        case 'respondWithName':
        case 'respondWithPlace':
            // get name/place from server:
            readFile(dataFilename, stages[currStage] + '_intro');
            // zhorai responds in the introReceiveData() method
            break;
        default:
            console.error("Unknown stage for ending a recording: " + stages[currStage]);
    }

    finishStage(recordingIsGood, zhoraiSpeech);
}

function introReceiveData(filedata) {
    var phrases = [];
    var zhoraiSpeech = '';
    var recordingIsGood = false;
    var toButton = 'micBtn';
    switch (stages[currStage]) {
        case 'respondWithName':
            // test to see if what they said was correct... e.g., "I didn't quite catch that"
            if (filedata) {
                // got a name! Capitalize and store it:
                currName = filedata.charAt(0).toUpperCase() + filedata.slice(1);
                recordingIsGood = true;
                phrases = ["Hello, " + currName + "! Nice to meet you! Where are you from?",
                    "Nice to meet you, " + currName + "! Where are you from?",
                    currName + ". What a nice name! Where are you from?"
                ];
                infoLabel.innerHTML = 'Zhorai says, "Where are you from?"';
            } else {
                phrases = ["I didn't quite catch that.", "Sorry, I missed that.", "Pardon?",
                    "Sorry, could you repeat that?"
                ];
            }
            break;
        case 'respondWithPlace':
            // test to see if what they said was correct... e.g., "I didn't quite catch that"
            if (filedata) {
                // got a name! Capitalize it:
                currPlace = filedata.charAt(0).toUpperCase() + filedata.slice(1);
                recordingIsGood = true;
                phrases = ["Ooo, " + currPlace + " sounds interesting! I've never heard of it before. Tell me more!",
                    currPlace + " sounds cool! I have no idea where that is! I want to hear more!",
                    "Interesting! I've never heard of " + currPlace + " before. Can you tell me more?"
                ];
                infoLabel.innerHTML = 'Zhorai says, "Where are you from?"';
            } else {
                phrases = ["I didn't quite catch that.", "Sorry, I missed that.", "Pardon?",
                    "Sorry, could you repeat that, " + currName + "?"
                ];
            }
            break;
        default:
            console.error("Unknown stage for receiving data: " + stages[currStage]);
    }

    zhoraiSpeech = chooseRandomPhrase(phrases);
    finishStage(recordingIsGood, zhoraiSpeech, toButton);
}

/**
 * 
 * @param {*} goToNext boolean: if true, the currStage will be incremented and 
 * the gui prepared for next stage
 * @param {*} zhoraiSpeech string: if specified, zhorai will speak
 * @param {*} toButton string: if specified, the button will be set to 'micBtn' or 'speakBtn'
 * before starting the next stage (or right away, if not starting the next stage)
 */
function finishStage(goToNext, zhoraiSpeech, toButton) {
    console.log('finishstage,' + stages[currStage] + ', gotonext: ' + goToNext);
    showPurpleText(zhoraiSpeech);

    if (goToNext) {
        var nextStage = function () {
            // prepare for next stage (but don't go to next if it's the last stage)
            if (currStage < stages.length - 1) {
                currStage += 1;
            }
            // swap the mic button / zhorai talk button
            switchButtonTo(toButton);
            // start the next stage
            startStage();
        };

        if (zhoraiSpeech) {
            speakText(zhoraiSpeech, nextStage);
        } else {
            nextStage();
        }
    } else {
        if (zhoraiSpeech) {
            speakText(zhoraiSpeech, function (toButton) {
                switchButtonTo(toButton);
            });
        } else {
            switchButtonTo(toButton);
        }
    }
}

/* -------------- Once the page has loaded -------------- */
document.addEventListener('DOMContentLoaded', function () {
    // Initialize variables:
    currStage = 0;
    infoLabel = document.getElementById('z_info_label');
    recordButton = document.getElementById('record_button');
    zhoraiSpeakBtn = document.getElementById('zhoraiSpeakBtn');
    zhoraiSpeechBox = document.getElementById('final_span');

    // remove any memory from previous activites:
    clearMemory("sentences.txt");

    startStage();

    // Add click handlers
    zhoraiSpeakBtn.addEventListener("click", startStage);
    recordButton.addEventListener("click", onRecord);
});