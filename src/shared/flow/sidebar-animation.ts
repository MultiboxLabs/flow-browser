/**
 * Shared sidebar open/close timing.
 *
 * Renderer CSS and main-process interpolation must use same duration/curve
 * or BrowserContent placeholder and live WebContentsView drift apart.
 */
export const SIDEBAR_ANIMATION_DURATION_MS = 100;

/**
 * Matches Tailwind CSS `ease-in-out`.
 * Important: this is Tailwind's curve, not CSS keyword `ease-in-out`.
 */
export const SIDEBAR_ANIMATION_CSS_EASING = "cubic-bezier(0.4, 0, 0.2, 1)";

const BEZ_X1 = 0.4;
const BEZ_Y1 = 0.0;
const BEZ_X2 = 0.2;
const BEZ_Y2 = 1.0;

function bezierX(u: number): number {
  const u1 = 1 - u;
  return 3 * u1 * u1 * u * BEZ_X1 + 3 * u1 * u * u * BEZ_X2 + u * u * u;
}

function bezierXDerivative(u: number): number {
  const u1 = 1 - u;
  return 3 * u1 * u1 * BEZ_X1 + 6 * u1 * u * (BEZ_X2 - BEZ_X1) + 3 * u * u * (1 - BEZ_X2);
}

function bezierY(u: number): number {
  const u1 = 1 - u;
  return 3 * u1 * u1 * u * BEZ_Y1 + 3 * u1 * u * u * BEZ_Y2 + u * u * u;
}

export function evaluateSidebarAnimationEasing(progress: number): number {
  if (progress <= 0) return 0;
  if (progress >= 1) return 1;

  let u = progress;
  for (let i = 0; i < 8; i++) {
    const diff = bezierX(u) - progress;
    if (Math.abs(diff) < 1e-7) break;
    const deriv = bezierXDerivative(u);
    if (Math.abs(deriv) < 1e-12) break;
    u -= diff / deriv;
    u = Math.max(0, Math.min(1, u));
  }

  return bezierY(u);
}
