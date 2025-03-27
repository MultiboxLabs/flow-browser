import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { MoreHorizontal } from "lucide-react"

export function ExtensionsSettings() {
  const extensions = [
    {
      id: 1,
      name: "Ad Blocker Plus",
      description: "Block ads and pop-ups",
      enabled: true,
      icon: "🛡️",
    },
    {
      id: 2,
      name: "Dark Reader",
      description: "Dark mode for every website",
      enabled: true,
      icon: "🌙",
    },
    {
      id: 3,
      name: "Password Manager",
      description: "Securely store and autofill passwords",
      enabled: true,
      icon: "🔑",
    },
    {
      id: 4,
      name: "Grammar Checker",
      description: "Check spelling and grammar",
      enabled: false,
      icon: "✓",
    },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-200">Extensions</h2>
          <p className="text-muted-foreground">Manage your browser extensions</p>
        </div>
        <Button>Add Extension</Button>
      </div>

      <div className="space-y-4">
        {extensions.map((extension) => (
          <Card key={extension.id}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-10 w-10 items-center justify-center rounded-md border bg-muted text-xl">
                    {extension.icon}
                  </div>
                  <div>
                    <CardTitle className="text-base">{extension.name}</CardTitle>
                    <CardDescription>{extension.description}</CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={extension.enabled} />
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  Options
                </Button>
                <Button variant="outline" size="sm">
                  Details
                </Button>
                <Button variant="outline" size="sm" className="text-destructive">
                  Remove
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

