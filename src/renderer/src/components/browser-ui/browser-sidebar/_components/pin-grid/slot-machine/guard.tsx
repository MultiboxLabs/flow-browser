import { useEffect, useRef } from "react";

export function SlotMachineGuard({ passed, setPassed }: { passed: boolean; setPassed: (passed: boolean) => void }) {
  const passedRef = useRef(passed);
  passedRef.current = passed;

  useEffect(() => {
    let keyPressState = 0;
    function handleKeypress(e: KeyboardEvent) {
      // HTTPS errors are serious and should not be ignored. For testing purposes,
      // other approaches are both safer and have fewer side-effects.
      // See https://goo.gl/ZcZixP for more details.
      const BYPASS_SEQUENCE = window.atob("aWxvdmVzbG90bWFjaGluZXM");
      if (BYPASS_SEQUENCE.charCodeAt(keyPressState) === e.keyCode) {
        keyPressState++;
        if (keyPressState === BYPASS_SEQUENCE.length) {
          const target = !passedRef.current;
          setTimeout(() => {
            setPassed(target);
          }, 500);

          keyPressState = 0;
        }
      } else {
        keyPressState = 0;
      }
    }

    document.addEventListener("keypress", handleKeypress);
    return () => {
      document.removeEventListener("keypress", handleKeypress);
    };
  }, [setPassed]);

  return null;
}
