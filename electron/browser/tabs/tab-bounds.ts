import { Tab } from "@/browser/tabs/tab";
import { Rectangle } from "electron";
import { performance } from "perf_hooks";

const USE_IMMEDIATE = false;
const FRAME_RATE = 30;
const MS_PER_FRAME = 1000 / FRAME_RATE;
const SPRING_STIFFNESS = 300;
const SPRING_DAMPING = 30;
const MIN_DISTANCE_THRESHOLD = 0.1;
const MIN_VELOCITY_THRESHOLD = 0.1;

/**
 * Helper function to compare two Rectangle objects for equality.
 * Handles null cases.
 */
export function isRectangleEqual(rect1: Rectangle | null, rect2: Rectangle | null): boolean {
  // If both are the same instance (including both null), they are equal.
  if (rect1 === rect2) {
    return true;
  }
  // If one is null and the other isn't, they are not equal.
  if (!rect1 || !rect2) {
    return false;
  }
  // Compare properties if both are non-null.
  return rect1.x === rect2.x && rect1.y === rect2.y && rect1.width === rect2.width && rect1.height === rect2.height;
}

/**
 * Rounds the properties of a Rectangle object to the nearest integer.
 * Returns null if the input is null.
 */
function roundRectangle(rect: Rectangle | null): Rectangle | null {
  if (!rect) {
    return null;
  }
  return {
    x: Math.round(rect.x),
    y: Math.round(rect.y),
    width: Math.round(rect.width),
    height: Math.round(rect.height)
  };
}

export class TabBoundsController {
  private readonly tab: Tab;
  public targetBounds: Rectangle | null = null;
  // Current animated bounds (can have fractional values)
  public bounds: Rectangle | null = null;
  // The last integer bounds actually applied to the view
  private lastAppliedBounds: Rectangle | null = null;
  private velocity = { x: 0, y: 0, width: 0, height: 0 };
  private lastUpdateTime: number | null = null;
  private animationFrameId: NodeJS.Timeout | NodeJS.Immediate | null = null;

  constructor(tab: Tab) {
    this.tab = tab;
  }

  /**
   * Starts the animation loop if it's not already running.
   */
  private startAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      return; // Already running
    }
    // Ensure we have a valid starting time
    if (this.lastUpdateTime === null) {
      this.lastUpdateTime = performance.now();
    }

    const loop = () => {
      const now = performance.now();
      // Ensure deltaTime is reasonable, even if loop timing is off
      const deltaTime = this.lastUpdateTime ? Math.min((now - this.lastUpdateTime) / 1000, 1 / 30) : 1 / FRAME_RATE; // Cap delta time to avoid large jumps
      this.lastUpdateTime = now;

      const settled = this.updateBounds(deltaTime);
      this.updateViewBounds(); // Apply potentially changed bounds to the view

      if (settled) {
        this.stopAnimationLoop();
      } else {
        // Schedule next frame
        if (USE_IMMEDIATE) {
          this.animationFrameId = setTimeout(loop, MS_PER_FRAME);
        } else {
          this.animationFrameId = setImmediate(loop);
        }
      }
    };
    // Start the loop
    if (USE_IMMEDIATE) {
      this.animationFrameId = setTimeout(loop, MS_PER_FRAME);
    } else {
      this.animationFrameId = setImmediate(loop);
    }
  }

  /**
   * Stops the animation loop if it's running.
   */
  private stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      if (USE_IMMEDIATE) {
        clearImmediate(this.animationFrameId as NodeJS.Immediate);
      } else {
        clearTimeout(this.animationFrameId as NodeJS.Timeout);
      }
      this.animationFrameId = null;
      this.lastUpdateTime = null; // Reset time tracking when stopped
    }
  }

  /**
   * Sets the target bounds and starts the animation towards them.
   * If bounds are already the target, does nothing.
   * If bounds are set for the first time, applies them immediately.
   * @param bounds The desired final bounds for the tab's view.
   */
  public setBounds(bounds: Rectangle): void {
    // Don't restart animation if the target hasn't changed
    if (this.targetBounds && isRectangleEqual(this.targetBounds, bounds)) {
      return;
    }

    this.targetBounds = { ...bounds }; // Copy to avoid external mutation

    if (!this.bounds) {
      // If this is the first time bounds are set, apply immediately
      this.setBoundsImmediate(bounds);
    } else {
      // Otherwise, start the animation loop to transition
      this.startAnimationLoop();
    }
  }

  /**
   * Sets the bounds immediately, stopping any existing animation
   * and directly applying the new bounds to the view.
   * @param bounds The exact bounds to apply immediately.
   */
  public setBoundsImmediate(bounds: Rectangle): void {
    this.stopAnimationLoop(); // Stop any ongoing animation

    const newBounds = { ...bounds }; // Create a copy
    this.targetBounds = newBounds; // Update target to match
    this.bounds = newBounds; // Update current animated bounds
    this.velocity = { x: 0, y: 0, width: 0, height: 0 }; // Reset velocity

    this.updateViewBounds(); // Apply the change to the view
  }

  /**
   * Applies the current animated bounds (rounded to integers) to the
   * actual BrowserView, but only if they have changed since the last application
   * or if the tab is not visible.
   */
  private updateViewBounds(): void {
    // Don't attempt to set bounds if the tab isn't visible or doesn't have bounds yet
    if (!this.tab.visible || !this.bounds) {
      // No need to update lastAppliedBounds if not visible, as they aren't being applied.
      // If bounds are null, there's nothing to apply anyway.
      return;
    }

    // Calculate the integer bounds intended for the view
    const integerBounds = roundRectangle(this.bounds);

    // Only call setBounds on the view if the *rounded* bounds have actually changed
    if (!isRectangleEqual(integerBounds, this.lastAppliedBounds)) {
      if (integerBounds) {
        // Ensure integerBounds is not null before setting
        this.tab.view.setBounds(integerBounds);
        this.lastAppliedBounds = integerBounds; // Store the bounds that were actually applied
      } else {
        // If rounding resulted in null (shouldn't happen with valid this.bounds), clear last applied
        this.lastAppliedBounds = null;
      }
    }
  }

  /**
   * Updates the animated bounds based on spring physics for a given time delta.
   * Reduces object allocation by modifying the existing `this.bounds` object.
   * @param deltaTime The time elapsed since the last update in seconds.
   * @returns `true` if the animation has settled, `false` otherwise.
   */
  public updateBounds(deltaTime: number): boolean {
    // Stop animation immediately if the tab is no longer visible
    if (!this.tab.visible) {
      this.stopAnimationLoop();
      // Consider the animation settled if the tab is not visible
      return true;
    }

    // If target or current bounds are missing, animation cannot proceed
    if (!this.targetBounds || !this.bounds) {
      this.stopAnimationLoop();
      return true;
    }

    // Calculate distance from target
    const dx = this.targetBounds.x - this.bounds.x;
    const dy = this.targetBounds.y - this.bounds.y;
    const dWidth = this.targetBounds.width - this.bounds.width;
    const dHeight = this.targetBounds.height - this.bounds.height;

    // Check if the animation has effectively stopped (close to target and low velocity)
    const isPositionSettled = Math.abs(dx) < MIN_DISTANCE_THRESHOLD && Math.abs(dy) < MIN_DISTANCE_THRESHOLD;
    const isSizeSettled = Math.abs(dWidth) < MIN_DISTANCE_THRESHOLD && Math.abs(dHeight) < MIN_DISTANCE_THRESHOLD;
    const isVelocitySettled =
      Math.abs(this.velocity.x) < MIN_VELOCITY_THRESHOLD &&
      Math.abs(this.velocity.y) < MIN_VELOCITY_THRESHOLD &&
      Math.abs(this.velocity.width) < MIN_VELOCITY_THRESHOLD &&
      Math.abs(this.velocity.height) < MIN_VELOCITY_THRESHOLD;

    if (isPositionSettled && isSizeSettled && isVelocitySettled) {
      // Snap to the target bounds precisely when settled
      // Optimization: Modify existing bounds object directly instead of creating a new one
      this.bounds.x = this.targetBounds.x;
      this.bounds.y = this.targetBounds.y;
      this.bounds.width = this.targetBounds.width;
      this.bounds.height = this.targetBounds.height;

      this.velocity = { x: 0, y: 0, width: 0, height: 0 }; // Reset velocity
      return true; // Animation is settled
    }

    // Calculate spring forces and update velocity (F = -kx - bv) -> a = (-kx - bv) / m (mass assumed to be 1)
    const forceX = dx * SPRING_STIFFNESS;
    const dampingForceX = this.velocity.x * SPRING_DAMPING;
    const accelerationX = forceX - dampingForceX; // No mass division (m=1)
    this.velocity.x += accelerationX * deltaTime;

    const forceY = dy * SPRING_STIFFNESS;
    const dampingForceY = this.velocity.y * SPRING_DAMPING;
    const accelerationY = forceY - dampingForceY;
    this.velocity.y += accelerationY * deltaTime;

    const forceWidth = dWidth * SPRING_STIFFNESS;
    const dampingForceWidth = this.velocity.width * SPRING_DAMPING;
    const accelerationWidth = forceWidth - dampingForceWidth;
    this.velocity.width += accelerationWidth * deltaTime;

    const forceHeight = dHeight * SPRING_STIFFNESS;
    const dampingForceHeight = this.velocity.height * SPRING_DAMPING;
    const accelerationHeight = forceHeight - dampingForceHeight;
    this.velocity.height += accelerationHeight * deltaTime;

    // Update position based on velocity
    // Optimization: Modify existing bounds object directly
    this.bounds.x += this.velocity.x * deltaTime;
    this.bounds.y += this.velocity.y * deltaTime;
    this.bounds.width += this.velocity.width * deltaTime;
    this.bounds.height += this.velocity.height * deltaTime;

    return false; // Animation is still active
  }

  /**
   * Cleans up resources, stopping the animation loop.
   * Should be called when the controller is no longer needed.
   */
  public destroy(): void {
    this.stopAnimationLoop();
    // Optionally clear references if needed, though JS garbage collection handles this
    // this.tab = null; // If Tab has circular refs, might help, but likely not needed
    this.targetBounds = null;
    this.bounds = null;
    this.lastAppliedBounds = null;
  }
}
