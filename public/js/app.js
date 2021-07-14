//webkitURL is deprecated but nevertheless
URL = window.URL || window.webkitURL;

var gumStream; //stream from getUserMedia()
var rec; //Recorder.js object
var input; //MediaStreamAudioSourceNode we'll be recording

// shim for AudioContext when it's not avb.
var AudioContext = window.AudioContext || window.webkitAudioContext;
var audioContext; //audio context to help us record

var recordButton = document.getElementById('recordButton');
var stopButton = document.getElementById('stopButton');
var pauseButton = document.getElementById('pauseButton');
var playButton = document.getElementById('playButton');

var nepaliSentence = document.querySelector('.nepali-text');
var reloadButton = document.querySelector('.refresh-image');
var recording_text = document.querySelector('.recording-time');
var mins = document.querySelector('.mins');
var secs = document.querySelector('.secs');
var recordedAudio = document.querySelector('.recorded-audio');
var recordedAudioButtons = document.querySelector('.recorded-audio-buttons');
var categorySelection = document.querySelector('.category-selection');
var categorySelectionOptional = document.querySelector('.category-selection-optional');
var categoryInputs = categorySelection.querySelectorAll('input');
var categoryInputsOptional = categorySelectionOptional.querySelectorAll('input');
var categoryText = document.querySelector('#category-text');
var categoryTextOptional = document.querySelector('#category-optional-text');
var upload = document.querySelector('.submit-button');

var nameWrapper = document.querySelector('.name-wrapper');
var name_input = document.querySelector('.name');

var minutes = 00;
var seconds = 00;
var category = 'NA';
var optionalCategories = [];
var recordingTimer;
var index;
var sentence_id;
var user_token;
var username;
var currentChecked = '';
var filename = '';
var audio_blob;

window.onload = () => {
  var http = new XMLHttpRequest();
  http.open('GET', '/data', true);
  http.send();
  http.onload = () => {
    data = JSON.parse(http.responseText);
    console.log(data);
    generateSentence();
  };
  user_token = localStorage.getItem('user-token');
  if (user_token === null) {
    user_token = getUserToken();
    localStorage.setItem('user-token', user_token);
  }
  console.log(user_token);

  username = localStorage.getItem('username');
  if (username != null) {
    name_input.value = username;
  }
};

function checkOnlyOne(checkbox) {
  nameWrapper.style.display = 'flex';
  upload.style.display = 'block';

  if (currentChecked) categorySelectionOptional.querySelector(`.${currentChecked}`).style.display = 'block';

  categoryInputs.forEach((item) => {
    if (item !== checkbox) item.checked = false;
  });

  if (checkbox.name != 'Others') {
    categorySelectionOptional.style.display = 'flex';
    categoryTextOptional.style.display = 'block';
  } else {
    categorySelectionOptional.style.display = 'none';
    categoryTextOptional.style.display = 'none';
  }

  categoryInputsOptional.forEach((item) => {
    if (item.name === checkbox.name) {
      item.style.display = 'none';
      item.checked = false;
      categorySelectionOptional.querySelector(`.${item.name}`).style.display = 'none';
      currentChecked = item.name;
    } else item.style.display = 'block';
  });
}

function getUserToken() {
  return Math.floor(Date.now() * Math.random());
}

function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function generateSentence() {
  index = getRandomNumber(0, data.length - 1);
  nepaliSentence.innerText = data[index].sentence;
  sentence_id = data[index].id;
}

reloadButton.onclick = () => {
  generateSentence();
};

//add events to those 2 buttons
recordButton.addEventListener('click', startRecording);
stopButton.addEventListener('click', stopRecording);
pauseButton.addEventListener('click', pauseRecording);
playButton.addEventListener('click', resumeRecording);

function startTimer() {
  seconds += 01;
  if (seconds == 60) {
    seconds = 00;
    minutes += 01;
    mins.innerText = minutes < 10 ? '0' + minutes : minutes;
  }
  secs.innerText = seconds < 10 ? '0' + seconds : seconds;
}
function startRecording() {
  console.log('recordButton clicked');

  /*
		Simple constraints object, for more advanced audio features see
		https://addpipe.com/blog/audio-constraints-getusermedia/
	*/

  var constraints = { audio: true, video: false };

  /*
    	Disable the record button until we get a success or fail from getUserMedia() 
	*/

  // recordButton.disabled = true;
  // stopButton.disabled = false;
  // pauseButton.disabled = false;

  /*
    	We're using the standard promise based getUserMedia() 
    	https://developer.mozilla.org/en-US/docs/Web/API/MediaDevices/getUserMedia
	*/

  navigator.mediaDevices
    .getUserMedia(constraints)
    .then(function (stream) {
      console.log('getUserMedia() success, stream created, initializing Recorder.js ...');

      /*
			create an audio context after getUserMedia is called
			sampleRate might change after getUserMedia is called, like it does on macOS when recording through AirPods
			the sampleRate defaults to the one set in your OS for your playback device

		*/
      audioContext = new AudioContext();

      //update the format
      /*  assign to gumStream for later use  */
      gumStream = stream;

      /* use the stream */
      input = audioContext.createMediaStreamSource(stream);

      /* 
			Create the Recorder object and configure to record mono sound (1 channel)
			Recording 2 channels  will double the file size
		*/
      rec = new Recorder(input, { numChannels: 1 });

      nameWrapper.style.display = 'none';
      categoryText.style.display = 'none';
      categoryTextOptional.style.display = 'none';
      categorySelection.style.display = 'none';
      categorySelectionOptional.style.display = 'none';
      recordButton.style.display = 'none';
      upload.style.display = 'none';
      pauseButton.style.display = 'block';
      stopButton.style.display = 'block';
      recording_text.style.display = 'block';
      recordedAudio.innerHTML = '';
      //recordedAudioButtons.innerHTML = '';
      //start the recording process
      rec.record();
      recordingTimer = setInterval(startTimer, 1000);
      console.log('Recording started');
    })
    .catch(function (err) {
      //enable the record button if getUserMedia() fails
      // recordButton.disabled = false;
      // stopButton.disabled = true;
      // pauseButton.disabled = true;
    });
}

function pauseRecording() {
  console.log('pauseButton clicked rec.recording=', rec.recording);
  pauseButton.style.display = 'none';
  playButton.style.display = 'block';
  if (rec.recording) {
    //pause
    rec.stop();
    clearInterval(recordingTimer);
    //pauseButton.innerHTML = 'Resume';
  }
}

function resumeRecording() {
  pauseButton.style.display = 'block';
  playButton.style.display = 'none';
  rec.record();
  recordingTimer = setInterval(startTimer, 1000);
}

function stopRecording() {
  pauseButton.style.display = 'none';
  playButton.style.display = 'none';
  stopButton.style.display = 'none';
  recordButton.style.display = 'block';
  recording_text.style.display = 'none';
  categorySelection.style.display = 'flex';
  categoryText.style.display = 'block';

  console.log('stopButton clicked');
  clearInterval(recordingTimer);
  minutes = 00;
  seconds = 00;
  mins.innerText = '00';
  secs.innerText = '00';
  //disable the stop button, enable the record too allow for new recordings
  // stopButton.disabled = true;
  // recordButton.disabled = false;
  // pauseButton.disabled = true;

  //reset button just in case the recording is stopped while paused
  //pauseButton.innerHTML = 'Pause';

  //tell the recorder to stop the recording
  rec.stop();

  //stop microphone access
  gumStream.getAudioTracks()[0].stop();
  //create the wav blob and pass it on to createDownloadLink
  rec.exportWAV(createDownloadLink);
}

function createDownloadLink(blob) {
  audio_blob = blob;
  var url = URL.createObjectURL(blob);
  var au = document.createElement('audio');
  filename = new Date().toISOString().replaceAll(':', '.') + '_' + user_token;

  au.controls = true;
  au.src = url;

  recordedAudio.appendChild(au);
}

upload.addEventListener(
  'click',
  async function (event) {
    categoryInputs = categorySelection.querySelectorAll('input');
    categoryInputsOptional = categorySelectionOptional.querySelectorAll('input');
    categorySelection.style.display = 'none';
    categorySelectionOptional.style.display = 'none';
    categoryText.style.display = 'none';
    categoryTextOptional.style.display = 'none';
    categoryInputs.forEach((categoryInput) => {
      if (categoryInput.checked) {
        category = categoryInput.name;
      }
    });

    categoryInputsOptional.forEach((categoryInput) => {
      if (categoryInput.checked) {
        optionalCategories.push(categoryInput.name);
      }
    });

    username = name_input.value;
    localStorage.setItem('username', username);

    // var xhr = new XMLHttpRequest();
    // xhr.onload = function (e) {
    //   if (this.readyState === 4) {
    //     console.log('Server returned: ', e.target.responseText);
    //   }
    // };
    console.log(username);
    var fd = new FormData();
    fd.append('audio_data', audio_blob, filename.concat('.wav'));
    fd.append('index', sentence_id);
    fd.append('category', category);
    fd.append('optional_categories', optionalCategories);
    fd.append('user_token', user_token);
    fd.append('username', username);
    // xhr.open('POST', '/upload', true);
    // xhr.send(fd);

    fetch('/upload', {
      method: 'post',

      //make sure to serialize your JSON body
      body: fd,
    }).then((response) => {
      console.log('Data updated to database');
    });

    category = 'NA';
    optionalCategories = [];
    recordedAudio.innerHTML = '';
    //recordedAudioButtons.innerHTML = '';
    upload.style.display = 'none';
    nameWrapper.style.display = 'none';
    recordButton.style.display = 'block';
    data.splice(index, 1);
    categoryInputs.forEach((input) => (input.checked = false));
    categoryInputsOptional.forEach((input) => (input.checked = false));
    generateSentence();
  },
  false
);
