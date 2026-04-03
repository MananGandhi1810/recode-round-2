"use client"

import * as React from "react"
import { Search, Plus, Blocks } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function UserOrganizationsPage() {
  const organizations = [
    { id: "1", name: "Developers Club", plan: "Free Plan" },
    { id: "2", name: "lodhanaitik07@gmail.com's Org", plan: "Free Plan", count: "2 projects" },
    { id: "3", name: "MananPyJava's Org", plan: "Free Plan", count: "16 projects" },
    { id: "4", name: "mpstme.tech", plan: "Free Plan", count: "1 project" },
    { id: "5", name: "SRE_XTS", plan: "Free Plan", count: "1 project" },
    { id: "6", name: "supahack-lw15", plan: "Free Plan", count: "2 projects" },
    { id: "7", name: "Vedant's projects", plan: "Free Plan", count: "1 project", special: true },
  ]

  return (
    <div className="flex w-full flex-col min-h-screen bg-[#111111] text-zinc-100 font-sans">
      <main className="flex-1 p-6 md:p-12 max-w-[1240px] mx-auto w-full mt-4">
        <h1 className="text-[32px] font-medium mb-12 tracking-tight">Your Organizations</h1>
        
        <div className="flex items-center justify-between mb-8">
          <div className="relative w-full max-w-[340px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search for an organization" 
              className="w-full pl-10 pr-4 py-2.5 bg-[#161616] border border-zinc-800 rounded-[8px] text-[15px] placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
          <Button className="bg-[#128a5a] hover:bg-[#128a5a]/90 text-white border-0 shadow-none rounded-[6px] px-4 font-medium h-[36px] text-[14px]">
            <Plus className="mr-1.5 h-[18px] w-[18px]" />
            New organization
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {organizations.map((org) => (
            <Link key={org.id} href={`/dashboard/organizations/${org.id}`}>
              <div className="flex items-center gap-4 p-[18px] rounded-[10px] border border-zinc-800/80 bg-[#161616] hover:bg-[#1f1f1f] transition-colors cursor-pointer group shadow-sm relative overflow-hidden">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#1c1c1c] border border-zinc-800 text-zinc-400 group-hover:text-zinc-300">
                  <Blocks size={20} strokeWidth={1.5} />
                </div>
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-medium text-[15px] text-zinc-200">{org.name}</h3>
                  <p className="text-[13px] text-zinc-500">
                    {org.plan}{org.count ? ` · ${org.count}` : ''}
                  </p>
                </div>
                {org.special && (
                   <div className="absolute right-3.5 bottom-3.5">
                     <div className="h-5 w-5 rounded bg-zinc-800 flex items-center justify-center border border-zinc-700/50 shadow-inner">
                       <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[6px] border-b-zinc-400"></div>
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
