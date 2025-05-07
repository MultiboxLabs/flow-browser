import { BrowserInfoCard } from "./browser-info-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export function AboutSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">About</h2>
        <p className="text-muted-foreground">Information about your browser</p>
      </div>

      <BrowserInfoCard />

      {/* eslint-disable-next-line no-constant-binary-expression */}
      {false && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Troubleshooting</CardTitle>
              <CardDescription>Tools to help resolve issues</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                Reset Browser Settings
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Clear Browsing Data
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Restart Browser
              </Button>
              <Button variant="outline" className="w-full justify-start">
                Report an Issue
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
