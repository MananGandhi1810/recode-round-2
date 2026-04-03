"use client"

import * as React from "react"

import Link from "next/link"
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

const features = [
  {
    icon: Blocks,
    title: "Brand-first forms",
    description:
      "Ship polished signup, survey, and intake flows without wrestling a builder UI.",
  },
  {
    icon: Users,
    title: "Workspace collaboration",
    description:
      "Bring teams into the same account with role-based access and clean org boundaries.",
  },
  {
    icon: BarChart3,
    title: "Live response insights",
    description:
      "Track submissions, activation, and conversion from one command center.",
  },
  {
    icon: LockKeyhole,
    title: "Secure by default",
    description:
      "Email OTP sign-in, cookie sessions, and an onboarding flow that starts after login.",
  },
]

const stats = [
  { value: "99.9%", label: "session reliability" },
  { value: "2 min", label: "to first workspace" },
  { value: "24/7", label: "team visibility" },
]

export default function Page() {
  const router = useRouter()
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean | null>(null)

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
    <main className="relative min-h-svh overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(14,165,233,0.18),transparent_28%),radial-gradient(circle_at_80%_20%,rgba(59,130,246,0.14),transparent_24%),linear-gradient(to_bottom,rgba(255,255,255,0.02),transparent)] text-foreground">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,transparent_0%,rgba(255,255,255,0.02)_45%,transparent_70%)] opacity-70" />
      <div className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm">
              <Sparkles className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs tracking-[0.32em] text-muted-foreground uppercase">
                FormBar
              </p>
              <p className="text-sm text-muted-foreground">
                A modern SaaS for forms, teams, and growth
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {!isAuthenticated && (
              <Button asChild variant="ghost" className="rounded-2xl">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
            {isAuthenticated && (
              <Button asChild variant="ghost" className="rounded-2xl">
                <Link href="/dashboard">Dashboard</Link>
              </Button>
            )}
            <ThemeToggle />
          </div>
        </header>

        <section className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.1fr_0.9fr] lg:py-16">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur">
              <CheckCircle2 className="size-4 text-primary" />
              Tally-style simplicity, built for real teams
            </div>
            <h1 className="mt-6 text-5xl font-semibold tracking-tight sm:text-6xl">
              Launch beautiful workflows for your product, not a spreadsheet
              disguised as software.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              FormBar combines polished public forms, secure OTP login, and
              organization onboarding into a SaaS experience that feels clear
              from the first click.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              {!isAuthenticated && (
                <Button asChild size="lg" className="rounded-2xl px-6">
                  <Link href="/login">
                    Start free
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              )}
              {isAuthenticated && (
                <Button asChild size="lg" className="rounded-2xl px-6">
                  <Link href="/dashboard">
                    Go to Dashboard
                    <ArrowRight className="ml-2 size-4" />
                  </Link>
                </Button>
              )}
              <Button
                asChild
                variant="outline"
                size="lg"
                className="rounded-2xl px-6"
              >
                <Link href="/dashboard">See onboarding flow</Link>
              </Button>
            </div>

            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-3xl border border-border/70 bg-background/70 p-5 backdrop-blur"
                >
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -inset-6 rounded-[2.5rem] bg-primary/10 blur-3xl" />
            <div className="relative rounded-[2rem] border border-border/70 bg-card/90 p-5 shadow-[0_25px_100px_-35px_rgba(0,0,0,0.45)] backdrop-blur">
              <div className="rounded-[1.5rem] border border-border/60 bg-background/80 p-5">
                <div className="flex items-center justify-between border-b border-border/60 pb-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Workspace preview
                    </p>
                    <p className="mt-1 text-xl font-semibold">Acme Studio</p>
                  </div>
                  <div className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                    Live
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-3xl border border-border/60 p-4">
                    <p className="text-sm font-medium">Public signup form</p>
                    <div className="mt-4 space-y-3">
                      <div className="h-10 rounded-2xl border border-input bg-background/80" />
                      <div className="h-10 rounded-2xl border border-input bg-background/80" />
                      <div className="h-10 rounded-2xl bg-primary/90" />
                    </div>
                  </div>
                  <div className="rounded-3xl border border-border/60 p-4">
                    <p className="text-sm font-medium">Onboarding steps</p>
                    <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                      <div className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3">
                        <span>1. Sign in</span>
                        <CheckCircle2 className="size-4 text-emerald-500" />
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3">
                        <span>2. Create organization</span>
                        <span>Next</span>
                      </div>
                      <div className="flex items-center justify-between rounded-2xl border border-border/60 px-4 py-3">
                        <span>3. Invite team</span>
                        <span>Ready</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5 rounded-3xl border border-dashed border-border/70 bg-muted/30 p-4">
                  <p className="text-sm font-medium">Why it works</p>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    Marketing gets a premium landing page. Auth lives at{" "}
                    <span className="text-foreground">/login</span>.
                    Organization setup happens after sign-in, where it belongs.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="grid gap-4 pb-8 md:grid-cols-2 xl:grid-cols-4">
          {features.map((feature) => {
            const Icon = feature.icon
            return (
              <article
                key={feature.title}
                className="rounded-[1.75rem] border border-border/70 bg-card/80 p-5 backdrop-blur"
              >
                <div className="flex size-11 items-center justify-center rounded-2xl border border-border/70 bg-background/80">
                  <Icon className="size-5 text-primary" />
                </div>
                <h2 className="mt-4 text-lg font-semibold">{feature.title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {feature.description}
                </p>
              </article>
            )
          })}
        </section>
      </div>
    </main>
  )
}
