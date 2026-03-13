// capture.worklet.js
// Runs off the main thread to prevent UI freezing during real-time Gemini voice sessions
// Requires downsampling microphone input to 16kHz, 16-bit PCM for Gemini API

class CaptureWorkletProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.bufferSize = 2048; // Size for ~20-40ms chunk depending on sampleRate
    this.buffer = new Float32Array(this.bufferSize);
    this.bufferFrames = 0;
    this.targetSampleRate = 16000;
  }

  // Linear downsampling helper
  downsample(input, fromSampleRate) {
    if (fromSampleRate === this.targetSampleRate) return input;
    
    const ratio = fromSampleRate / this.targetSampleRate;
    const size = Math.round(input.length / ratio);
    const result = new Float32Array(size);
    
    let offsetResult = 0;
    let offsetInput = 0;
    
    while (offsetResult < result.length) {
      const nextOffsetInput = Math.round((offsetResult + 1) * ratio);
      let accum = 0;
      let count = 0;
      for (let i = offsetInput; i < nextOffsetInput && i < input.length; i++) {
        accum += input[i];
        count++;
      }
      result[offsetResult] = count > 0 ? accum / count : 0;
      offsetResult++;
      offsetInput = nextOffsetInput;
    }
    return result;
  }

  // Float32 to Int16 PCM Base64 encoding for Gemini
  floatTo16BitPCM(input) {
      const buffer = new ArrayBuffer(input.length * 2);
      const view = new DataView(buffer);
      for (let i = 0; i < input.length; i++) {
          let s = Math.max(-1, Math.min(1, input[i]));
          view.setInt16(i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); // true = little-endian (Required)
      }
      return buffer;
  }

  arrayBufferToBase64(buffer) {
      let binary = '';
      const bytes = new Uint8Array(buffer);
      for (let i = 0; i < bytes.byteLength; i++) {
          binary += String.fromCharCode(bytes[i]);
      }
      return btoa(binary);
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;

    const channelData = input[0]; // Mono processing
    const sampleRate = globalThis.sampleRate; // Available in worklet context

    // Send data to main thread when buffer is full enough
    if (channelData) {
        // Here we simplify chunking for the worklet demonstration
        // 1. Downsample
        const downsampled = this.downsample(channelData, sampleRate);
        
        // 2. Convert to PCM16
        const pcm16Buffer = this.floatTo16BitPCM(downsampled);
        
        // 3. Convert to Base64 to send via postMessage
        const base64Audio = this.arrayBufferToBase64(pcm16Buffer);
        
        this.port.postMessage({
            event: 'audio',
            audioData: base64Audio
        });
    }

    return true;
  }
}

registerProcessor('capture-processor', CaptureWorkletProcessor);
