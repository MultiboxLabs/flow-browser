import { SelectItem } from "@/components/ui/select";
import { SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useEffect, useState } from "react";
import { NewTabMode } from "@/lib/flow/interfaces/app/newTab";

export function NewTabModeCard() {
  const [mode, setMode] = useState<NewTabMode>("omnibox");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchMode = async () => {
      try {
        const currentMode = await flow.newTab.getCurrentNewTabMode();
        setMode(currentMode);
      } catch (error) {
        console.error("Failed to fetch new tab mode:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMode();
  }, []);

  const handleModeChange = async (newMode: NewTabMode) => {
    setIsSaving(true);
    try {
      await flow.newTab.setCurrentNewTabMode(newMode);
      setMode(newMode);
    } catch (error) {
      console.error("Failed to update new tab mode:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>New Tab Mode</CardTitle>
        <CardDescription>Choose how new tabs should open</CardDescription>
      </CardHeader>
      <CardContent>
        <Select value={mode} onValueChange={handleModeChange} disabled={isLoading || isSaving}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={isLoading ? "Loading..." : "Select new tab mode"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="omnibox">Command Palette</SelectItem>
            <SelectItem value="tab">Page</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
