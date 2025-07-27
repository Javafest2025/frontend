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
    <div className="flex h-14 items-center justify-between border-b border-primary/15 px-4 bg-background/80 backdrop-blur-xl">
      <h1 className="text-xl font-semibold">{title}</h1>
      <div className="flex items-center gap-2">
        {pathname.includes("/interface/library") && (
          <>
            <Button variant="outline" size="sm" className="border-primary/20 hover:border-primary/40 hover:bg-primary/5">
              <Upload className="mr-2 h-4 w-4" />
              Upload
            </Button>
            <Button variant="outline" size="sm" className="border-primary/20 hover:border-primary/40 hover:bg-primary/5">
              <Filter className="mr-2 h-4 w-4" />
              Filter
            </Button>
          </>
        )}
        <Button variant="outline" size="icon" onClick={onChatToggle} aria-label="Toggle chat" className="border-primary/20 hover:border-primary/40 hover:bg-primary/5">
          <MessageSquare className="h-5 w-5" />
        </Button>
        <LogoutButton className="px-3 py-2 text-sm border border-primary/20 bg-background/80 hover:bg-primary/5 hover:border-primary/40 rounded-md backdrop-blur-sm">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </LogoutButton>
      </div>
    </div>
  )
}
