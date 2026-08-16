/**
 * Sets the JFIF density fields on a JPEG data URL without recompressing pixels.
 * Canvas exports default to density unit "none", even when the pixel dimensions
 * are suitable for a 300 DPI passport image.
 */
export function setJpegDpi(dataUrl: string, dpi = 300): string {
  if (!dataUrl.startsWith('data:image/jpeg;base64,')) return dataUrl;

  const base64 = dataUrl.slice(dataUrl.indexOf(',') + 1);
  const binary = atob(base64);
  let bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  const density = Math.max(1, Math.min(65535, Math.round(dpi)));

  let jfifOffset = -1;
  for (let offset = 2; offset + 17 < bytes.length && bytes[offset] === 0xff;) {
    const marker = bytes[offset + 1];
    if (marker === 0xe0 &&
        bytes[offset + 4] === 0x4a && bytes[offset + 5] === 0x46 &&
        bytes[offset + 6] === 0x49 && bytes[offset + 7] === 0x46 &&
        bytes[offset + 8] === 0x00) {
      jfifOffset = offset;
      break;
    }
    if (marker === 0xd9 || marker === 0xda) break;
    const segmentLength = (bytes[offset + 2] << 8) | bytes[offset + 3];
    if (segmentLength < 2) break;
    offset += 2 + segmentLength;
  }

  if (jfifOffset < 0) {
    const jfif = Uint8Array.from([
      0xff, 0xe0, 0x00, 0x10,
      0x4a, 0x46, 0x49, 0x46, 0x00,
      0x01, 0x01, 0x01,
      density >> 8, density & 0xff,
      density >> 8, density & 0xff,
      0x00, 0x00,
    ]);
    const withJfif = new Uint8Array(bytes.length + jfif.length);
    withJfif.set(bytes.subarray(0, 2), 0);
    withJfif.set(jfif, 2);
    withJfif.set(bytes.subarray(2), 2 + jfif.length);
    bytes = withJfif;
  } else {
    bytes[jfifOffset + 11] = 0x01; // dots per inch
    bytes[jfifOffset + 12] = density >> 8;
    bytes[jfifOffset + 13] = density & 0xff;
    bytes[jfifOffset + 14] = density >> 8;
    bytes[jfifOffset + 15] = density & 0xff;
  }

  let encoded = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    encoded += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return `data:image/jpeg;base64,${btoa(encoded)}`;
}
