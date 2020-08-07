import { LightningElement } from "lwc";
import { loadScript } from 'lightning/platformResourceLoader';
import R from '@salesforce/resourceUrl/Recorder';
import uploadFiles from '@salesforce/apex/FileUploadController.uploadFiles';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
export default class Voice extends LightningElement {

  gumStream;
  input;
  rec;
  audioContext;

  URL;

  link;
  blob;

  filesUploaded = [];
  constructor() {
    super();
  }

  pauseRecording() {
    if (this.rec.recording) {
      this.rec.stop();
      console.log('pause');
    } else {
      this.rec.record();
      console.log('resume');
    }
  }
  stopRecording() {
    if (this.rec.recording) {
      this.rec.stop();
      console.log('stop');
      this.gumStream.getAudioTracks()[0].stop();
      this.rec.exportWAV((blob) => {
        console.log(blob);
        this.blob = blob;
        URL = window.URL || window.webkitURL;
        let url = URL.createObjectURL(blob);
        this.link = url;
      });
    }
  }

  uploadFile() {
    console.log('upload file');
    let reader = new FileReader();
    reader.onload = e => {
      //let base64data = reader.result;
      console.log('onload');
      let base64 = 'base64,';
      let content = reader.result.indexOf(base64) + base64.length;
      let fileContents = reader.result.substring(content);
      let fileName = new Date().toISOString() + '.wav';
      this.filesUploaded.push({ PathOnClient: fileName, Title: fileName, VersionData: fileContents });
      console.log('uploadFiles');
      uploadFiles({ files: this.filesUploaded })
        .then(result => {
          console.log(result);
          if (result == true) {
            this.showToastMessage('Success', 'Files uploaded', 'success');
          } else {
            this.showToastMessage('Error', 'Error uploading files', 'error');
          }
        })
        .catch(error => {
          console.log(error);
          this.showToastMessage('Error', 'Error uploading files', 'error');
        });
    };
    reader.readAsDataURL(this.blob);
  }

  startRecording() {
    this.link = '';
    const constraints = {
      audio: true,
      video: false
    }

    let AudioContext = window.AudioContext || window.webkitAudioContext;
    this.audioContext = new AudioContext;

    navigator.mediaDevices.getUserMedia(constraints).then((stream) => {
      console.log("getUserMedia() success, stream created, initializing Recorder.js ...");
      /* assign to gumStream for later use */
      this.gumStream = stream;
      /* use the stream */
      this.input = this.audioContext.createMediaStreamSource(stream);
      /* Create the Recorder object and configure to record mono sound (1 channel) Recording 2 channels will double the file size */
      this.rec = new Recorder(this.input, {
        numChannels: 1
      })
      //start the recording process 
      this.rec.record()
      console.log("Recording started");
    }).catch(function (err) {
      console.log(err);
    });
  }
  renderedCallback() {
    Promise.all(
      [
        loadScript(this, R)
      ]
    ).then(() => {
      console.log('scripts loaded');
    }).catch((e) => {
      alert(e);
    });
  }

  showToastMessage(title, message, variant) {
    this.dispatchEvent(
      new ShowToastEvent({
        title: title,
        message: message,
        variant: variant
      })
    );
  }
}
