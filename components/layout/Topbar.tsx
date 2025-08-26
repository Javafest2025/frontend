"use client"

import { usePathname } from "next/navigation"
import { MessageSquare, Upload, Filter, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { LogoutButton } from "@/components/auth/LogoutButton"
import { getPageTitle } from "@/lib/utils/navigation"

type Props = {
  onChatToggle: () => void
}

export function Topbar({ onChatToggle }: Props) {
  const pathname = usePathname()
  const title = getPageTitle(pathname)

  return (
    <div className="flex h-14 items-center justify-between border-b border-primary/30 px-4 bg-background/80 backdrop-blur-xl"
      style={{
        boxShadow: `
          0 2px 0 0 hsl(var(--primary) / 0.4),
          0 4px 15px hsl(var(--primary) / 0.15),
          0 8px 30px hsl(var(--accent) / 0.08),
          0 0 0 1px hsl(var(--primary) / 0.1)
        `
      }}>
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        {pathname.includes("/interface/library") && (
          <>
            <Button variant="outline" size="sm" className="border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
              style={{
                boxShadow: `
                  0 0 10px hsl(var(--primary) / 0.1),
                  0 2px 8px rgba(0, 0, 0, 0.05),
                  0 0 0 1px hsl(var(--primary) / 0.05)
                `
              }}>
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
            <Button variant="outline" size="sm" className="border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
              style={{
                boxShadow: `
                  0 0 10px hsl(var(--primary) / 0.1),
                  0 2px 8px rgba(0, 0, 0, 0.05),
                  0 0 0 1px hsl(var(--primary) / 0.05)
                `
              }}>
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </>
        )}
        <Button variant="outline" size="icon" onClick={onChatToggle} aria-label="Toggle chat" className="border-2 border-primary/30 hover:border-primary/50 hover:bg-primary/10 transition-all duration-300"
          style={{
            boxShadow: `
              0 0 10px hsl(var(--primary) / 0.1),
              0 2px 8px rgba(0, 0, 0, 0.05),
              0 0 0 1px hsl(var(--primary) / 0.05)
            `
          }}>
          <MessageSquare className="h-5 w-5" />
        </Button>
        <LogoutButton className="px-3 py-2 text-sm border-2 border-primary/30 bg-background/80 hover:bg-primary/10 hover:border-primary/50 rounded-md backdrop-blur-sm transition-all duration-300 shadow-lg shadow-primary/10">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </LogoutButton>
      </div>
    </div>
  )
}
