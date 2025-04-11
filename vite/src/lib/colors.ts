interface OKLCHColor {
  l: number;
  c: number;
  h: number;
}

export function hexToOKLCH(hex: string): OKLCHColor {
  // Clean up input by trimming whitespace and removing the '#' if present
  const cleanedHex = hex.trim().replace(/^#/, "");

  // Handle shorthand hex (e.g. "FFF") by converting it to full form ("FFFFFF")
  let fullHex: string;
  if (cleanedHex.length === 3) {
    fullHex = cleanedHex
      .split("")
      .map((ch) => ch + ch)
      .join("");
  } else if (cleanedHex.length === 6) {
    fullHex = cleanedHex;
  } else {
    throw new Error("Invalid hex color format. Expected '#RGB' or '#RRGGBB'.");
  }

  // Parse the hex values into sRGB (range [0, 1])
  const r = parseInt(fullHex.substring(0, 2), 16) / 255;
  const g = parseInt(fullHex.substring(2, 4), 16) / 255;
  const b = parseInt(fullHex.substring(4, 6), 16) / 255;

  // Linearize sRGB values
  const linearize = (channel: number) =>
    channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);

  const R = linearize(r);
  const G = linearize(g);
  const B = linearize(b);

  // Convert linear RGB to LMS using the matrix from the OKLab article
  const L = 0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B;
  const M = 0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B;
  const S = 0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B;

  // Nonlinear adaptation using cube roots
  const l_ = Math.cbrt(L);
  const m_ = Math.cbrt(M);
  const s_ = Math.cbrt(S);

  // Convert from LMS to OKLab
  const L_ok = 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_;
  const a_ok = 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_;
  const b_ok = 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_;

  // Compute the chroma
  const chroma = Math.sqrt(a_ok * a_ok + b_ok * b_ok);

  // Calculate hue in degrees (range [0, 360])
  let hue = Math.atan2(b_ok, a_ok) * (180 / Math.PI);
  if (hue < 0) hue += 360;

  // Return values formatted to a reasonable precision
  return {
    l: Number(L_ok.toFixed(4)),
    c: Number(chroma.toFixed(4)),
    h: Number(hue.toFixed(2))
  };
}

export function hexToOKLCHString(hex: string): string {
  const { l, c, h } = hexToOKLCH(hex);
  return `oklch(${l} ${c} ${h})`;
}
