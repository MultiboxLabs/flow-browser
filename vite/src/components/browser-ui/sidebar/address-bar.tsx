import { useBrowser } from "@/components/main/browser-context";
import { Input } from "@/components/ui/input";
import { SidebarGroup, useSidebar } from "@/components/ui/resizable-sidebar";
import { showOmnibox } from "@/lib/flow";
import { simplifyUrl } from "@/lib/url";
import { useRef } from "react";

function FakeAddressBar() {
  const { addressUrl } = useBrowser();

  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    const inputBox = inputRef.current;
    if (!inputBox) return;

    const inputBoxBounds = inputBox.getBoundingClientRect();

    showOmnibox(
      {
        x: inputBoxBounds.x,
        y: inputBoxBounds.y,
        width: inputBoxBounds.width * 2,
        height: inputBoxBounds.height * 8
      },
      {
        currentInput: addressUrl,
        openIn: "current"
      }
    );
  };

  return (
    <Input
      ref={inputRef}
      placeholder="Search or type URL"
      value={simplifyUrl(addressUrl)}
      className="rounded-xl"
      readOnly
      onClick={handleClick}
    />
  );
}

export function SidebarAddressBar() {
  const { open } = useSidebar();
  if (!open) return null;

  return (
    <SidebarGroup className="pt-0">
      <FakeAddressBar />
    </SidebarGroup>
  );
}
