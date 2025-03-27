import { useState } from "react"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface AppearanceSettingsProps {
  theme: "light" | "dark" | "system"
  setTheme: (theme: "light" | "dark" | "system") => void
}

export function AppearanceSettings({ theme, setTheme }: AppearanceSettingsProps) {
  const [fontSize, setFontSize] = useState(16)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Appearance</h2>
        <p className="text-muted-foreground">Customize how your browser looks</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Theme</CardTitle>
          <CardDescription>Choose your preferred theme</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue={theme} onValueChange={(value) => setTheme(value as "light" | "dark" | "system")}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="light">Light</TabsTrigger>
              <TabsTrigger value="dark">Dark</TabsTrigger>
              <TabsTrigger value="system">System</TabsTrigger>
            </TabsList>
            <TabsContent value="light" className="mt-4">
              <div className="rounded-lg border p-4">
                <div className="h-40 rounded-md bg-white shadow-sm"></div>
                <p className="mt-2 text-center text-sm">Light theme preview</p>
              </div>
            </TabsContent>
            <TabsContent value="dark" className="mt-4">
              <div className="rounded-lg border p-4">
                <div className="h-40 rounded-md bg-slate-900 shadow-sm"></div>
                <p className="mt-2 text-center text-sm">Dark theme preview</p>
              </div>
            </TabsContent>
            <TabsContent value="system" className="mt-4">
              <div className="rounded-lg border p-4">
                <div className="h-40 rounded-md bg-gradient-to-r from-white to-slate-900 shadow-sm"></div>
                <p className="mt-2 text-center text-sm">Follows your system settings</p>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Font Size</CardTitle>
          <CardDescription>Adjust the text size for webpages</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Slider defaultValue={[16]} max={24} min={12} step={1} onValueChange={(value) => setFontSize(value[0])} />
          <div className="flex items-center justify-between">
            <span className="text-sm">Small</span>
            <span className="text-sm font-medium">{fontSize}px</span>
            <span className="text-sm">Large</span>
          </div>
          <div className="mt-4 rounded-lg border p-4 text-center" style={{ fontSize: `${fontSize}px` }}>
            Sample Text
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Home Button</CardTitle>
          <CardDescription>Show or hide the home button in the toolbar</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-home">Show home button</Label>
            <Switch id="show-home" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tab Layout</CardTitle>
          <CardDescription>Choose how tabs are displayed</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup defaultValue="compact">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="compact" id="compact" />
              <Label htmlFor="compact">Compact</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="normal" id="normal" />
              <Label htmlFor="normal">Normal</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="expanded" id="expanded" />
              <Label htmlFor="expanded">Expanded</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>
    </div>
  )
}

