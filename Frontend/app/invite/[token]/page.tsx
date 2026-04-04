"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { Button } from "@/components/ui/button"
import { Loader2, CheckCircle2, UserPlus } from "lucide-react"

export default function InvitePage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const [info, setInfo] = React.useState<{
    org_name: string
    email: string
  } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [accepting, setAccepting] = React.useState(false)

  React.useEffect(() => {
    // Check if user is logged in
    apiFetch("/auth/me")
      .then(() => {
        apiFetch<{ org_name: string; email: string }>(
          `/organizations/invites/${params.token}`
        )
          .then(setInfo)
          .catch((err) =>
            setError(
              err instanceof Error ? err.message : "Invalid or expired invite"
            )
          )
          .finally(() => setLoading(false))
      })
      .catch(() => {
        // User must log in first to accept invite
        router.push(`/login?next=/invite/${params.token}`)
      })
  }, [params.token, router])

  const acceptInvite = async () => {
    setAccepting(true)
    try {
      await apiFetch(`/organizations/invites/${params.token}/accept`, {
        method: "POST",
      })
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invite")
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/20">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
            <span className="text-xl">❌</span>
          </div>
          <h1 className="mb-2 text-xl font-bold text-destructive">
            Invite Error
          </h1>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={() => router.push("/dashboard")} className="mt-6">
            Go to Dashboard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/20 p-4">
      <div className="w-full max-w-md animate-in rounded-[20px] border bg-card p-8 text-center shadow-lg zoom-in-95 fade-in">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary">
          <UserPlus className="h-8 w-8" />
        </div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight">
          You have been invited!
        </h1>
        <p className="mb-8 text-muted-foreground">
          You've been invited to join{" "}
          <span className="font-semibold text-foreground">
            {info?.org_name}
          </span>
          .
        </p>
        <Button
          onClick={acceptInvite}
          disabled={accepting}
          className="w-full rounded-xl py-6 text-lg"
        >
          {accepting ? (
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
          ) : (
            <CheckCircle2 className="mr-2 h-5 w-5" />
          )}
          Accept Invitation
        </Button>
      </div>
    </div>
  )
}
