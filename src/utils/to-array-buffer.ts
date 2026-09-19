import type { Buffer } from 'node:buffer';

/** Copy a Node `Buffer` view into a standalone `ArrayBuffer` for `Response` bodies. */
export function toArrayBuffer(buf: Buffer): ArrayBuffer {
  return buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer;
}
