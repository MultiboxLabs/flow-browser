import { CheckIcon, CheckIconHandle } from "@/components/icons/check";
import { LinkIcon } from "@/components/icons/link";
import { useActions } from "@/components/providers/actions-provider";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion, usePresence } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

function CopiedCheckIcon() {
  const checkIconRef = useRef<CheckIconHandle>(null);

  const [isPresent, safeToRemove] = usePresence();

  const handleStartAnimation = useCallback(() => {
    const checkIcon = checkIconRef.current;
    if (!checkIcon) return;

    checkIcon.startAnimation();
  }, []);

  const handleExitAnimation = useCallback(() => {
    const checkIcon = checkIconRef.current;
    if (!checkIcon) return;

    checkIcon.exitAnimation().then(() => {
      safeToRemove?.();
    });
  }, [safeToRemove]);

  // On mount, start the animation
  useEffect(() => {
    if (isPresent) {
      handleStartAnimation();
    } else {
      handleExitAnimation();
    }
  }, [isPresent, handleStartAnimation, handleExitAnimation]);

  return <CheckIcon ref={checkIconRef} className="size-3.5 !bg-transparent !cursor-default" strokeWidth={2} />;
}

function CopyLinkIcon() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.2 }}
    >
      <LinkIcon className="size-3.5 !bg-transparent !cursor-default" strokeWidth={2} />
    </motion.div>
  );
}

export function AddressBarCopyLinkButton() {
  const { copyLink } = useActions();

  const [copied, setCopied] = useState(false);
  const copyUrl = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();

    if (copied) return;

    copyLink();

    setCopied(true);
    setTimeout(() => {
      setCopied(false);
    }, 3000);
  };

  return (
    <Button variant="ghost" size="icon" className="size-6 hover:bg-black/10 dark:hover:bg-white/10" onClick={copyUrl}>
      <AnimatePresence mode="wait" initial={true}>
        {!copied && <CopyLinkIcon key="copy-link" />}
        {copied && <CopiedCheckIcon key="copied-check" />}
      </AnimatePresence>
    </Button>
  );
}
