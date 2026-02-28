import { PinGridCarousel } from "./carousel";
import { SlotMachineGuard } from "./slot-machine/guard";
import { SlotMachinePinGrid } from "./slot-machine/main";
import { useState } from "react";

export function PinGridGate() {
  const [passed, setPassed] = useState(false);

  if (!passed) {
    return (
      <>
        <PinGridCarousel />
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
