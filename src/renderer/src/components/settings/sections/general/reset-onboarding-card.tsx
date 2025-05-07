import { Button } from "@/components/ui/button";
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
    <div className="remove-app-drag rounded-lg border p-6 bg-card">
      <div className="mb-4">
        <h3 className="text-xl font-semibold tracking-tight text-card-foreground">Onboarding</h3>
        <p className="text-sm text-muted-foreground mt-1">Reset the onboarding walkthrough</p>
      </div>
      <div>
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
      </div>
    </div>
  );
}
