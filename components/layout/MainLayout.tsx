"use client"

import type React from "react"
import { useState } from "react"
import { Sidebar } from "@/components/layout/Sidebar"
import { EditorArea } from "@/components/layout/EditorArea"
import { ChatPanel } from "@/components/layout/ChatPanel"
import { StatusBar } from "@/components/layout/StatusBar"
import { cn } from "@/lib/utils/cn"

type Props = {
  children: React.ReactNode
}

export function MainLayout({ children }: Props) {
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#1e1e1e] text-white">
      {/* Left Sidebar */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Editor Area with Tabs */}
        <EditorArea onChatToggle={() => setIsChatOpen(!isChatOpen)}>
          {children}
        </EditorArea>

        {/* Status Bar */}
        <StatusBar />
      </div>

      {/* Chat Panel */}
      <ChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  )
}
