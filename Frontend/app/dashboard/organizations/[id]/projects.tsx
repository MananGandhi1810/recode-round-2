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
    <div className="flex min-h-screen w-full flex-col bg-[#111111] font-sans text-zinc-100">
      <main className="mx-auto mt-4 w-full max-w-[1280px] flex-1 p-6 md:p-12">
        <h1 className="mb-12 text-[32px] font-medium tracking-tight">
          Projects
        </h1>

        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-[340px]">
              <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Search for a project"
                className="w-[280px] rounded-[8px] border border-zinc-800 bg-[#161616] py-2.5 pr-4 pl-10 text-[15px] transition-colors placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none"
              />
            </div>

            <Button
              variant="outline"
              className="h-[40px] gap-2 rounded-[8px] border-zinc-800 bg-transparent px-4 text-[14px] font-normal text-zinc-300 shadow-sm hover:bg-zinc-800/50 hover:text-zinc-100"
            >
              Status <ChevronDown className="h-4 w-4 text-zinc-500" />
            </Button>

            <Button
              variant="outline"
              className="h-[40px] gap-2 rounded-[8px] border-zinc-800 bg-transparent px-4 text-[14px] font-normal text-zinc-300 shadow-sm hover:bg-zinc-800/50 hover:text-zinc-100"
            >
              <ListFilter className="h-[18px] w-[18px] text-zinc-500" /> Sorted
              by name
            </Button>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex h-[40px] items-center gap-1 rounded-[8px] border border-zinc-800 bg-[#161616] p-1">
              <button className="rounded bg-zinc-800 p-1 px-2 text-zinc-200">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button className="rounded p-1 px-2 text-zinc-500 transition-colors hover:text-zinc-300">
                <List className="h-4 w-4" />
              </button>
            </div>

            <Button className="h-[36px] rounded-[6px] border-0 bg-[#128a5a] px-4 text-[14px] font-medium text-white shadow-none hover:bg-[#128a5a]/90">
              <Plus className="mr-1.5 h-[18px] w-[18px]" />
              New project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <div
              key={form.id}
              className="relative flex h-[220px] flex-col rounded-[12px] border border-zinc-800/80 bg-[#161616] p-6 shadow-sm transition-all hover:bg-[#1c1c1c]"
            >
              <div className="flex flex-1 flex-col">
                <div className="flex items-start justify-between">
                  <h3 className="text-[17px] font-medium text-zinc-100">
                    {form.name}
                  </h3>
                  <button className="-mr-2 p-1 text-zinc-600 hover:text-zinc-400">
                    <MoreVertical className="h-[18px] w-[18px]" />
                  </button>
                </div>
                <p className="mt-1 text-[14px] text-zinc-500">
                  {form.provider} | {form.region}
                </p>

                {form.plan && (
                  <div className="mt-4">
                    <span className="rounded-[4px] border border-zinc-700/40 bg-zinc-800/60 px-2 py-0.5 font-mono text-[11px] tracking-wider text-zinc-400">
                      {form.plan}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-auto flex items-center gap-2.5">
                {form.status === "paused" ? (
                  <div className="flex w-fit items-center gap-2 rounded-md border border-zinc-800 bg-[#0f0f0f] px-2 py-1.5">
                    <div className="flex items-center justify-center rounded-sm border border-zinc-700 p-1 text-zinc-500">
                      <Pause
                        className="h-2.5 w-2.5"
                        fill="currentColor"
                        strokeWidth={0}
                      />
                    </div>
                    <span className="flex items-center gap-1.5 text-[13px] font-normal text-zinc-400">
                      Project is paused{" "}
                      <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full border border-zinc-700 text-[9px] text-zinc-600">
                        i
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="flex h-8 items-center"></div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
