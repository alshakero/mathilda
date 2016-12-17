import $ from 'jquery';

class AudioAnalyzer {

    constructor(onProgress, onError, onReady, onEnded, onBeat, onWordChange)
    {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.onProgress = onProgress;
        this.onError = onError;
        this.onReady = onReady;
        this.onEnded = onEnded;
        this.onBeat = onBeat;
        this.onWordChange = onWordChange;
        this.timesOuts = [];
        this.isReady = false;
        this.angle = 0;
        this.breathingAngle = 0;
        this.lastBeat = 0;
        this.poller = function(comp) {return function()
        {
            comp.analyser.getByteTimeDomainData(comp.audioDataArray);
            let total = 0;
            let i = 0;
            while ( i < comp.audioDataArray.length ) {
                let floato = ( comp.audioDataArray[i++] / 0x80 ) - 1;
                total += ( floato * floato );
            }
            let currentRMS = Math.sqrt(total / comp.audioDataArray.length);                     
            comp.onBeat(2 * (Math.sin(comp.angle) * currentRMS * 2), Math.sin(comp.breathingAngle), currentRMS);        
            comp.angle+=0.1;      
            if(comp.angle > Math.PI * 2) comp.angle = 0;
            
            comp.breathingAngle += 0.05;
            if(comp.breathingAngle > Math.PI * 2) comp.breathingAngle = 0;

            requestAnimationFrame(comp.poller);
            
        }}(this);
    }
    getWordsAndTimes(data)
    {
        let timedWords = [];
        data.each(function(i, el)
        {					
            var line = $(el);	
            var pointZero = parseInt(line.attr('t'), 10);
            if(line.text().trim() === "") return;									

            var words = line.find('s');	
                
            if($(words[0]).text()) timedWords.push({"text": $(words[0]).text(), "time": pointZero});
            words = words.slice(1);				
            
            words.each(function(index, word)
            {	
                if(!word || !$(word).text()) return;
                var text = $(word).text().trim();;
                var time = pointZero + parseInt($(word).attr('t'), 10);		
                if(text)
                    timedWords.push({"text": text, "time": time});
            });
        });
        return timedWords;
    }
    fetchSubtitles(onDone)
    {
        let comp = this;
        $.get(process.env.PUBLIC_URL + '/text.xml', function(data)
        {		
            let items = $(data).find('body').find('p');
            comp.timedWords = comp.getWordsAndTimes(items);
            onDone();
        });
    }
    queueSubtitles()
    {
        let comp = this;
        this.timedWords.forEach(function(el, i)
        {        
            comp.timesOuts.push(setTimeout(function() { comp.onWordChange(el.text); }, el.time));	
        });
    }
    loadAudio(url) {
        
        let comp = this;
        this.fetchSubtitles(function()
        {
            let request = new XMLHttpRequest();
            request.open('GET', url, true);
            request.responseType = 'arraybuffer';
            
            request.onprogress = comp.onProgress;
            request.onerror = comp.onError;            
            request.onload = function() {
                    comp.audioContext.decodeAudioData(request.response, function(buffer) {
                    comp.soundBuffer = buffer;	
                    comp.onReady();
                    comp.isReady = true;
                }, function(){});
            }
            request.send();
        });       
    }    
    playSound()
    {
        if(!this.isReady) {
            this.onError("Audio file is not ready..");
        }
        try
        {
            this.analyser = this.audioContext.createAnalyser();
            this.source =  this.audioContext.createBufferSource(); // creates a sound source
            this.source.buffer = this.soundBuffer;                    // tell the source which sound to play
            this.source.connect(this.audioContext.destination);       // connect the source to the audioContext's destination (the speakers)
            this.source.connect(this.analyser); 

            this.source.start(0);
        
            this.duration = this.soundBuffer.duration;
            this.analyser.fftSize = 2048;

            let bufferLength = this.analyser.frequencyBinCount;
            this.analyser.smoothingTimeConstant = 1;

            this.audioDataArray = new Uint8Array(bufferLength);
            let availableFreqs = this.analyser.frequencyBinCount;
            this.audioFreqDataArray = new Uint8Array(availableFreqs);

            this.source.onended = this.onEnded;

            this.poller();
            this.queueSubtitles();
        }
        catch (exp)
        {
            this.onError(exp);
        }
    }    
}
export default AudioAnalyzer;