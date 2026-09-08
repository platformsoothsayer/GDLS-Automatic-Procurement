import type { Metadata, Viewport } from "next"
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google"
import "./globals.css"
import { AppShell } from "@/components/AppShell"

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-sans",
  display: "swap",
})

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Industrial Data Fabric Preview",
  description:
    "Pre-sales preview of an industrial data fabric. Illustrative data only, not connected to any production system.",
}

export const viewport: Viewport = {
  width: 1440,
  initialScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${plexSans.variable} ${plexMono.variable}`}>
      <body className="min-w-[1280px]">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  )
}
