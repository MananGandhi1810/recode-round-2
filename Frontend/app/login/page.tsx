"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  Mail,
  ShieldCheck,
} from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"

type AuthUser = {
  id: string
  email: string
  full_name: string | null
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = React.useState("")
  const [fullName, setFullName] = React.useState("")
  const [otp, setOtp] = React.useState("")
  const [step, setStep] = React.useState<"request" | "verify">("request")
  const [message, setMessage] = React.useState("Request an OTP to continue.")
  const [loading, setLoading] = React.useState(false)

  async function requestOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage("Sending OTP...")

    try {
      await apiFetch<{ message: string }>("/auth/request-otp", {
        method: "POST",
        body: JSON.stringify({ email, full_name: fullName || null }),
      })
      setMessage("OTP sent. Check your inbox.")
      setStep("verify")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to send OTP")
    } finally {
      setLoading(false)
    }
  }

  async function verifyOtp(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setMessage("Verifying OTP...")

    try {
      await apiFetch<{ access_token: string; user: AuthUser }>(
        "/auth/verify-otp",
        {
          method: "POST",
          body: JSON.stringify({ email, otp, full_name: fullName || null }),
        }
      )
      setMessage("Signed in securely.")
      router.push("/dashboard")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Verification failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-svh overflow-hidden bg-gradient-to-br from-primary/10 via-background to-background">
      <div className="relative mx-auto flex min-h-svh w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs tracking-[0.32em] text-muted-foreground uppercase">
              FormBar
            </p>
            <p className="mt-2 text-lg font-medium">Sign in to continue</p>
          </div>
          <ThemeToggle />
        </header>

        <section className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.95fr_1.05fr] lg:py-16">
          <div className="max-w-xl">
            <p className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-4 py-2 text-sm text-muted-foreground shadow-sm">
              <ShieldCheck className="size-4 text-primary" />
              OTP auth, then workspace onboarding
            </p>
            <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
              Get into the product, then create your organization.
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">
              The login flow is intentionally short. Once you are in, you land
              on the organization setup screen where the SaaS onboarding begins.
            </p>
            <div className="mt-8 rounded-[1.75rem] border border-border/70 bg-card/80 p-5 backdrop-blur">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="size-5 text-emerald-500" />
                <p className="font-medium">Session-based access</p>
              </div>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">
                Email OTP is verified before you see any workspace setup. That
                keeps the public site clean and the product flow predictable.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-border/70 bg-card/90 p-6 shadow-[0_25px_100px_-40px_rgba(0,0,0,0.45)] backdrop-blur">
            {step === "request" ? (
              <form
                onSubmit={requestOtp}
                className="rounded-3xl border border-border/60 bg-background/75 p-5 transition-colors duration-500"
              >
                <div className="flex items-center gap-3 text-sm font-medium">
                  <Mail className="size-4 text-primary" />
                  Step 1 of 2 · Request OTP
                </div>
                <div className="mt-4 grid gap-3">
                  <input
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="Full name"
                    className="h-11 rounded-2xl border border-input/50 bg-background/50 px-4 text-sm transition outline-none focus:border-primary"
                    required
                  />
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    type="email"
                    placeholder="Email address"
                    className="h-11 rounded-2xl border border-input/50 bg-background/50 px-4 text-sm transition outline-none focus:border-primary"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                  >
                    {loading ? (
                      <Loader2 className="mr-2 size-4 animate-spin" />
                    ) : (
                      <ArrowRight className="mr-2 size-4" />
                    )}
                    Send OTP
                  </Button>
                </div>
              </form>
            ) : (
              <form
                onSubmit={verifyOtp}
                className="rounded-3xl border border-border/60 bg-background/75 p-5 transition-colors duration-500"
              >
                <div className="flex items-center gap-3 text-sm font-medium">
                  <ShieldCheck className="size-4 text-primary" />
                  Step 2 of 2 · Verify OTP
                </div>
                <p className="mt-2 text-sm opacity-80">
                  We sent a code to {email}. Enter it below to continue.
                </p>
                <div className="mt-4 grid gap-3">
                  <input
                    value={otp}
                    onChange={(event) => setOtp(event.target.value)}
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    className="h-11 rounded-2xl border border-input/50 bg-background/50 px-4 text-sm transition outline-none focus:border-primary"
                    required
                  />
                  <Button
                    type="submit"
                    disabled={loading}
                    className="h-11 rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20 hover:bg-primary/90"
                  >
                    <CheckCircle2 className="mr-2 size-4" />
                    Verify and continue
                  </Button>
                </div>
              </form>
            )}

            <div className="mt-5 rounded-3xl border border-border/60 bg-background/75 p-5">
              <p className="text-sm font-medium text-muted-foreground">
                Status
              </p>
              <p className="mt-2 text-base font-medium">{message}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
