"use client"

import * as React from "react"
import { MoonStar, SunMedium } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  const isDark = mounted && resolvedTheme === "dark"

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className="gap-2 rounded-full"
    >
      {isDark ? (
        <SunMedium className="size-4" />
      ) : (
        <MoonStar className="size-4" />
      )}
      {isDark ? "Light" : "Dark"}
    </Button>
  )
}
