import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

export function ResetOnboardingCard() {
  const [isResetting, setIsResetting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    try {
      flow.onboarding.reset();
    } catch (error) {
      console.error("Failed to reset onboarding:", error);
    } finally {
      setIsResetting(false);
      setDialogOpen(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Onboarding</CardTitle>
        <CardDescription>Reset the onboarding walkthrough</CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="secondary" className="w-full" disabled={isResetting}>
              Reset Onboarding
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Reset Onboarding?</DialogTitle>
              <DialogDescription>
                {`Are you sure? This will close the app. Your data won't be reset, but any unsaved website data may be lost.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleReset} disabled={isResetting}>
                {isResetting ? "Resetting..." : "Reset"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
