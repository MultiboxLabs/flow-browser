import { useBrowser } from "@/components/main/browser-context";
import { Input } from "@/components/ui/input";
import { SidebarGroup, useSidebar } from "@/components/ui/resizable-sidebar";
import { simplifyUrl } from "@/lib/url";

function FakeAddressBar() {
  const { addressUrl } = useBrowser();
  const { open } = useSidebar();

  if (!open) return null;

  return <Input placeholder="Search or type URL" value={simplifyUrl(addressUrl)} className="select-none" readOnly />;
}

export function SidebarAddressBar() {
  return (
    <SidebarGroup className="pt-0">
      <FakeAddressBar />
    </SidebarGroup>
  );
}
