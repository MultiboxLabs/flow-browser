import { PinGrid } from "@/components/browser-ui/browser-sidebar/_components/pin-grid/normal/pin-grid";
import { SlotMachineGuard } from "./slot-machine/guard";
import { SlotMachinePinGrid } from "./slot-machine/main";
import { useState } from "react";

export function PinGridGate() {
  const [passed, setPassed] = useState(false);

  if (!passed) {
    return (
      <>
        <PinGrid />
        <SlotMachineGuard passed={passed} setPassed={setPassed} />
      </>
    );
  }
  return (
    <>
      <SlotMachinePinGrid />
      <SlotMachineGuard passed={passed} setPassed={setPassed} />
    </>
  );
}
