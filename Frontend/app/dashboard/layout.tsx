"use client"

import * as React from "react"
import Link from "next/link"
import { Blocks } from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/theme-toggle"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex h-14 max-w-[1240px] items-center justify-between px-6 md:px-12">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Blocks className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold tracking-tight">FormBar</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                localStorage.removeItem("token")
                router.push("/login")
              }}
            >
              Logout
            </Button>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
