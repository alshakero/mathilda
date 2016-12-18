import React, { Component } from 'react';
import Paths from './paths';
import AudioAnalyzer from '../audio-analyser'
import musicFile from './shape-of-my-heart.mp3';
import Overlay from '../overlay';

class Mathilda extends Component {
    componentDidMount() {
        let comp = this;

        window.addEventListener('mousemove', function () {
            let xAmount = 0.5 - window.event.clientX / window.innerWidth;
            let yAmount = 0.5 - window.event.clientY / window.innerHeight;

            comp.setState({ eyeXOffset: -xAmount * 7, eyeYOffset: -yAmount * 3, mouthScale: 1 + (0.05 * xAmount) });
        });
        window.addEventListener('deviceorientation', function () {
            let currentPureA = 3 * (event.gamma / 90);
            let currentPureB = 2 * (event.beta / 90);

            let xAmount = 0.5 - currentPureA;
            let yAmount = 0.5 - currentPureB;

            comp.setState({ eyeXOffset: -xAmount * 7, eyeYOffset: -yAmount * 3, mouthScale: 1 + (0.05 * xAmount) });
        });

        this.width = window.innerWidth;

        this.refs.lyricsCanvas.width = window.innerWidth;
        this.refs.lyricsCanvas.height = window.innerHeight;

        this.refs.effectsCanvas.width = window.innerWidth;
        this.refs.effectsCanvas.height = window.innerHeight;

        window.addEventListener('resize', function () {
            this.width = window.innerWidth;
            comp.lyricsCanvas.width = window.innerWidth;
            comp.lyricsCanvas.height = window.innerHeight;

            comp.effectsCanvas.width = window.innerWidth;
            comp.effectsCanvas.height = window.innerHeight;
            comp.effectsContext.clearRect(0, 0, comp.effectsCanvas.width, comp.effectsCanvas.height);

            comp.effectsContext.globalCompositeOperation = 'exclusion';
            comp.effectsContext.fillStyle = "#5a0008";
            comp.lyricsContext.font = Math.sqrt(window.innerWidth) / 1.3 + "px 'Fjalla One'";
            comp.lyricsContext.globalCompositeOperation = 'lighter';
            comp.lyricsContext.fillStyle = "#a53a00";
        });

        this.lyricsCanvas = this.refs.lyricsCanvas;
        this.effectsCanvas = this.refs.effectsCanvas;
        this.effectsContext = this.refs.effectsCanvas.getContext('2d');


        this.lyricsContext = this.refs.lyricsCanvas.getContext('2d');
        this.lyricsContext.font = Math.sqrt(window.innerWidth) / 1.3 + "px 'Fjalla One'";
        this.lyricsContext.fillStyle = "#a53a00";
        this.currentWordPosition.x = -this.lyricsContext.measureText("He").width;
        this.lineHeight = Math.sqrt(window.innerWidth);
        this.currentWordPosition.y = this.lineHeight * 2;

        this.effectsContext.fillStyle = "#5a0008";

        this.effectsContext.globalCompositeOperation = 'exclusion';
        this.lyricsContext.globalCompositeOperation = 'lighter';
    }
    constructor() {
        super();
        this.state = { eyeXOffset: 0, eyeYOffset: 0, breatingFactor: 1, mouthScale: 1, currentWord: 'Matlida' };
        this.currentWordPosition = { x: 0, y: 0 };
        this.currentText = "";
        this.colorIndex = 0;
        this.colors = ['#d52800', '#f2cfc7', '#ffbbf9', '#a9ff5c', '#ff8d73', '#d52800', '#e1ffc7', '#c9789c', '#c1e5ff', '#200804'];

        let onBeat = function (comp) {
            return function (val, breatingFactor, RMS) {

                if (RMS > 0.2) comp.effectsContext.clearRect(0, 0, comp.effectsCanvas.width, comp.effectsCanvas.height);
                comp.effectsContext.beginPath();
                comp.effectsContext.arc(comp.effectsCanvas.width / 2, comp.effectsCanvas.height / 2, comp.width / 4 + comp.width / 4 * RMS, 0, 2 * Math.PI);
                comp.effectsContext.closePath();

                comp.effectsContext.fill();

                comp.setState({ headRotateAngle: val, breatingFactor: 1.01 - (breatingFactor * 0.005) });
            }
        } (this);
        let onWordChange = function (comp) {
            return function (sentence, time) {
                if (time >= 145500 && time < 173501) {
                    window.document.body.style.backgroundColor = comp.colors[comp.colorIndex++];
                }
                sentence = sentence.toUpperCase();
                let rect = comp.lyricsContext.measureText(comp.currentText + "  " + sentence).width;
                //comp.currentWordPosition.x = rect;
                if (rect + 10 > comp.lyricsCanvas.width) {
                    comp.currentWordPosition.y += comp.lineHeight;
                    comp.currentText = "";

                    //page is full
                    if (comp.currentWordPosition.y + comp.lineHeight > comp.lyricsCanvas.height) {
                        comp.currentWordPosition.y = comp.lineHeight;
                        comp.lyricsContext.clearRect(0, 0, comp.lyricsCanvas.width, comp.lyricsCanvas.height);
                    }
                }
                comp.lyricsContext.clearRect(0, comp.currentWordPosition.y, comp.lyricsCanvas.width, comp.lyricsCanvas.height - comp.currentWordPosition.y);
                comp.currentText += " " + sentence;
                comp.lyricsContext.beginPath();
                comp.lyricsContext.fillText(comp.currentText, comp.lineHeight, comp.currentWordPosition.y);
                comp.lyricsContext.closePath();
                comp.currentWordPosition.x += rect.width + 2;

            }
        } (this);
        this.audioAnalyzer = new AudioAnalyzer(null, function () { }, function (comp) { return function () { comp.setState({ isReady: true }) } } (this), null, onBeat, onWordChange);
        this.audioAnalyzer.loadAudio(musicFile);
    }
    render() {
        return (
            <div>
                <Paths eyeXOffset={this.state.eyeXOffset} breatingFactor={this.state.breatingFactor} mouthScale={this.state.mouthScale} headRotateAngle={this.state.headRotateAngle ? this.state.headRotateAngle : ''} eyeYOffset={this.state.eyeYOffset} />
                <canvas id="effectsCanvas" ref='effectsCanvas' width='100%' height='100%' />
                <canvas id="lyricsCanvas" ref='lyricsCanvas' width='100%' height='100%' />
                {!this.state.hideOverlay ?
                    <Overlay>
                        {this.state.isReady ?
                            <a onClick={() => { this.audioAnalyzer.playSound(); this.setState({ hideOverlay: true }) } }>Start Music</a>
                            :
                            <p>Loading</p>
                        }
                    </Overlay>
                    :
                    ""}
            </div>
        );
    }
}

export default Mathilda;
