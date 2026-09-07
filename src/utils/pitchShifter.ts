/**
 * Real-time Web Audio API Pitch Shifter Node (Jungle Algorithm)
 * Pitch shifts audio in real-time from -12 to +12 semitones without changing tempo.
 */

export class PitchShifter {
    private ctx: AudioContext;
    private inputNode: GainNode;
    private outputNode: GainNode;
    private delayA: DelayNode;
    private delayB: DelayNode;
    private fadeA: GainNode;
    private fadeB: GainNode;
    private modA: OscillatorNode;
    private modB: OscillatorNode;
    private modGainA: GainNode;
    private modGainB: GainNode;
    private pitchRatio: number = 1.0;

    constructor(ctx: AudioContext) {
        this.ctx = ctx;

        const bufferTime = 0.100; // 100ms delay buffer
        this.inputNode = ctx.createGain();
        this.outputNode = ctx.createGain();

        this.delayA = ctx.createDelay(1.0);
        this.delayB = ctx.createDelay(1.0);
        this.fadeA = ctx.createGain();
        this.fadeB = ctx.createGain();

        // Create sawtooth/modulators using periodic wave for smooth delay line scanning
        const waveA = this.createSawtoothWave(ctx, 0);
        const waveB = this.createSawtoothWave(ctx, 0.5);

        this.modA = ctx.createOscillator();
        this.modB = ctx.createOscillator();
        this.modA.setPeriodicWave(waveA);
        this.modB.setPeriodicWave(waveB);

        this.modGainA = ctx.createGain();
        this.modGainB = ctx.createGain();

        this.modGainA.gain.value = bufferTime;
        this.modGainB.gain.value = bufferTime;

        // Connect modulator to delay time
        this.modA.connect(this.modGainA);
        this.modGainA.connect(this.delayA.delayTime);

        this.modB.connect(this.modGainB);
        this.modGainB.connect(this.delayB.delayTime);

        // Connect audio signal paths
        this.inputNode.connect(this.delayA);
        this.inputNode.connect(this.delayB);

        this.delayA.connect(this.fadeA);
        this.delayB.connect(this.fadeB);

        this.fadeA.connect(this.outputNode);
        this.fadeB.connect(this.outputNode);

        // Start oscillators
        this.modA.start();
        this.modB.start();

        this.setPitchShift(0);
    }

    private createSawtoothWave(ctx: AudioContext, phaseOffset: number): PeriodicWave {
        const n = 64;
        const real = new Float32Array(n);
        const imag = new Float32Array(n);

        for (let i = 1; i < n; i++) {
            const angle = 2 * Math.PI * i * phaseOffset;
            real[i] = (2 / (i * Math.PI)) * Math.sin(angle);
            imag[i] = (2 / (i * Math.PI)) * Math.cos(angle);
        }

        return ctx.createPeriodicWave(real, imag);
    }

    public setPitchShift(semitones: number) {
        // Convert semitones to pitch ratio: ratio = 2^(semitones/12)
        const ratio = Math.pow(2, semitones / 12);
        this.pitchRatio = ratio;

        const bufferTime = 0.100;
        const modFreq = (1.0 - ratio) / bufferTime;

        // Update modulation frequency and depth
        if (Math.abs(modFreq) < 0.0001) {
            this.modA.frequency.value = 0;
            this.modB.frequency.value = 0;
            this.modGainA.gain.value = 0;
            this.modGainB.gain.value = 0;
        } else {
            this.modA.frequency.value = modFreq;
            this.modB.frequency.value = modFreq;
            this.modGainA.gain.value = bufferTime;
            this.modGainB.gain.value = bufferTime;
        }
    }

    public getInput(): GainNode {
        return this.inputNode;
    }

    public getOutput(): GainNode {
        return this.outputNode;
    }

    public disconnect() {
        try {
            this.modA.stop();
            this.modB.stop();
            this.inputNode.disconnect();
            this.outputNode.disconnect();
        } catch (e) {}
    }
}
