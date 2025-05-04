import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "motion/react"; // Used for backdrop blur and gradient orbs

// --- Type Definitions ---

type Waypoint = { x: number; y: number };

// Updated ShapeData to include path details needed for Canvas rendering
type ShapeData = {
  id: number;
  type: "circle" | "square" | "triangle";
  path: { x: number[]; y: number[] }; // The calculated animation path
  times: number[]; // Normalized time points for each waypoint (0 to 1)
  color: string; // Base color (opacity will be applied during drawing)
  size: number;
  blur: number;
  createdAt: number; // Timestamp of creation
  totalDuration: number; // Total animation duration in milliseconds
};

// --- Helper Function for Path Interpolation ---

/**
 * Calculates the position on a multi-segment path at a given progress ratio.
 * @param path Object containing arrays of x and y coordinates.
 * @param times Array of normalized time points (0 to 1) corresponding to each path point.
 * @param elapsedRatio The overall progress ratio through the animation (0 to 1).
 * @returns The interpolated {x, y} coordinates.
 */
function interpolatePath(
  path: { x: number[]; y: number[] },
  times: number[],
  elapsedRatio: number
): { x: number; y: number } {
  // Basic validation
  if (
    !path ||
    !path.x ||
    !path.y ||
    path.x.length < 2 ||
    path.x.length !== path.y.length ||
    !times ||
    times.length !== path.x.length
  ) {
    // Return the start or a default if data is invalid
    return { x: path?.x?.[0] ?? 0, y: path?.y?.[0] ?? 0 };
  }

  // Clamp elapsedRatio between 0 and 1
  elapsedRatio = Math.max(0, Math.min(1, elapsedRatio));

  // Find the current segment the elapsedRatio falls into
  let segmentIndex = 0;
  // Iterate up to the second-to-last point, as segments are between points
  for (let i = 0; i < times.length - 1; i++) {
    // Check if ratio is within the time range of the current segment
    if (elapsedRatio >= times[i] && elapsedRatio <= times[i + 1]) {
      segmentIndex = i;
      break; // Found the segment
    }
    // Handle potential edge case where ratio is exactly 1
    if (elapsedRatio === 1) {
      segmentIndex = times.length - 2;
      break;
    }
  }

  const startTime = times[segmentIndex];
  const endTime = times[segmentIndex + 1];

  // Avoid division by zero if start and end times are the same
  const segmentDuration = endTime - startTime;
  if (segmentDuration === 0) {
    return { x: path.x[segmentIndex], y: path.y[segmentIndex] };
  }

  // Calculate how far into the current segment the elapsedRatio is
  const progressInSegment = (elapsedRatio - startTime) / segmentDuration;

  // Get the start and end points of the current segment
  const startX = path.x[segmentIndex];
  const startY = path.y[segmentIndex];
  const endX = path.x[segmentIndex + 1];
  const endY = path.y[segmentIndex + 1];

  // Linear interpolation within the segment
  const currentX = startX + (endX - startX) * progressInSegment;
  const currentY = startY + (endY - startY) * progressInSegment;

  return { x: currentX, y: currentY };
}

// --- Custom Hook for Canvas Drawing ---

const useCanvasShapes = (
  canvasRef: React.RefObject<HTMLCanvasElement>,
  shapes: ShapeData[],
  windowSize: { width: number; height: number }
) => {
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Get DPR for HiDPI scaling
    const dpr = window.devicePixelRatio || 1;

    // Set actual canvas size based on window size and DPR
    canvas.width = windowSize.width * dpr;
    canvas.height = windowSize.height * dpr;

    // Set display size of canvas
    canvas.style.width = `${windowSize.width}px`;
    canvas.style.height = `${windowSize.height}px`;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Scale the drawing context to handle HiDPI displays correctly
    // All drawing operations below will be scaled automatically
    ctx.scale(dpr, dpr);

    const draw = () => {
      // Clear the canvas (dimensions used here are logical, pre-scaling)
      ctx.clearRect(0, 0, windowSize.width, windowSize.height);

      const now = Date.now();

      shapes.forEach((shape) => {
        const elapsedTime = now - shape.createdAt;
        // Ensure elapsedRatio does not exceed 1
        const elapsedRatio = Math.min(elapsedTime / shape.totalDuration, 1);

        // Skip drawing if animation is finished
        if (elapsedRatio >= 1 && shape.totalDuration > 0) return; // Check duration > 0 to avoid skipping instantly if duration is 0

        // --- Position ---
        const { x, y } = interpolatePath(shape.path, shape.times, elapsedRatio);

        // --- Opacity ---
        // Fade in: 0 -> 0.7 over first 5%
        // Hold: 0.7 until 95%
        // Fade out: 0.7 -> 0 over last 5%
        const baseOpacity = 0.7; // Target opacity during hold phase
        let opacity = 0;
        if (elapsedRatio < 0.05) {
          opacity = (elapsedRatio / 0.05) * baseOpacity; // Fade in
        } else if (elapsedRatio < 0.95) {
          opacity = baseOpacity; // Hold
        } else {
          // Ensure fade out only happens if ratio is less than 1
          if (elapsedRatio < 1) {
            opacity = (1 - (elapsedRatio - 0.95) / 0.05) * baseOpacity; // Fade out
          } else {
            opacity = 0; // Ensure opacity is 0 at the very end
          }
        }
        // Clamp opacity just in case
        opacity = Math.max(0, Math.min(baseOpacity, opacity));

        // --- Rotation (for square and triangle) ---
        // Rotate 0 -> 360 degrees: 0->180 by 50%, 180->360 by 100%
        let rotationRadians = 0;
        if (shape.type === "square" || shape.type === "triangle") {
          let rotationDegrees = 0;
          if (elapsedRatio < 0.5) {
            rotationDegrees = (elapsedRatio / 0.5) * 180;
          } else {
            // Ensure rotation completes fully towards the end
            const progressInSecondHalf = Math.min(1, (elapsedRatio - 0.5) / 0.5);
            rotationDegrees = 180 + progressInSecondHalf * 180;
          }
          rotationRadians = (rotationDegrees * Math.PI) / 180;
        }

        // --- Apply Styles & Draw ---
        // PERFORMANCE WARNING: Applying filter per-shape is expensive!
        // Consider global blur, offscreen canvas blur, or removing blur for better performance.
        ctx.filter = `blur(${shape.blur}px)`;

        // Set fill color using the calculated opacity
        const colorMatch = shape.color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*[\d.]+)?\)/);
        let fillStyle = `rgba(0,0,0,${opacity.toFixed(3)})`; // Default fallback with fixed precision
        if (colorMatch) {
          fillStyle = `rgba(${colorMatch[1]}, ${colorMatch[2]}, ${colorMatch[3]}, ${opacity.toFixed(3)})`;
        }
        ctx.fillStyle = fillStyle;

        // Save context state before applying transformations
        ctx.save();

        // Translate origin to the shape's center for rotation
        ctx.translate(x + shape.size / 2, y + shape.size / 2);
        ctx.rotate(rotationRadians);

        // Begin drawing the shape path relative to the new (0,0) center
        ctx.beginPath();

        const halfSize = shape.size / 2;
        switch (shape.type) {
          case "circle":
            ctx.arc(0, 0, halfSize, 0, 2 * Math.PI);
            break;
          case "square":
            ctx.rect(-halfSize, -halfSize, shape.size, shape.size);
            break;
          case "triangle": {
            // Draw an equilateral-like triangle centered approximately
            const triangleHeight = shape.size;
            const sideLength = triangleHeight / (Math.sqrt(3) / 2);
            const triHalfBase = sideLength / 2;
            // Adjust Y points to center vertically based on height
            const topY = -triangleHeight / 2;
            const botY = triangleHeight / 2;
            // Adjust X points for base width
            const leftX = -triHalfBase;
            const rightX = triHalfBase;

            // Move to top center, then draw lines to bottom corners
            ctx.moveTo(0, topY);
            ctx.lineTo(leftX, botY);
            ctx.lineTo(rightX, botY);
            ctx.closePath();
            break;
          }
        }

        // Fill the drawn path
        ctx.fill();

        // Restore context state (removes transformations and filter effects)
        ctx.restore();
      });

      // Request the next frame
      animationFrameId.current = requestAnimationFrame(draw);
    };

    // Start the animation loop
    animationFrameId.current = requestAnimationFrame(draw);

    // Cleanup function to cancel animation frame on unmount
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
    // Re-run the effect if the shapes array, window size, or canvas ref instance changes
  }, [shapes, windowSize, canvasRef]);
};

// --- Main OnboardingScreen Component ---

export function OnboardingScreen({ children }: { children?: React.ReactNode }) {
  // State for backdrop blur animation
  const [blurIntensity, setBlurIntensity] = useState(8);
  // State to hold the data for all shapes
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  // State for window dimensions
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800
  });

  // Ref for the canvas element
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Ref to track the total number of shapes created (for unique IDs)
  const shapeCount = useRef(0);

  // Configuration for shape generation
  const targetShapeCount = 30; // Aim for this many shapes on screen
  const maxShapes = 50; // Hard limit to prevent excessive shapes

  // --- Hooks ---

  // Update window size state and canvas dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      setWindowSize({ width, height });

      // Update canvas element size directly when window resizes
      const canvas = canvasRef.current;
      if (canvas) {
        const dpr = window.devicePixelRatio || 1;
        // Update buffer size for drawing resolution
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        // Update CSS size for display
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;

        // Re-apply scale to context after resize
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.scale(dpr, dpr);
        }
      }
    };

    // Call handler once initially to set size
    handleResize();

    window.addEventListener("resize", handleResize);
    // Cleanup listener on component unmount
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty dependency array, runs once on mount

  // Animate backdrop blur intensity (Optional: Can impact performance)
  useEffect(() => {
    const blurInterval = setInterval(() => {
      setBlurIntensity(5 + Math.random() * 10);
    }, 3000); // Change blur every 3 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(blurInterval);
  }, []); // Empty dependency array, runs once on mount

  // Function to generate the multi-point path for a shape
  const generatePath = useCallback(
    (
      screenWidth: number,
      screenHeight: number,
      size: number
    ): { path: { x: number[]; y: number[] }; times: number[] } => {
      const waypoints: Waypoint[] = [];
      const numPoints = 15 + Math.floor(Math.random() * 10); // 15-24 intermediate waypoints

      // Determine starting position (just off-screen)
      const startPosition = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      let startX = 0,
        startY = 0;
      const margin = size * 1.5; // Ensure it starts well off-screen

      switch (startPosition) {
        case 0:
          startX = Math.random() * screenWidth;
          startY = -margin;
          break; // Top
        case 1:
          startX = screenWidth + margin;
          startY = Math.random() * screenHeight;
          break; // Right
        case 2:
          startX = Math.random() * screenWidth;
          startY = screenHeight + margin;
          break; // Bottom
        case 3:
          startX = -margin;
          startY = Math.random() * screenHeight;
          break; // Left
      }
      waypoints.push({ x: startX, y: startY }); // Add starting point

      // Generate intermediate waypoints (mostly within bounds but can stray)
      for (let i = 0; i < numPoints; i++) {
        const nextX = Math.random() * screenWidth * 1.2 - screenWidth * 0.1; // Allow some overshoot
        const nextY = Math.random() * screenHeight * 1.2 - screenHeight * 0.1;
        waypoints.push({ x: nextX, y: nextY });
      }

      // Ensure the last point is off-screen for exit
      const exitDirection = Math.floor(Math.random() * 4);
      let exitX = 0,
        exitY = 0;

      switch (exitDirection) {
        case 0:
          exitX = Math.random() * screenWidth;
          exitY = -margin;
          break; // Exit Top
        case 1:
          exitX = screenWidth + margin;
          exitY = Math.random() * screenHeight;
          break; // Exit Right
        case 2:
          exitX = Math.random() * screenWidth;
          exitY = screenHeight + margin;
          break; // Exit Bottom
        case 3:
          exitX = -margin;
          exitY = Math.random() * screenHeight;
          break; // Exit Left
      }
      waypoints.push({ x: exitX, y: exitY }); // Add final exit point

      // Create the path object and normalized times array
      const path = {
        x: waypoints.map((p) => p.x),
        y: waypoints.map((p) => p.y)
      };
      // `times` array maps each point to a normalized time (0 to 1)
      const times = Array.from({ length: path.x.length }, (_, i) => i / (path.x.length - 1));

      return { path, times };
    },
    [] // No dependencies needed for this generation logic
  );

  // Function to create the data object for a new shape with adjusted speed
  const createShape = useCallback((): ShapeData | null => {
    const shapeId = shapeCount.current++;
    const types: Array<"circle" | "square" | "triangle"> = ["circle", "square", "triangle"];
    const type = types[Math.floor(Math.random() * types.length)];
    const size = 20 + Math.random() * (type === "circle" ? 100 : 70);

    // Generate the path and times for this shape
    const { path, times } = generatePath(windowSize.width, windowSize.height, size);
    // Ensure path has at least start and end points
    if (!path || path.x.length < 2) return null;

    // Generate color in blue/cyan range with some base opacity
    const blueValue = Math.floor(180 + Math.random() * 75); // 180-255
    const greenValue = Math.floor(80 + Math.random() * 120); // 80-200
    const baseOpacity = 0.4 + Math.random() * 0.3; // 0.4-0.7
    const color = `rgba(0, ${greenValue}, ${blueValue}, ${baseOpacity.toFixed(2)})`;

    const blur = 8 + Math.random() * 3; // 8-11px blur

    // *** SPEED CONFIGURATION TO MATCH ORIGINAL FEEL ***
    // Generate speed similar to the original (approx seconds per point/segment)
    const speed = 15 + Math.random() * 5; // 15-20

    // Calculate total duration based on number of points and speed
    // Mimics original logic: path.x.length * speed
    // Use (path.x.length - 1) if speed should represent seconds per segment instead of per point
    const totalDuration = path.x.length * speed * 1000; // Duration in milliseconds

    // *** END SPEED CONFIGURATION ***

    return {
      id: shapeId,
      type,
      path,
      times,
      color,
      size,
      blur,
      createdAt: Date.now(),
      totalDuration
    };
  }, [windowSize.width, windowSize.height, generatePath]); // Depends on window size and the path generator

  // Effect to manage the addition and removal of shapes over time
  useEffect(() => {
    // Create initial batch of shapes
    const initialShapes: ShapeData[] = [];
    for (let i = 0; i < targetShapeCount; i++) {
      const newShape = createShape();
      if (newShape) initialShapes.push(newShape);
    }
    setShapes(initialShapes);

    // Interval to periodically check and update shapes
    const checkShapesInterval = setInterval(() => {
      setShapes((currentShapes) => {
        const now = Date.now();

        // Filter out shapes whose animation has finished (add a small buffer)
        const activeShapes = currentShapes.filter(
          (shape) => now < shape.createdAt + shape.totalDuration + 500 // Keep for 0.5s after animation ends
        );

        // Calculate how many new shapes to add
        let shapesToAdd = targetShapeCount - activeShapes.length;
        // Ensure we don't exceed the absolute maximum
        shapesToAdd = Math.min(shapesToAdd, maxShapes - activeShapes.length);
        shapesToAdd = Math.max(0, shapesToAdd); // Ensure it's not negative

        // Create and add the new shapes
        const newShapes = [...activeShapes];
        for (let i = 0; i < shapesToAdd; i++) {
          const newShape = createShape();
          if (newShape) newShapes.push(newShape);
        }

        // Optional: If somehow exceeded maxShapes, trim the oldest
        if (newShapes.length > maxShapes) {
          newShapes.sort((a, b) => a.createdAt - b.createdAt); // Sort oldest first
          return newShapes.slice(newShapes.length - maxShapes); // Keep only the newest maxShapes
        }

        return newShapes;
      });
    }, 2000); // Check every 2 seconds

    // Cleanup interval on component unmount
    return () => clearInterval(checkShapesInterval);
  }, [createShape, targetShapeCount, maxShapes]); // Rerun if creation logic or counts change

  // Use the custom hook to handle drawing shapes onto the canvas
  useCanvasShapes(canvasRef as React.RefObject<HTMLCanvasElement>, shapes, windowSize);

  // --- Render Component ---
  return (
    <div className="app-drag select-none relative h-screen w-full overflow-hidden bg-[#050A20] flex flex-col items-center justify-center">
      {/* Set document title */}
      <title>Onboarding | Flow Browser</title>

      {/* Canvas for drawing the animated shapes */}
      <canvas
        ref={canvasRef}
        // Width/height attributes are set dynamically for HiDPI support
        className="absolute inset-0 z-0" // Place behind other elements
      />

      {/* Dynamic backdrop blur container (Optional: Performance heavy) */}
      {/* Positioned above canvas (z-10) but below content (z-20) */}
      <motion.div
        className="absolute inset-0 w-full h-full z-10 pointer-events-none" // No pointer events
        style={{
          backdropFilter: `blur(${blurIntensity}px)`,
          WebkitBackdropFilter: `blur(${blurIntensity}px)`,
          transition: "backdrop-filter 3s ease-in-out, -webkit-backdrop-filter 3s ease-in-out"
        }}
        aria-hidden="true" // Hide from accessibility tree
      />

      {/* Animated gradient orbs (Keep as motion.div or draw on canvas) */}
      {/* Placed behind backdrop blur and content (using z-index) */}
      <motion.div
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{
          x: [0, -100, 50, -70, 100, -50, 0],
          y: [0, 50, -100, 70, -50, 100, 0],
          scale: [1, 1.2, 0.9, 1.1, 0.95, 1.05, 1]
        }}
        transition={{
          duration: 60,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut"
        }}
        className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-radial from-[#0066FF]/40 via-[#0066FF]/20 to-transparent blur-[60px] z-[5] pointer-events-none"
        aria-hidden="true"
      />

      <motion.div
        initial={{ x: 0, y: 0, scale: 1 }}
        animate={{
          x: [0, 100, -50, 70, -100, 50, 0],
          y: [0, -70, 100, -50, 70, -100, 0],
          scale: [1, 0.8, 1.2, 0.9, 1.1, 0.85, 1]
        }}
        transition={{
          duration: 70,
          repeat: Number.POSITIVE_INFINITY,
          ease: "easeInOut",
          delay: 2
        }}
        className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] rounded-full bg-radial from-[#0066FF]/30 via-[#0055DD]/15 to-transparent blur-[70px] z-[5] pointer-events-none"
        aria-hidden="true"
      />

      {/* Container for the actual screen content */}
      {/* Positioned above all background effects (z-20) */}
      <div className="relative z-20 w-full h-full flex flex-col items-center justify-center p-4">
        {/* Render children passed to the component */}
        {children}
      </div>
    </div>
  );
}

// Optional: export default if this is the primary export of the file
export default OnboardingScreen;
