import { Tab } from "@/browser/tabs/tab";
import { Rectangle } from "electron";
import { performance } from "perf_hooks";

const FRAME_RATE = 60;
const MS_PER_FRAME = 1000 / FRAME_RATE;
const SPRING_STIFFNESS = 300;
const SPRING_DAMPING = 30;
const MIN_DISTANCE_THRESHOLD = 0.01;
const MIN_VELOCITY_THRESHOLD = 0.01;

// Type definitions for clarity
type Dimension = "x" | "y" | "width" | "height";
const DIMENSIONS: Dimension[] = ["x", "y", "width", "height"];
type Velocity = Record<Dimension, number>;

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
  private velocity: Velocity = { x: 0, y: 0, width: 0, height: 0 };
  private lastUpdateTime: number | null = null;
  private animationFrameId: NodeJS.Timeout | null = null;

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
      // Ensure deltaTime is reasonable, capping to avoid large jumps
      const deltaTime = this.lastUpdateTime ? Math.min((now - this.lastUpdateTime) / 1000, 1 / 30) : 1 / FRAME_RATE; // Use FRAME_RATE constant
      this.lastUpdateTime = now;

      const settled = this.updateBounds(deltaTime);
      this.updateViewBounds(); // Apply potentially changed bounds to the view

      if (settled) {
        this.stopAnimationLoop();
      } else {
        // Schedule next frame using standard setTimeout
        this.animationFrameId = setTimeout(loop, MS_PER_FRAME);
      }
    };
    // Start the loop using standard setTimeout
    this.animationFrameId = setTimeout(loop, MS_PER_FRAME);
  }

  /**
   * Stops the animation loop if it's running.
   */
  private stopAnimationLoop(): void {
    if (this.animationFrameId !== null) {
      clearTimeout(this.animationFrameId); // Only need clearTimeout
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
    // Also check targetBounds to ensure we have a valid state to eventually reach.
    if (!this.tab.visible || !this.bounds || !this.targetBounds) {
      // If not visible, we might still want to ensure the final state is applied
      // if the animation finished while hidden.
      if (!this.tab.visible && this.bounds && this.targetBounds && !isRectangleEqual(this.bounds, this.targetBounds)) {
        // If hidden but not at target, snap to target and update lastApplied if needed
        this.bounds = { ...this.targetBounds };
        const integerBounds = roundRectangle(this.bounds);
        if (!isRectangleEqual(integerBounds, this.lastAppliedBounds)) {
          // Even though not visible, update lastAppliedBounds to reflect the snapped state
          this.lastAppliedBounds = integerBounds;
        }
      }
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

    let allSettled = true;

    // Iterate over each dimension (x, y, width, height) for physics calculation
    for (const dim of DIMENSIONS) {
      const targetValue = this.targetBounds[dim];
      const currentValue = this.bounds[dim];
      const currentVelocity = this.velocity[dim];

      const delta = targetValue - currentValue;

      // Check if this specific dimension is settled
      const isDistanceSettled = Math.abs(delta) < MIN_DISTANCE_THRESHOLD;
      const isVelocitySettled = Math.abs(currentVelocity) < MIN_VELOCITY_THRESHOLD;

      if (isDistanceSettled && isVelocitySettled) {
        // Snap this dimension to the target and zero its velocity
        this.bounds[dim] = targetValue;
        this.velocity[dim] = 0;
        // This dimension is settled, continue checking others
      } else {
        // If any dimension is not settled, the whole animation is not settled
        allSettled = false;

        // Calculate spring forces and update velocity for this dimension
        const force = delta * SPRING_STIFFNESS;
        const dampingForce = currentVelocity * SPRING_DAMPING;
        const acceleration = force - dampingForce; // Mass assumed to be 1
        this.velocity[dim] += acceleration * deltaTime;

        // Update position based on velocity for this dimension
        this.bounds[dim] += this.velocity[dim] * deltaTime;
      }
    }

    // If all dimensions have settled in this frame, ensure exact final state
    if (allSettled) {
      // This might be slightly redundant if snapping works perfectly, but ensures precision
      this.bounds.x = this.targetBounds.x;
      this.bounds.y = this.targetBounds.y;
      this.bounds.width = this.targetBounds.width;
      this.bounds.height = this.targetBounds.height;
      this.velocity = { x: 0, y: 0, width: 0, height: 0 };
    }

    return allSettled; // Return true if all dimensions are settled
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
