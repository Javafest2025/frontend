"use client"

import type React from "react"
import { useState } from "react"
import { usePathname } from "next/navigation"
import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { EditorArea } from "@/components/layout/EditorArea"
import { ChatPanel } from "@/components/layout/ChatPanel"
import { TooltipProvider } from "@/components/ui/enhanced-tooltip"
import { Toaster as AppToaster } from "@/components/ui/toaster"
import { Toaster as SonnerToaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils/cn"
import { useIsMobile, useIsTablet } from "@/hooks/use-mobile"

type Props = {
  children: React.ReactNode
}

export function MainLayout({ children }: Props) {
  const pathname = usePathname()
  const isProjectRoute = pathname.includes('/projects/')

  const [isChatOpen, setIsChatOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const isMobile = useIsMobile()
  const isTablet = useIsTablet()

  // Auto-collapse sidebar on mobile/tablet
  const shouldCollapseSidebar = isMobile || isTablet

  return (
    <TooltipProvider delayDuration={500} skipDelayDuration={300}>
      <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
        {/* Left Sidebar - Hidden on mobile, collapsible on tablet, and hidden for project routes */}
        {!isMobile && !isProjectRoute && (
          <Sidebar
            collapsed={shouldCollapseSidebar ? true : sidebarCollapsed}
            onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
            className={cn(
              "transition-all duration-300",
              shouldCollapseSidebar && "w-16",
              !shouldCollapseSidebar && sidebarCollapsed && "w-16",
              !shouldCollapseSidebar && !sidebarCollapsed && "w-64"
            )}
          />
        )}

        {/* Mobile Sidebar Overlay - Only for non-project routes */}
        {isMobile && !isProjectRoute && sidebarOpen && (
          <div
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Mobile Sidebar - Only for non-project routes */}
        {isMobile && !isProjectRoute && (
          <div className={cn(
            "fixed left-0 top-0 h-full z-50 transition-transform duration-300 lg:hidden",
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          )}>
            <Sidebar
              collapsed={false}
              onToggle={() => setSidebarOpen(false)}
              className="w-64"
            />
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col min-w-0">
          {/* Global Header - For project routes, this will be positioned after the project sidebar */}
          {!isProjectRoute && <Header />}

          {/* Editor Area with Tabs - Simplified for project routes */}
          <div className="flex-1 overflow-hidden">
            {isProjectRoute ? (
              children
            ) : (
              <EditorArea
                onChatToggle={() => setIsChatOpen(!isChatOpen)}
                onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                showMobileMenu={isMobile}
              >
                {children}
              </EditorArea>
            )}
          </div>
        </div>

        {/* Chat Panel - Full screen on mobile, side panel on larger screens */}
        <ChatPanel
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          isMobile={isMobile}
        />
      </div>
      {/* Mount both app toaster (Radix) and Sonner toaster to support both APIs */}
      <AppToaster />
      <SonnerToaster richColors position="bottom-right" />
    </TooltipProvider>
  )
}
