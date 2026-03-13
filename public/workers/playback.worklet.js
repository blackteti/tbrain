class PlaybackWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.audioQueue = []; // Array of Float32Arrays
    this.isPlaying = false;
  }

  process(inputs, outputs, parameters) {
    const output = outputs[0];
    const channel = output[0];

    // Barge-in: Handle flush message from main thread
    this.port.onmessage = (e) => {
        if (e.data === 'flush') {
            this.audioQueue = []; // Clear current buffer
            channel.fill(0); // Mute instantly
            return;
        }
        
        // Assume incoming data is Float32Array
        if (e.data instanceof Float32Array) {
            this.audioQueue.push(e.data);
        }
    };

    if (this.audioQueue.length > 0) {
        const currentBuffer = this.audioQueue[0];
        
        for (let i = 0; i < channel.length; i++) {
            if (i < currentBuffer.length) {
                channel[i] = currentBuffer[i];
            } else {
                channel[i] = 0;
            }
        }
        
        // Remove processed buffer (Simplified logic, requires proper offset tracking in production to prevent audio clicking)
        this.audioQueue.shift();
    } else {
        channel.fill(0);
    }

    return true;
  }
}

registerProcessor('playback-processor', PlaybackWorkletProcessor);
