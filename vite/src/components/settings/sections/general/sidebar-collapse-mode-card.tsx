import { SelectItem } from "@/components/ui/select";
import { SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useEffect, useState } from "react";

type CollapseMode = "icon" | "offcanvas";

export function SidebarCollapseModeCard() {
  const [mode, setMode] = useState<CollapseMode>("icon");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchMode = async () => {
      try {
        const currentMode = await flow.settings.getSidebarCollapseMode();
        setMode(currentMode);
      } catch (error) {
        console.error("Failed to fetch sidebar collapse mode:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMode();
  }, []);

  const handleModeChange = async (newMode: CollapseMode) => {
    setIsSaving(true);
    try {
      await flow.settings.setSidebarCollapseMode(newMode);
      setMode(newMode);
    } catch (error) {
      console.error("Failed to update sidebar collapse mode:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sidebar Collapse Mode</CardTitle>
        <CardDescription>Choose how the sidebar should collapse</CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={mode} onValueChange={handleModeChange} disabled={isLoading || isSaving}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoading ? "Loading..." : "Select collapse mode"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="icon">Icon</SelectItem>
            <SelectItem value="offcanvas">Off-Screen</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
