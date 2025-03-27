import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

export function AboutSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">About</h2>
        <p className="text-muted-foreground">Information about your browser</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Browser Information</CardTitle>
          <CardDescription>Details about your browser version</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <div className="text-sm font-medium">Browser Name:</div>
            <div className="text-sm">Flow Browser</div>

            <div className="text-sm font-medium">Version:</div>
            <div className="text-sm">1.0.0</div>

            <div className="text-sm font-medium">Build:</div>
            <div className="text-sm">20240323.1</div>

            <div className="text-sm font-medium">Engine:</div>
            <div className="text-sm">Chromium 123.0.6312.58</div>

            <div className="text-sm font-medium">OS:</div>
            <div className="text-sm">Windows 11</div>

            <div className="text-sm font-medium">Update Channel:</div>
            <div className="text-sm">Stable</div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Updates</CardTitle>
          <CardDescription>Check for browser updates</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Current Version: 1.0.0</p>
              <p className="text-sm text-muted-foreground">Your browser is up to date</p>
            </div>
            <Button>Check for Updates</Button>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Downloading update...</span>
              <span>45%</span>
            </div>
            <Progress value={45} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Legal Information</CardTitle>
          <CardDescription>Terms of service and licenses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="link" className="h-auto p-0 text-sm">
            Terms of Service
          </Button>
          <Button variant="link" className="h-auto p-0 text-sm">
            Privacy Policy
          </Button>
          <Button variant="link" className="h-auto p-0 text-sm">
            Open Source Licenses
          </Button>
        </CardContent>
      </Card>

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
    </div>
  )
}

