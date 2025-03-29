import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"

export function PrivacySettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Privacy & Security</h2>
        <p className="text-muted-foreground">Manage your privacy and security settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Tracking Protection</CardTitle>
          <CardDescription>Control how your browsing is tracked</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="tracking-protection" className="block">
                Enhanced tracking protection
              </Label>
              <p className="text-sm text-muted-foreground">Block known trackers and cross-site cookies</p>
            </div>
            <Switch id="tracking-protection" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="do-not-track" className="block">
                Send "Do Not Track" signal
              </Label>
              <p className="text-sm text-muted-foreground">Request websites not to track you</p>
            </div>
            <Switch id="do-not-track" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cookies</CardTitle>
          <CardDescription>Manage how websites store cookies</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="block-cookies" className="block">
                Block third-party cookies
              </Label>
              <p className="text-sm text-muted-foreground">Prevent sites from storing third-party cookies</p>
            </div>
            <Switch id="block-cookies" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="clear-exit" className="block">
                Clear cookies when browser closes
              </Label>
              <p className="text-sm text-muted-foreground">Automatically delete cookies on exit</p>
            </div>
            <Switch id="clear-exit" />
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline">Clear All Cookies</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Browsing Data</CardTitle>
          <CardDescription>Manage your browsing history and cache</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="save-history" className="block">
                Save browsing history
              </Label>
              <p className="text-sm text-muted-foreground">Keep a record of sites you visit</p>
            </div>
            <Switch id="save-history" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="clear-exit-data" className="block">
                Clear browsing data on exit
              </Label>
              <p className="text-sm text-muted-foreground">Automatically clear history when browser closes</p>
            </div>
            <Switch id="clear-exit-data" />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col items-start space-y-2">
          <p className="text-sm text-muted-foreground">Clear the following items:</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm">
              Browsing History
            </Button>
            <Button variant="outline" size="sm">
              Cookies
            </Button>
            <Button variant="outline" size="sm">
              Cache
            </Button>
            <Button variant="outline" size="sm">
              Downloads
            </Button>
            <Button variant="outline" size="sm">
              Passwords
            </Button>
          </div>
          <Button className="mt-2">Clear Data</Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Permissions</CardTitle>
          <CardDescription>Manage site permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button variant="outline" className="w-full justify-start">
              <span>Location</span>
              <span className="ml-auto text-xs text-muted-foreground">3 sites allowed</span>
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <span>Camera</span>
              <span className="ml-auto text-xs text-muted-foreground">1 site allowed</span>
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <span>Microphone</span>
              <span className="ml-auto text-xs text-muted-foreground">1 site allowed</span>
            </Button>
            <Button variant="outline" className="w-full justify-start">
              <span>Notifications</span>
              <span className="ml-auto text-xs text-muted-foreground">5 sites allowed</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

