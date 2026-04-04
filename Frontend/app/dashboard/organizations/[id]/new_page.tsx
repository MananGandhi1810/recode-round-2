"use client"

import * as React from "react"
import {
  Search,
  Plus,
  ListFilter,
  LayoutGrid,
  List,
  Pause,
  Play,
  ChevronDown,
  MoreVertical,
} from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OrganizationFormsPage() {
  const forms = [
    {
      id: "1",
      name: "evbase",
      provider: "AWS",
      region: "us-east-1",
      status: "paused",
    },
    {
      id: "2",
      name: "RailwayConcession",
      provider: "AWS",
      region: "ap-south-1",
      status: "active",
      plan: "NANO",
    },
  ]

  return (
    <div className="flex min-h-screen w-full flex-col bg-background font-sans text-foreground">
      <main className="mx-auto mt-4 flex w-full max-w-[1240px] flex-1 flex-col gap-6 p-6 md:p-12">
        <h1 className="text-[28px] font-medium tracking-tight">Forms</h1>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative w-full sm:max-w-[340px]">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for a form"
                className="w-full rounded-[6px] border border-border bg-transparent py-[9px] pr-4 pl-10 text-[14px] transition-colors placeholder:text-muted-foreground focus:border-border focus:outline-none"
              />
            </div>

            <Button
              variant="outline"
              className="h-[38px] gap-2 rounded-[6px] border border-border bg-transparent px-3 text-[14px] font-normal text-muted-foreground shadow-none hover:bg-accent hover:text-accent-foreground"
            >
              Status <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>

            <Button
              variant="outline"
              className="h-[38px] gap-2 rounded-[6px] border border-border bg-transparent px-3 text-[14px] font-normal text-muted-foreground shadow-none hover:bg-accent hover:text-accent-foreground"
            >
              <ListFilter className="h-[18px] w-[18px] text-muted-foreground" />{" "}
              Sorted by name
            </Button>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex h-[38px] items-center gap-1 rounded-[6px] border border-border p-0.5">
              <button className="rounded bg-accent px-2.5 py-[7px] text-accent-foreground">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button className="rounded px-2.5 py-[7px] text-muted-foreground transition-colors hover:text-foreground">
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button className="h-[38px] rounded-[6px] bg-primary px-3.5 text-[14px] font-medium text-primary-foreground shadow-none hover:bg-primary/90">
              <Plus className="mr-1.5 h-[18px] w-[18px]" />
              New form
            </Button>
          </div>
        </div>

        <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <div
              key={form.id}
              className="relative flex h-[200px] flex-col rounded-[12px] border border-border/80 bg-card p-5 transition-colors hover:bg-accent"
            >
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between">
                  <h3 className="text-[15px] font-semibold text-card-foreground">
                    {form.name}
                  </h3>
                  <button className="-mr-2 text-muted-foreground hover:text-foreground">
                    <MoreVertical className="h-[18px] w-[18px]" />
                  </button>
                </div>
                <p className="mt-1.5 text-[13px] text-muted-foreground">
                  {form.provider} | {form.region}
                </p>

                {form.plan && (
                  <div className="mt-3">
                    <span className="rounded-[4px] border border-border/60 bg-muted/60 px-2 py-[2px] font-mono text-[11px] tracking-wide text-muted-foreground">
                      {form.plan}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-auto flex w-max items-center gap-2.5 rounded-full border border-border/50 bg-background/50 px-2.5 py-1.5">
                {form.status === "paused" ? (
                  <>
                    <div className="flex items-center justify-center text-zinc-400">
                      <Pause
                        className="h-[10px] w-[10px]"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    </div>
                    <span className="flex items-center gap-1.5 text-[12px] text-zinc-400">
                      Form is paused{" "}
                      <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full border border-zinc-600 text-[9px] text-zinc-600">
                        i
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center text-emerald-500">
                      <Play
                        className="h-[10px] w-[10px]"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    </div>
                    <span className="text-[12px] text-emerald-500">Active</span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
