"use client"

import * as React from "react"
import Link from "next/link"
import {
  Search,
  Plus,
  Blocks,
  Loader2,
  ListFilter,
  ArrowDownWideNarrow,
  Grid3X3,
  List,
  FileText,
  UserPlus,
} from "lucide-react"
import { useRouter } from "next/navigation"

import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"
import { type FormRecord } from "@/lib/forms"

type Organization = {
  id: string
  name: string
  slug: string
  created_by_id: string
}

type FormStatusFilter = "all" | "draft" | "published"

export default function UserOrganizationsPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = React.useState<Organization[]>([])
  const [selectedOrganizationId, setSelectedOrganizationId] = React.useState("")
  const [organizationQuery, setOrganizationQuery] = React.useState("")
  const [formQuery, setFormQuery] = React.useState("")
  const [formStatusFilter, setFormStatusFilter] =
    React.useState<FormStatusFilter>("all")
  const [formsView, setFormsView] = React.useState<"grid" | "list">("grid")
  const [showNewOrganization, setShowNewOrganization] = React.useState(false)
  const [newOrganizationName, setNewOrganizationName] = React.useState("")
  const [showNewForm, setShowNewForm] = React.useState(false)
  const [newFormName, setNewFormName] = React.useState("")
  const [newFormDescription, setNewFormDescription] = React.useState("")
  
  // Invitation State
  const [showInviteMember, setShowInviteMember] = React.useState(false)
  const [inviteEmail, setInviteEmail] = React.useState("")
  const [inviteRole, setInviteRole] = React.useState("member")
  const [inviting, setInviting] = React.useState(false)
  const [inviteMessage, setInviteMessage] = React.useState<{type: 'success' | 'error', text: string} | null>(null)

  const [formsByOrganization, setFormsByOrganization] = React.useState<
    Record<string, FormRecord[]>
  >({})
  const [formsLoading, setFormsLoading] = React.useState(false)
  const [formsError, setFormsError] = React.useState<string | null>(null)
  const [saving, setSaving] = React.useState(false)
  const [savingForm, setSavingForm] = React.useState(false)
  const [loading, setLoading] = React.useState(true)

  const loadOrganizations = React.useCallback(async () => {
    try {
      const data = await apiFetch<Organization[]>("/organizations")
      setOrganizations(data)
      if (data.length > 0) {
        setSelectedOrganizationId((current) => current || data[0].id)
      }
    } catch {
      router.replace("/login")
    } finally {
      setLoading(false)
    }
  }, [router])

  React.useEffect(() => {
    void loadOrganizations()
  }, [loadOrganizations])

  const filteredOrganizations = React.useMemo(() => {
    const q = organizationQuery.trim().toLowerCase()
    if (!q) {
      return organizations
    }
    return organizations.filter(
      (org) =>
        org.name.toLowerCase().includes(q) || org.slug.toLowerCase().includes(q)
    )
  }, [organizations, organizationQuery])

  React.useEffect(() => {
    if (!selectedOrganizationId) {
      return
    }

    if (formsByOrganization[selectedOrganizationId]) {
      return
    }

    setFormsLoading(true)
    setFormsError(null)

    void apiFetch<FormRecord[]>(`/forms/organization/${selectedOrganizationId}`)
      .then((forms) => {
        setFormsByOrganization((current) => ({
          ...current,
          [selectedOrganizationId]: forms,
        }))
      })
      .catch((error) => {
        setFormsError(
          error instanceof Error ? error.message : "Could not load forms"
        )
      })
      .finally(() => {
        setFormsLoading(false)
      })
  }, [formsByOrganization, selectedOrganizationId])

  const selectedOrganization = React.useMemo(
    () =>
      organizations.find((org) => org.id === selectedOrganizationId) ?? null,
    [organizations, selectedOrganizationId]
  )

  const filteredForms = React.useMemo(() => {
    const list = formsByOrganization[selectedOrganizationId] ?? []
    const q = formQuery.trim().toLowerCase()

    return list.filter((form) => {
      const queryOk = !q || form.name.toLowerCase().includes(q)
      const formStatus = form.is_published ? "published" : "draft"
      const statusOk =
        formStatusFilter === "all" || formStatus === formStatusFilter
      return queryOk && statusOk
    })
  }, [formsByOrganization, selectedOrganizationId, formQuery, formStatusFilter])

  async function createOrganization(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)

    try {
      const organization = await apiFetch<Organization>("/organizations", {
        method: "POST",
        body: JSON.stringify({ name: newOrganizationName }),
      })
      setOrganizations((current) => [organization, ...current])
      setSelectedOrganizationId(organization.id)
      setNewOrganizationName("")
      setShowNewOrganization(false)
    } finally {
      setSaving(false)
    }
  }

  async function inviteMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrganizationId || !inviteEmail.trim()) return

    setInviting(true)
    setInviteMessage(null)

    try {
      await apiFetch(`/organizations/${selectedOrganizationId}/members`, {
        method: "POST",
        body: JSON.stringify({
          email: inviteEmail.trim(),
          role: inviteRole,
        }),
      })
      setInviteMessage({ type: 'success', text: 'Member invited successfully.' })
      setInviteEmail("")
      setShowInviteMember(false)
    } catch (error) {
      setInviteMessage({ type: 'error', text: error instanceof Error ? error.message : 'Failed to invite member.' })
    } finally {
      setInviting(false)
    }
  }

  async function createForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!selectedOrganizationId || !newFormName.trim()) {
      return
    }

    setSavingForm(true)

    try {
      const form = await apiFetch<FormRecord>(
        `/forms/organization/${selectedOrganizationId}`,
        {
          method: "POST",
          body: JSON.stringify({
            name: newFormName.trim(),
            description: newFormDescription.trim() || null,
          }),
        }
      )

      setFormsByOrganization((current) => ({
        ...current,
        [selectedOrganizationId]: [
          form,
          ...(current[selectedOrganizationId] ?? []),
        ],
      }))
      setNewFormName("")
      setNewFormDescription("")
      setShowNewForm(false)
    } catch (error) {
      setFormsError(
        error instanceof Error ? error.message : "Could not create form"
      )
    } finally {
      setSavingForm(false)
    }
  }

  function formatUpdatedLabel(value: string) {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) {
      return "Updated recently"
    }
    return `Updated ${date.toLocaleDateString()}`
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground">
      <main className="mx-auto mt-4 w-full max-w-[1240px] flex-1 p-6 md:p-12">
        <section>
          <h1 className="mb-8 text-[32px] font-medium tracking-tight">
            Your Organizations
          </h1>
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <div className="relative w-full max-w-[340px]">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={organizationQuery}
                onChange={(event) => setOrganizationQuery(event.target.value)}
                type="text"
                placeholder="Search for an organization"
                className="w-full rounded-[8px] border border-border bg-card py-2.5 pr-4 pl-10 text-[15px] transition-colors placeholder:text-muted-foreground focus:border-border focus:outline-none"
              />
            </div>
            <Button
              onClick={() => setShowNewOrganization((current) => !current)}
              className="h-9.5 rounded-[8px] border-0 bg-primary px-4 text-[14px] font-medium text-primary-foreground shadow-none hover:bg-primary/90"
            >
              <Plus className="mr-1.5 h-4.5 w-4.5" />
              New organization
            </Button>
          </div>

          {showNewOrganization && (
            <form
              onSubmit={createOrganization}
              className="mb-6 flex flex-col gap-3 rounded-[10px] border border-border bg-card p-4 md:flex-row"
            >
              <input
                value={newOrganizationName}
                onChange={(event) => setNewOrganizationName(event.target.value)}
                placeholder="Organization name"
                className="h-10 flex-1 rounded-[8px] border border-input bg-background px-3 text-sm transition outline-none focus:border-ring"
                required
              />
              <Button
                type="submit"
                disabled={saving}
                className="h-10 rounded-[8px] px-4"
              >
                {saving ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create
              </Button>
            </form>
          )}

          {loading ? (
            <div className="flex items-center justify-center rounded-[10px] border border-border bg-card p-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredOrganizations.length === 0 ? (
                <div className="col-span-full rounded-[10px] border border-border bg-card py-12 text-center">
                  <p className="text-muted-foreground">
                    No organizations found.
                  </p>
                </div>
              ) : (
                filteredOrganizations.map((org) => {
                  const active = selectedOrganizationId === org.id
                  return (
                    <button
                      key={org.id}
                      type="button"
                      onClick={() => setSelectedOrganizationId(org.id)}
                      className={`group relative flex items-center gap-4 overflow-hidden rounded-[10px] border p-4.5 text-left shadow-sm transition-colors ${
                        active
                          ? "border-primary/50 bg-accent"
                          : "border-border/80 bg-card hover:bg-accent"
                      }`}
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground group-hover:text-foreground">
                        <Blocks size={20} strokeWidth={1.5} />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <h3 className="text-[15px] font-medium text-card-foreground">
                          {org.name}
                        </h3>
                        <p className="text-[13px] text-muted-foreground">
                          Free Plan · /{org.slug}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          )}
        </section>

        <section className="mt-14">
          <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[32px] font-medium tracking-tight">Workspace</h2>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowInviteMember((current) => !current)}
                disabled={!selectedOrganizationId}
                variant="outline"
                className="h-9.5 rounded-[8px] px-4 text-[14px] font-medium shadow-none"
              >
                <UserPlus className="mr-1.5 h-4.5 w-4.5" />
                Invite member
              </Button>
              <Button
                onClick={() => setShowNewForm((current) => !current)}
                disabled={!selectedOrganizationId}
                className="h-9.5 rounded-[8px] border-0 bg-primary px-4 text-[14px] font-medium text-primary-foreground shadow-none hover:bg-primary/90"
              >
                <Plus className="mr-1.5 h-4.5 w-4.5" />
                New form
              </Button>
            </div>
          </div>

          {!selectedOrganization ? (
            <div className="rounded-[10px] border border-border bg-card py-12 text-center text-muted-foreground">
              Select an organization to manage your workspace.
            </div>
          ) : (
            <>
              <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-sm text-muted-foreground">
                <div>
                  Managing workspace for{" "}
                  <span className="font-medium text-foreground">
                    {selectedOrganization.name}
                  </span>
                </div>
              </div>
              
              {inviteMessage && (
                <div className={`mb-6 rounded-[10px] border px-4 py-3 text-sm ${inviteMessage.type === 'error' ? 'border-destructive/50 bg-destructive/10 text-destructive' : 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600'}`}>
                  {inviteMessage.text}
                </div>
              )}

              {showInviteMember && (
                <form
                  onSubmit={inviteMember}
                  className="mb-8 flex flex-col gap-3 rounded-[10px] border border-border bg-card p-4 md:flex-row"
                >
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="Member email address"
                    className="h-10 flex-1 rounded-[8px] border border-input bg-background px-3 text-sm transition outline-none focus:border-ring"
                    required
                  />
                  <select
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value)}
                    className="h-10 rounded-[8px] border border-input bg-background px-3 text-sm transition outline-none focus:border-ring"
                  >
                    <option value="member">Member</option>
                    <option value="owner">Owner</option>
                  </select>
                  <Button
                    type="submit"
                    disabled={inviting}
                    className="h-10 rounded-[8px] px-4"
                  >
                    {inviting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Invite
                  </Button>
                </form>
              )}

              <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="relative w-full max-w-[340px] min-w-[280px]">
                    <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={formQuery}
                      onChange={(event) => setFormQuery(event.target.value)}
                      type="text"
                      placeholder="Search for a form"
                      className="w-full rounded-[8px] border border-border bg-card py-2.5 pr-4 pl-10 text-[15px] transition-colors placeholder:text-muted-foreground focus:border-border focus:outline-none"
                    />
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-[8px] border border-dashed border-border bg-card px-3 py-2 text-sm text-foreground">
                    <ListFilter className="h-4 w-4 text-muted-foreground" />
                    <select
                      value={formStatusFilter}
                      onChange={(event) =>
                        setFormStatusFilter(
                          event.target.value as "all" | "draft" | "published"
                        )
                      }
                      className="bg-transparent text-sm outline-none"
                    >
                      <option value="all">All status</option>
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </div>

                  <div className="inline-flex items-center gap-2 rounded-[8px] border border-border bg-card px-3 py-2 text-sm text-foreground hidden sm:flex">
                    <ArrowDownWideNarrow className="h-4 w-4 text-muted-foreground" />
                    Sorted by name
                  </div>
                </div>

                <div className="inline-flex items-center gap-1 rounded-[8px] border border-border bg-card p-1">
                  <button
                    type="button"
                    onClick={() => setFormsView("grid")}
                    className={`rounded-[6px] p-2 transition ${formsView === "grid" ? "bg-accent" : "hover:bg-accent"}`}
                    aria-label="Grid view"
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormsView("list")}
                    className={`rounded-[6px] p-2 transition ${formsView === "list" ? "bg-accent" : "hover:bg-accent"}`}
                    aria-label="List view"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {showNewForm && (
                <form
                  onSubmit={createForm}
                  className="mb-6 flex flex-col gap-3 rounded-[10px] border border-border bg-card p-4 md:flex-row"
                >
                  <div className="flex flex-1 flex-col gap-3">
                    <input
                      value={newFormName}
                      onChange={(event) => setNewFormName(event.target.value)}
                      placeholder="Form name"
                      className="h-10 w-full rounded-[8px] border border-input bg-background px-3 text-sm transition outline-none focus:border-ring"
                      required
                    />
                    <input
                      value={newFormDescription}
                      onChange={(event) =>
                        setNewFormDescription(event.target.value)
                      }
                      placeholder="Short description (optional)"
                      className="h-10 w-full rounded-[8px] border border-input bg-background px-3 text-sm transition outline-none focus:border-ring"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={savingForm}
                    className="h-10 rounded-[8px] px-4"
                  >
                    {savingForm ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Create form
                  </Button>
                </form>
              )}

              {formsError ? (
                <div className="mb-6 rounded-[10px] border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {formsError}
                </div>
              ) : null}

              {formsLoading ? (
                <div className="flex items-center justify-center rounded-[10px] border border-border bg-card py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredForms.length === 0 ? (
                <div className="rounded-[10px] border border-border bg-card py-12 text-center text-muted-foreground">
                  No forms found for this organization.
                </div>
              ) : formsView === "grid" ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredForms.map((form) => (
                    <Link key={form.id} href={`/dashboard/forms/${form.id}`}>
                      <article className="rounded-[10px] border border-border/80 bg-card p-6 shadow-sm transition hover:bg-accent/60">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <h3 className="text-[28px] font-semibold leading-none">
                              {form.name.slice(0, 1).toUpperCase()}
                            </h3>
                            <p className="mt-4 text-[20px] leading-tight font-medium tracking-tight">
                              {form.name}
                            </p>
                            {form.description ? (
                              <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                                {form.description}
                              </p>
                            ) : null}
                          </div>
                        </div>
                        <div className="mt-6 flex items-center gap-3 text-[13px] text-muted-foreground">
                          <span>Free</span>
                          <span>•</span>
                          <span>
                            {form.is_published ? "published" : "draft"}
                          </span>
                          <span>•</span>
                          <span>{formatUpdatedLabel(form.updated_at)}</span>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredForms.map((form) => (
                    <Link key={form.id} href={`/dashboard/forms/${form.id}`}>
                      <article className="flex items-center justify-between rounded-[10px] border border-border/80 bg-card p-4 shadow-sm transition hover:bg-accent/60">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
                            <FileText className="h-4 w-4" />
                          </div>
                          <div>
                            <p className="font-medium">{form.name}</p>
                            {form.description ? (
                              <p className="text-sm text-muted-foreground">
                                {form.description}
                              </p>
                            ) : null}
                            <p className="text-sm text-muted-foreground">
                              Free · {form.is_published ? "published" : "draft"}{" "}
                              · {formatUpdatedLabel(form.updated_at)}
                            </p>
                          </div>
                        </div>
                      </article>
                    </Link>
                  ))}
                </div>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  )
}
