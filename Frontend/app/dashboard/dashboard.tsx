"use client"

import * as React from "react"
import { Search, Plus, Blocks } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function UserOrganizationsPage() {
  const organizations = [
    { id: "1", name: "Developers Club", plan: "Free Plan" },
    {
      id: "2",
      name: "lodhanaitik07@gmail.com's Org",
      plan: "Free Plan",
      count: "2 projects",
    },
    {
      id: "3",
      name: "MananPyJava's Org",
      plan: "Free Plan",
      count: "16 projects",
    },
    { id: "4", name: "mpstme.tech", plan: "Free Plan", count: "1 project" },
    { id: "5", name: "SRE_XTS", plan: "Free Plan", count: "1 project" },
    { id: "6", name: "supahack-lw15", plan: "Free Plan", count: "2 projects" },
    {
      id: "7",
      name: "Vedant's projects",
      plan: "Free Plan",
      count: "1 project",
      special: true,
    },
  ]

  return (
    <div className="flex min-h-screen w-full flex-col bg-[#111111] font-sans text-zinc-100">
      <main className="mx-auto mt-4 w-full max-w-[1240px] flex-1 p-6 md:p-12">
        <h1 className="mb-12 text-[32px] font-medium tracking-tight">
          Your Organizations
        </h1>

        <div className="mb-8 flex items-center justify-between">
          <div className="relative w-full max-w-[340px]">
            <Search className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-zinc-500" />
            <input
              type="text"
              placeholder="Search for an organization"
              className="w-full rounded-[8px] border border-zinc-800 bg-[#161616] py-2.5 pr-4 pl-10 text-[15px] transition-colors placeholder:text-zinc-600 focus:border-zinc-700 focus:outline-none"
            />
          </div>
          <Button className="h-[36px] rounded-[6px] border-0 bg-[#128a5a] px-4 text-[14px] font-medium text-white shadow-none hover:bg-[#128a5a]/90">
            <Plus className="mr-1.5 h-[18px] w-[18px]" />
            New organization
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {organizations.map((org) => (
            <Link key={org.id} href={`/dashboard/organizations/${org.id}`}>
              <div className="group relative flex cursor-pointer items-center gap-4 overflow-hidden rounded-[10px] border border-zinc-800/80 bg-[#161616] p-[18px] shadow-sm transition-colors hover:bg-[#1f1f1f]">
                <div className="flex h-10 w-10 items-center justify-center rounded-full border border-zinc-800 bg-[#1c1c1c] text-zinc-400 group-hover:text-zinc-300">
                  <Blocks size={20} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h3 className="text-[15px] font-medium text-zinc-200">
                    {org.name}
                  </h3>
                  <p className="text-[13px] text-zinc-500">
                    {org.plan}
                    {org.count ? ` · ${org.count}` : ""}
                  </p>
                </div>
                {org.special && (
                  <div className="absolute right-3.5 bottom-3.5">
                    <div className="flex h-5 w-5 items-center justify-center rounded border border-zinc-700/50 bg-zinc-800 shadow-inner">
                      <div className="h-0 w-0 border-r-[4px] border-b-[6px] border-l-[4px] border-r-transparent border-b-zinc-400 border-l-transparent"></div>
                    </div>
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
