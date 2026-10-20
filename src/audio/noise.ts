import { generatePinkNoiseData, applyLoopCrossfade } from './math';

/**
 * Creates a looping pink noise AudioBuffer.
 * Duration: 4.0 seconds (as specified in audio-design.md).
 */
export function createPinkNoiseBuffer(ctx: AudioContext, durationSeconds = 4.0): AudioBuffer {
  const sampleRate = ctx.sampleRate || 44100;
  const length = Math.floor(sampleRate * durationSeconds);
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const channelData = buffer.getChannelData(0);

  const rawData = generatePinkNoiseData(sampleRate, length);
  // Crossfade over 150 ms at the seam to ensure completely seamless looping
  const crossfadeLength = Math.floor(sampleRate * 0.15);
  applyLoopCrossfade(rawData, crossfadeLength);

  channelData.set(rawData);
  return buffer;
}
