import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export function GeneralSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">General</h2>
        <p className="text-muted-foreground">Manage your browser's general settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Startup</CardTitle>
          <CardDescription>Configure how your browser starts up</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="startup-homepage">Open specific page on startup</Label>
            <Switch id="startup-homepage" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="homepage">Homepage</Label>
            <Input id="homepage" placeholder="https://www.example.com" />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="restore-tabs">Restore previous session on startup</Label>
            <Switch id="restore-tabs" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Downloads</CardTitle>
          <CardDescription>Configure download behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="download-location">Download location</Label>
            <div className="flex gap-2">
              <Input id="download-location" value="/Users/username/Downloads" readOnly className="flex-1" />
              <Button variant="outline">Change</Button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="ask-location">Ask where to save each file before downloading</Label>
            <Switch id="ask-location" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Default Browser</CardTitle>
          <CardDescription>Set your browser as the default</CardDescription>
        </CardHeader>
        <CardContent>
          <Button>Make Default</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Language</CardTitle>
          <CardDescription>Choose your preferred language</CardDescription>
        </CardHeader>
        <CardContent>
          <Select defaultValue="en-US">
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en-US">English (United States)</SelectItem>
              <SelectItem value="en-GB">English (United Kingdom)</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="ja">Japanese</SelectItem>
              <SelectItem value="zh">Chinese</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>
    </div>
  )
}

