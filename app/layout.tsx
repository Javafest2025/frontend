import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/lib/context/ThemeContext"
import { LoadingProvider } from "@/contexts/LoadingContext"
import { RouteTransition } from "@/components/ui/RouteTransition"

// Import polyfills for server-side compatibility
import "@/lib/polyfills/promise-withresolvers"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ScholarAI",
  description: "AI-powered document analysis and chat interface",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  readonly children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <LoadingProvider>
            <RouteTransition>
              {children}
            </RouteTransition>
          </LoadingProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
