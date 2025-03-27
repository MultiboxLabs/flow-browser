import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export function SearchSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Search</h2>
        <p className="text-muted-foreground">Configure your search settings</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Default Search Engine</CardTitle>
          <CardDescription>Choose which search engine to use by default</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup defaultValue="google">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="google" id="google" />
              <Label htmlFor="google">Google</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="bing" id="bing" />
              <Label htmlFor="bing">Bing</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="duckduckgo" id="duckduckgo" />
              <Label htmlFor="duckduckgo">DuckDuckGo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="ecosia" id="ecosia" />
              <Label htmlFor="ecosia">Ecosia</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="yahoo" id="yahoo" />
              <Label htmlFor="yahoo">Yahoo</Label>
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Search Suggestions</CardTitle>
          <CardDescription>Configure search suggestions behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-suggestions" className="block">
                Show search suggestions
              </Label>
              <p className="text-sm text-muted-foreground">Display suggestions as you type in the address bar</p>
            </div>
            <Switch id="show-suggestions" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="autocomplete" className="block">
                Autocomplete searches
              </Label>
              <p className="text-sm text-muted-foreground">Automatically complete search terms</p>
            </div>
            <Switch id="autocomplete" defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address Bar</CardTitle>
          <CardDescription>Configure address bar behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-engine">When using the address bar, search with:</Label>
            <Select defaultValue="default">
              <SelectTrigger id="search-engine">
                <SelectValue placeholder="Select search engine" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="default">Default search engine</SelectItem>
                <SelectItem value="google">Google</SelectItem>
                <SelectItem value="bing">Bing</SelectItem>
                <SelectItem value="duckduckgo">DuckDuckGo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-bookmarks" className="block">
                Show bookmarks in address bar results
              </Label>
              <p className="text-sm text-muted-foreground">Include bookmarks in address bar suggestions</p>
            </div>
            <Switch id="show-bookmarks" defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="show-history" className="block">
                Show browsing history in address bar results
              </Label>
              <p className="text-sm text-muted-foreground">Include history in address bar suggestions</p>
            </div>
            <Switch id="show-history" defaultChecked />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

