"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { useRouter } from "next/navigation"

import {
  ArrowRight,
  BarChart3,
  Blocks,
  CheckCircle2,
  LockKeyhole,
  Sparkles,
  Users,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M12 3L10.5 9.5L4 11L10.5 12.5L12 19L13.5 12.5L20 11L13.5 9.5L12 3Z" />
    <path d="M18 4L17 7L14 8L17 9L18 12L19 9L22 8L19 7L18 4Z" />
  </svg>
)

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
)

const BotIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="14" x="3" y="7" rx="2" ry="2" />
    <path d="M12 3v4" />
    <path d="M8 13v.01" />
    <path d="M16 13v.01" />
  </svg>
)

const ZapIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
)

const BranchIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <line x1="6" x2="6" y1="3" y2="15" />
    <circle cx="18" cy="6" r="3" />
    <circle cx="6" cy="18" r="3" />
    <path d="M18 9a9 9 0 0 1-9 9" />
  </svg>
)

const MessageIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z" />
  </svg>
)

const CardIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="14" x="2" y="5" rx="2" />
    <line x1="2" x2="22" y1="10" y2="10" />
  </svg>
)

const ChartIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M3 3v18h18" />
    <rect width="4" height="7" x="7" y="10" rx="1" />
    <rect width="4" height="12" x="15" y="5" rx="1" />
  </svg>
)

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="18" height="18" x="3" y="3" rx="2" />
    <path d="m9 12 2 2 4-4" />
  </svg>
)

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    <path d="M2 12h20" />
  </svg>
)

const features = [
  {
    icon: BotIcon,
    title: "AI-Powered Builder",
    description:
      "Generate complex forms in seconds with intelligent AI prompts. No manual dragging required.",
  },
  {
    icon: ZapIcon,
    title: "Realtime Sync",
    description:
      "Watch responses flow in instantly. Collaborate with your team without refreshing.",
  },
  {
    icon: BranchIcon,
    title: "Conditional Branching",
    description:
      "Build incredibly smart flows that adapt to user answers in real-time.",
  },
  {
    icon: MessageIcon,
    title: "WhatsApp Surveys",
    description:
      "Drop phone numbers and auto-blast survey questions directly to WhatsApp.",
  },
  {
    icon: CardIcon,
    title: "In-Form Payments",
    description:
      "Accept payments seamlessly via integrated gateways without redirecting users.",
  },
  {
    icon: ChartIcon,
    title: "Advanced Analytics",
    description:
      "Dive deep into drop-off rates, conversion metrics, and detailed user insights.",
  },
  {
    icon: CheckIcon,
    title: "Interactive Quizzes",
    description:
      "Engage your audience with scored quizzes, logic jumps, and immediate feedback.",
  },
  {
    icon: GlobeIcon,
    title: "Custom Domains",
    description:
      "Host forms on your own domain to maintain full brand consistency.",
  },
]

// Standalone component for remote cursors to prevent full page re-renders
const RemoteCursors = React.memo(
  ({
    cursors,
  }: {
    cursors: Record<string, { x: number; y: number; color: string }>
  }) => {
    return (
      <>
        {Object.entries(cursors).map(([id, cursor]) => (
          <div
            key={id}
            className="pointer-events-none fixed z-[100] transition-all duration-100 ease-out"
            style={{
              left: cursor.x,
              top: cursor.y,
              color: cursor.color,
            }}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="currentColor"
              stroke="white"
              strokeWidth="1.5"
              className="drop-shadow-sm"
            >
              <path d="M5.653 3.123l13.791 8.924a.5.5 0 0 1-.014.858L5.653 21.877a.5.5 0 0 1-.73-.577l2.218-8.15a.5.5 0 0 0 0-.25l-2.218-8.15a.5.5 0 0 1 .73-.577z" />
            </svg>
          </div>
        ))}
      </>
    )
  }
)

RemoteCursors.displayName = "RemoteCursors"

export default function Page() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(
    null
  )

  // Anonymous multiplayer cursors
  const [remoteCursors, setRemoteCursors] = React.useState<
    Record<string, { x: number; y: number; color: string }>
  >({})
  const [myId] = React.useState(() => Math.random().toString(36).substring(7))
  const wsRef = React.useRef<WebSocket | null>(null)
  const lastSendTime = React.useRef<number>(0)

  React.useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:"
    const host = process.env.NEXT_PUBLIC_API_BASE_URL
      ? process.env.NEXT_PUBLIC_API_BASE_URL.replace(/^https?:\/\//, "")
      : "localhost:8000"

    const ws = new WebSocket(`${protocol}//${host}/homepage/ws`)
    wsRef.current = ws

    ws.onopen = () => {
      // Send initial position
      ws.send(
        JSON.stringify({
          userId: myId,
          x: -100, // Offscreen initially
          y: -100,
          color: `hsl(${parseInt(myId, 36) % 360}, 70%, 60%)`,
        })
      )
    }

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        if (data.userId !== myId) {
          setRemoteCursors((prev) => ({
            ...prev,
            [data.userId]: { x: data.x, y: data.y, color: data.color },
          }))
        }
      } catch (e) {}
    }

    // Cleanup stale cursors every 10 seconds
    const interval = setInterval(() => {
      setRemoteCursors({})
    }, 10000)

    return () => {
      ws.close()
      clearInterval(interval)
    }
  }, [myId])

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      const now = Date.now()
      // Throttle to ~20fps (50ms) to prevent UI lag and network saturation
      if (now - lastSendTime.current < 50) return

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            userId: myId,
            x: e.clientX,
            y: e.clientY,
            color: `hsl(${parseInt(myId, 36) % 360}, 70%, 60%)`,
          })
        )
        lastSendTime.current = now
      }
    },
    [myId]
  )

  React.useEffect(() => {
    apiFetch("/auth/me")
      .then(() => {
        setIsAuthenticated(true)
        router.push("/dashboard")
      })
      .catch(() => {
        setIsAuthenticated(false)
      })
  }, [router])

  return (
    <main
      onMouseMove={handleMouseMove}
      className="relative min-h-svh overflow-hidden bg-gradient-to-br from-primary/15 via-background to-background text-foreground"
    >
      <RemoteCursors cursors={remoteCursors} />

      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="relative z-20 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm">
              <img
                src="/logo.png"
                alt="FormBar Logo"
                className="size-5 text-primary"
              />
            </div>
            <div>
              <p className="text-xs font-semibold tracking-[0.32em] text-foreground uppercase">
                FormBar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button
              asChild
              variant="link"
              className="font-semibold text-muted-foreground hover:text-foreground"
            >
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="h-10 rounded-2xl px-5 shadow-sm">
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </header>

        {/* Mintlify style centered Hero */}
        <section className="relative z-10 flex flex-col items-center justify-center pt-20 pb-12 text-center lg:pt-28">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
            <SparklesIcon className="size-4 text-primary" />
            Introducing Formbar Builder
          </div>

          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Simple enough for anyone to use, powerful enough to run your
            business.
          </h1>

          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground sm:text-xl">
            Build AI-powered forms and accept payments instantly. Formbar is the
            ultimate minimalistic tool for maximum data collection without the
            technical headache.
          </p>

          <div className="mt-10 flex w-full max-w-md flex-col justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="h-12 w-full rounded-2xl bg-primary px-8 text-base text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 sm:w-auto"
            >
              <Link href="/dashboard">
                Start building
                <ArrowRightIcon className="ml-2 size-5" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="h-12 w-full rounded-2xl border-border/70 bg-background/50 px-8 text-base backdrop-blur hover:bg-muted/50 sm:w-auto"
            >
              <Link href="/login">View demo</Link>
            </Button>
          </div>
        </section>

        {/* Hero Visual / Demo Block wide preview */}
        <section className="relative z-10 mx-auto mt-8 mb-24 w-full max-w-5xl">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-b from-primary/30 to-transparent opacity-60 blur-2xl" />
          <div className="relative overflow-hidden rounded-[2rem] border border-border/70 bg-card/90 p-4 shadow-2xl backdrop-blur lg:p-6">
            <div className="rounded-[1.5rem] border border-border/60 bg-background/75 p-6 transition-colors duration-500">
              <div className="mb-6 flex items-center gap-3 border-b border-border/60 pb-5 text-sm font-medium">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-border/80 outline-border"></div>
                  <div className="size-3 rounded-full bg-border/80"></div>
                  <div className="size-3 rounded-full bg-border/80"></div>
                </div>
                <div className="ml-4 flex items-center gap-2">
                  <BotIcon className="size-4 text-primary" />
                  AI Builder Preview
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-3xl border border-border/60 bg-card/50 p-5">
                  <p className="text-sm font-medium">Prompt the AI</p>
                  <div className="mt-4 flex h-[calc(100%-2rem)] flex-col">
                    <div className="flex-1 rounded-2xl border border-input/50 bg-background/50 p-4 text-sm leading-relaxed text-muted-foreground">
                      "Generate a user feedback survey with an NPS rating scale,
                      and add conditional logic asking for improvement areas if
                      their score is below 7..."
                    </div>
                    <div className="mt-4 flex h-11 w-full shrink-0 items-center justify-center rounded-2xl bg-primary font-medium text-primary-foreground shadow-md shadow-primary/20">
                      Generate
                    </div>
                  </div>
                </div>

                {/* PRESERVED ANIMATION BLOCK EXACTLY AS IT WAS */}
                <div className="relative h-[250px] overflow-hidden rounded-3xl border border-border/60 bg-card/50 p-4">
                  <div className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
                  <p className="relative z-20 mb-3 text-sm font-medium">
                    Live Build Output
                  </p>
                  <div className="absolute right-4 left-4 mt-4 animate-[slide-up_5s_ease-in-out_infinite_alternate] space-y-3">
                    <div className="flex h-10 w-full items-center rounded-2xl bg-muted/40 px-4">
                      <div className="h-2 w-2/3 rounded bg-background/50"></div>
                    </div>
                    <div className="flex h-10 w-5/6 items-center rounded-xl bg-muted/40 px-4">
                      <div className="h-2 w-1/3 rounded bg-background/50"></div>
                    </div>
                    <div className="flex h-24 w-full flex-col justify-center gap-2 rounded-xl border border-primary/20 bg-primary/10 px-4">
                      <div className="h-2 w-1/4 rounded bg-primary/40"></div>
                      <div className="h-8 w-full rounded-lg border border-border/40 bg-background/60"></div>
                    </div>
                    <div className="flex h-10 w-4/5 items-center rounded-xl bg-muted/40 px-4">
                      <div className="h-2 w-1/2 rounded bg-background/50"></div>
                    </div>
                    <div className="ml-auto flex h-10 w-1/3 items-center justify-center rounded-2xl bg-primary shadow-lg">
                      <div className="h-2 w-1/2 rounded bg-primary-foreground/50"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Centered Grid */}
        <section className="relative z-10 border-t border-border/40 py-20">
          <div className="mx-auto mb-16 max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Everything you need to collect data
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Minimalistic interface, powerhouse features.
            </p>
          </div>
          <div className="mx-auto mt-12 grid w-full gap-6 text-left sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article
                  key={feature.title}
                  className="group rounded-[1.75rem] border border-border/70 bg-card/80 p-6 backdrop-blur transition-all hover:border-primary/40 hover:shadow-lg"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-background/80 transition-colors group-hover:border-primary/50 group-hover:bg-primary/10">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              )
            })}
          </div>
        </section>

        <footer className="relative z-10 mt-20 mb-8 flex w-full flex-col items-center justify-between gap-4 border-t border-border/40 py-8 text-sm text-muted-foreground sm:flex-row">
          <p>© {new Date().getFullYear()} formbar. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="transition-colors hover:text-foreground">
              Twitter
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              GitHub
            </Link>
            <Link href="#" className="transition-colors hover:text-foreground">
              Terms of Service
            </Link>
          </div>
        </footer>
      </div>
    </main>
  )
}
