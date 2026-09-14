/** Euler degrees for Settings / clip root rotation (order XYZ). */

export function wrapDegrees(degrees: number): number {
  return ((degrees % 360) + 360) % 360;
}

export function radiansToDegrees(radians: number): number {
  return wrapDegrees((radians * 180) / Math.PI);
}

export function degreesToRadians(degrees: number): number {
  return (wrapDegrees(degrees) * Math.PI) / 180;
}
