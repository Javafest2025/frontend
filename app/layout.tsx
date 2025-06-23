import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/lib/context/ThemeContext"
import { GoogleOAuthProvider } from '@react-oauth/google'
import { LoadingProvider } from "@/contexts/LoadingContext"
import { RouteTransition } from "@/components/ui/RouteTransition"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "ScholarAI",
  description: "AI-powered document analysis and chat interface",
  generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const googleClientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID

  if (!googleClientId && process.env.NODE_ENV === 'development') {
    console.warn(
      "NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set in .env.local. Google Login will not work."
    )
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <GoogleOAuthProvider clientId={googleClientId || "YOUR_FALLBACK_CLIENT_ID_IF_ANY"}>
          <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
            <LoadingProvider>
              <RouteTransition>
                {children}
              </RouteTransition>
            </LoadingProvider>
          </ThemeProvider>
        </GoogleOAuthProvider>
      </body>
    </html>
  )
}
