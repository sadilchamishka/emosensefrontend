import React,{useState} from 'react';
import {generateWaveFile} from './Util'
import './App.css';

var server_URL = "http://ec2-54-165-12-14.compute-1.amazonaws.com:5000/";
var speaker_register_limit = 200;
var speaker_utternce_limit = 100;
var leftchannel = [];
var recorder = null;
var recordingLength = 0;
var mediaStream = null;
var context = null;
var counter = 0;
            

function App() {

const [speaker, setSpeaker] = useState("");
const [topic, setTopic] = useState("");

async function sendTopic(){
  var response = await fetch(server_URL+'createtopic?topic='+topic, {
      method: 'GET'
  });
  if (response.status==200){
    console.log("topic created");
    setTopic("");
  }
}

async function deleteTopic(){
  var response = await fetch(server_URL+'deletetopic?topic='+topic, {
      method: 'GET'
  }); 
  if (response.status==200){
    console.log("topic deleted");
  }  
}

async function createCodebook(){
  var response = await fetch(server_URL+'createcodebook?topic='+topic, {
      method: 'GET'
  });
  if (response.status==200){
    console.log("Ready for emotion prediction");
  }            
}

async function sendWaveToRegister(formData){
  var response = await fetch(server_URL+'registerspeaker?topic='+topic+'&speaker='+speaker, {
    method: 'POST',
    body: formData
  });
  if (response.status==200){
    console.log("Successfully Registered");
  }
}

async function sendWave(formData){
    var response = await fetch(server_URL+'?topic='+topic, {
    method: 'POST',
    body: formData
    });

    const data = await response.json();
		console.log(data);
  }

const updateSpeaker = (event) => {
  setSpeaker(event.target.value);
}

const updateTopic = (event) => {
  setTopic(event.target.value);
}

const stopRecording = () => {
  recorder.disconnect(context.destination);
  mediaStream.disconnect(recorder);
}

const registerSpeaker = () => {
  // Initialize recorder
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  navigator.getUserMedia(
  {
      audio: true
  },
  function (e) {
      console.log("started to register speaker!");

      // creates the audio context
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      mediaStream = context.createMediaStreamSource(e);  // creates an audio node from the microphone incoming stream

      // bufferSize: the onaudioprocess event is called when the buffer is full
      var bufferSize = 2048;
      var numberOfInputChannels = 2;   // Two channels, but one channel is used to reduce the size of audio file
      var numberOfOutputChannels = 2;

      if (context.createScriptProcessor) {
          recorder = context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
      } else {
          recorder = context.createJavaScriptNode(bufferSize, numberOfInputChannels, numberOfOutputChannels);
      }

      recorder.onaudioprocess = function (e) {
          leftchannel.push(new Float32Array(e.inputBuffer.getChannelData(0)));
          console.log("BUFFERING");
          recordingLength += bufferSize;
          
          if (counter==speaker_register_limit){
            sendWaveToRegister(generateWaveFile(leftchannel,recordingLength));
            recordingLength = 0;
            counter = 0;
            leftchannel = [];
            stopRecording();
            setSpeaker("");
          } else {
          counter=counter+1;
          }
      }

      // we connect the recorder
      mediaStream.connect(recorder);
      recorder.connect(context.destination);
  },
   function (e) {
       console.error(e);
      });
}

const recordConversation = () => {
  // Initialize recorder
  navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
  navigator.getUserMedia(
  {
      audio: true
  },
  function (e) {
      console.log("Conversation is Recording");

      // creates the audio context
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      context = new AudioContext();
      mediaStream = context.createMediaStreamSource(e);  // creates an audio node from the microphone incoming stream

      // bufferSize: the onaudioprocess event is called when the buffer is full
      var bufferSize = 2048;
      var numberOfInputChannels = 2;   // Two channels, but one channel is used to reduce the size of audio file
      var numberOfOutputChannels = 2;

      if (context.createScriptProcessor) {
          recorder = context.createScriptProcessor(bufferSize, numberOfInputChannels, numberOfOutputChannels);
      } else {
          recorder = context.createJavaScriptNode(bufferSize, numberOfInputChannels, numberOfOutputChannels);
      }

      recorder.onaudioprocess = function (e) {
          leftchannel.push(new Float32Array(e.inputBuffer.getChannelData(0)));
          console.log("BUFFERING");
          recordingLength += bufferSize;
          
          if (counter==speaker_utternce_limit){
            sendWave(generateWaveFile(leftchannel,recordingLength));
            recordingLength = 0;
            leftchannel = [];
            counter = 0;
          } else {
          counter=counter+1;
          }
      }

      // we connect the recorder
      mediaStream.connect(recorder);
      recorder.connect(context.destination);
  },
   function (e) {
       console.error(e);
      });
}

  return (
    <div className="App">
    <h1>EMOSENSE</h1>
    <label>Create Conversation</label> &emsp;
    <input value={topic} onChange={updateTopic} type="text" /> &emsp;
    <button onClick={sendTopic}>Create</button>
    <br></br><br></br>

    <input type="text" value={speaker} onChange={updateSpeaker}/> &emsp;
    <button onClick={registerSpeaker}>Register New Speaker</button>
    <br></br><br></br>

    <button onClick={createCodebook}>Train Speakers</button>
    <br></br><br></br>

    <button onClick={recordConversation}>Start Conversation</button>
    <br></br><br></br>
    <button onClick={stopRecording}>Stop recording</button>
    <br></br><br></br>

    <label>End Conversation</label> &emsp;
    <button onClick={deleteTopic}>End</button>
    <br/>

    </div>
  );
}

export default App;
