import { useEffect, useState, useRef, useCallback } from "react";
import { motion } from "motion/react";

// Shape component with enhanced movement patterns
type ShapeData = {
  id: number;
  type: string;
  initialX: number | undefined;
  initialY: number | undefined;
  color: string;
  size: number;
  blur: number;
  speed: number;
  createdAt: number;
};

type ShapeProps = Pick<ShapeData, "type" | "initialX" | "initialY" | "color" | "size" | "blur" | "speed">;
type Waypoint = { x: number; y: number };

const Shape = ({ type, initialX, initialY, color, size, blur, speed }: ShapeProps) => {
  const [path, setPath] = useState<{ x: number[]; y: number[] }>({
    x: [],
    y: []
  });
  const [isReady, setIsReady] = useState(false);

  // Generate a complex path with many waypoints
  const generatePath = useCallback(
    (screenWidth: number, screenHeight: number) => {
      const waypoints: Waypoint[] = [];
      const numPoints = 15 + Math.floor(Math.random() * 10); // 15-24 waypoints

      for (let i = 0; i < numPoints; i++) {
        // Generate next point with some constraints to keep movement natural
        const nextX = Math.random() * screenWidth * 1.2 - screenWidth * 0.1;
        const nextY = Math.random() * screenHeight * 1.2 - screenHeight * 0.1;

        waypoints.push({ x: nextX, y: nextY });
      }

      // Ensure the last point is off-screen
      const exitDirection = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
      let exitX: number = 0;
      let exitY: number = 0;

      switch (exitDirection) {
        case 0: // top
          exitX = Math.random() * screenWidth;
          exitY = -size * 2;
          break;
        case 1: // right
          exitX = screenWidth + size * 2;
          exitY = Math.random() * screenHeight;
          break;
        case 2: // bottom
          exitX = Math.random() * screenWidth;
          exitY = screenHeight + size * 2;
          break;
        case 3: // left
          exitX = -size * 2;
          exitY = Math.random() * screenHeight;
          break;
      }

      waypoints.push({ x: exitX, y: exitY });

      return {
        x: waypoints.map((p) => p.x) as number[],
        y: waypoints.map((p) => p.y) as number[]
      };
    },
    [size]
  );

  useEffect(() => {
    // Get screen dimensions
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Generate the path
    const newPath = generatePath(screenWidth, screenHeight);
    setPath(newPath);
    setIsReady(true);

    // Component will unmount and be removed naturally when animation ends
  }, [generatePath]);

  // Render different shape types
  const renderShape = () => {
    if (!isReady) return null;

    // Calculate total duration based on path complexity and speed
    const duration = path.x.length * speed;

    const times = Array.from({ length: path.x.length }, (_, i) => i / (path.x.length - 1));

    const transitionProps = {
      duration: duration,
      times: times,
      ease: "linear"
    };

    switch (type) {
      case "circle":
        return (
          <motion.div
            initial={{ x: initialX, y: initialY, opacity: 0 }}
            animate={{
              x: path.x,
              y: path.y,
              opacity: [0, 0.7, 0.7, 0]
            }}
            transition={{
              ...transitionProps,
              opacity: {
                duration: duration,
                times: [0, 0.05, 0.95, 1]
              }
            }}
            className="absolute rounded-full"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              filter: `blur(${blur}px)`
            }}
          />
        );
      case "square":
        return (
          <motion.div
            initial={{ x: initialX, y: initialY, opacity: 0, rotate: 0 }}
            animate={{
              x: path.x,
              y: path.y,
              opacity: [0, 0.7, 0.7, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              ...transitionProps,
              opacity: {
                duration: duration,
                times: [0, 0.05, 0.95, 1]
              },
              rotate: {
                duration: duration,
                times: [0, 0.5, 1]
              }
            }}
            className="absolute"
            style={{
              width: size,
              height: size,
              backgroundColor: color,
              filter: `blur(${blur}px)`
            }}
          />
        );
      case "triangle":
        return (
          <motion.div
            initial={{ x: initialX, y: initialY, opacity: 0, rotate: 0 }}
            animate={{
              x: path.x,
              y: path.y,
              opacity: [0, 0.7, 0.7, 0],
              rotate: [0, 180, 360]
            }}
            transition={{
              ...transitionProps,
              opacity: {
                duration: duration,
                times: [0, 0.05, 0.95, 1]
              },
              rotate: {
                duration: duration,
                times: [0, 0.5, 1]
              }
            }}
            className="absolute"
            style={{
              width: 0,
              height: 0,
              borderLeft: `${size / 2}px solid transparent`,
              borderRight: `${size / 2}px solid transparent`,
              borderBottom: `${size}px solid ${color}`,
              filter: `blur(${blur}px)`
            }}
          />
        );
      default:
        return null;
    }
  };

  return renderShape();
};

export function OnboardingScreen({ children }: { children?: React.ReactNode }) {
  const [blurIntensity, setBlurIntensity] = useState(8);
  const [shapes, setShapes] = useState<ShapeData[]>([]);
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1200,
    height: typeof window !== "undefined" ? window.innerHeight : 800
  });

  const shapeCount = useRef(0);
  const targetShapeCount = 30; // Target number of shapes on screen
  const maxShapes = 50; // Maximum number of shapes to prevent performance issues

  // Update window size on resize
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Animate blur intensity
  useEffect(() => {
    const blurInterval = setInterval(() => {
      setBlurIntensity(5 + Math.random() * 10);
    }, 3000);

    return () => clearInterval(blurInterval);
  }, []);

  // Create a new shape
  const createShape = useCallback((): ShapeData => {
    const shapeId = shapeCount.current++;
    const types = ["circle", "square", "triangle"];
    const type = types[Math.floor(Math.random() * types.length)];

    // Determine starting position (off-screen)
    const startPosition = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
    let initialX: number | undefined = undefined;
    let initialY: number | undefined = undefined;

    const size = 20 + Math.random() * (type === "circle" ? 100 : 70);

    switch (startPosition) {
      case 0: // top
        initialX = Math.random() * windowSize.width;
        initialY = -size * 2;
        break;
      case 1: // right
        initialX = windowSize.width + size * 2;
        initialY = Math.random() * windowSize.height;
        break;
      case 2: // bottom
        initialX = Math.random() * windowSize.width;
        initialY = windowSize.height + size * 2;
        break;
      case 3: // left
        initialX = -size * 2;
        initialY = Math.random() * windowSize.height;
        break;
    }

    // Generate color in blue range
    const blueValue = Math.floor(180 + Math.random() * 75);
    const greenValue = Math.floor(80 + Math.random() * 120);
    const color = `rgba(0, ${greenValue}, ${blueValue}, ${0.1 + Math.random() * 0.3})`;

    const blur = 8 + Math.random() * 3;
    const speed = 15 + Math.random() * 5; // seconds per waypoint

    return {
      id: shapeId,
      type,
      initialX,
      initialY,
      color,
      size,
      blur,
      speed,
      createdAt: Date.now()
    };
  }, [windowSize]);

  // Manage shapes - add new ones and remove old ones
  useEffect(() => {
    // Initial shapes
    const initialShapes: ShapeData[] = [];
    for (let i = 0; i < targetShapeCount; i++) {
      initialShapes.push(createShape());
    }
    setShapes(initialShapes);

    // Periodically check and add new shapes
    const checkShapes = () => {
      setShapes((currentShapes) => {
        // Remove shapes older than 60 seconds (they should be off-screen by then)
        const filteredShapes = currentShapes.filter((shape) => Date.now() - shape.createdAt < 60000);

        // Add new shapes if we're below target
        const newShapes = [...filteredShapes];
        const shapesToAdd = Math.min(targetShapeCount - filteredShapes.length, maxShapes - filteredShapes.length);

        for (let i = 0; i < shapesToAdd; i++) {
          newShapes.push(createShape());
        }

        return newShapes;
      });
    };

    const interval = setInterval(checkShapes, 2000); // Check every 2 seconds
    return () => clearInterval(interval);
  }, [createShape, windowSize]);

  return (
    <div className="app-drag select-none relative h-screen w-full overflow-hidden bg-[#050A20] flex flex-col items-center justify-center">
      <title>Onboarding | Flow Browser</title>

      {/* Dynamic backdrop blur container */}
      <motion.div
        className="absolute inset-0 w-full h-full"
        style={{
          backdropFilter: `blur(${blurIntensity}px)`,
          WebkitBackdropFilter: `blur(${blurIntensity}px)`,
          transition: "backdrop-filter 3s ease-in-out, -webkit-backdrop-filter 3s ease-in-out"
        }}
      />

      {/* Background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        {shapes.map((shape) => (
          <Shape
            key={shape.id}
            type={shape.type}
            initialX={shape.initialX}
            initialY={shape.initialY}
            color={shape.color}
            size={shape.size}
            blur={shape.blur}
            speed={shape.speed}
          />
        ))}
      </div>

      {/* Animated gradient orbs */}
      <motion.div
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
        className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full bg-radial from-[#0066FF]/40 via-[#0066FF]/20 to-transparent blur-[60px]"
      />

      <motion.div
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
        className="absolute bottom-[-30%] right-[-20%] w-[80%] h-[80%] rounded-full bg-radial from-[#0066FF]/30 via-[#0055DD]/15 to-transparent blur-[70px]"
      />

      {children}
    </div>
  );
}
