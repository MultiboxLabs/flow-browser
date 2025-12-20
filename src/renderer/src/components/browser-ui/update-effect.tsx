import { motion } from "motion/react";
import { useEffect, useState } from "react";

const ANIMATION_DELAY_SECONDS = 1;

export function UpdateEffect() {
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    setTimeout(
      () => {
        setCompleted(true);
      },
      1000 + ANIMATION_DELAY_SECONDS * 1000
    );
  }, []);

  if (completed) {
    return null;
  }

  return (
    <>
      <motion.div
        className="browser-update-animation"
        initial={{ top: "100%", opacity: 0.5 }}
        animate={{ top: "-100%", opacity: 1 }}
        transition={{ duration: 0.6, delay: ANIMATION_DELAY_SECONDS }}
      ></motion.div>
      <motion.div
        className="browser-update-animation-border"
        initial={{ "--background-top": "150%" }}
        animate={{ "--background-top": "-50%" }}
        transition={{ duration: 0.3, delay: ANIMATION_DELAY_SECONDS + 0.08 }}
      ></motion.div>
    </>
  );
}
