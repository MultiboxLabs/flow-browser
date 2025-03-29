import { SelectItem } from "@/components/ui/select";
import { SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { getCurrentNewTabMode, NewTabMode, setCurrentNewTabMode } from "@/lib/flow";
import { useEffect, useState } from "react";

export function NewTabModeCard() {
  const [mode, setMode] = useState<NewTabMode>("omnibox");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchMode = async () => {
      try {
        const currentMode = await getCurrentNewTabMode();
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
      await setCurrentNewTabMode(newMode);
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
            <SelectItem value="omnibox">Popup Box</SelectItem>
            <SelectItem value="tab">Page</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
