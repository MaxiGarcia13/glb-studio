/** Append one keyframe sample into flat time/value buffers. */
export function appendSample(
  timesOut: number[],
  valuesOut: number[],
  time: number,
  sample: ArrayLike<number>,
): void {
  timesOut.push(time);
  for (let i = 0; i < sample.length; i++) {
    valuesOut.push(sample[i]);
  }
}
