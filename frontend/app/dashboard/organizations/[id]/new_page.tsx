"use client"

import * as React from "react"
import { Search, Plus, ListFilter, LayoutGrid, List, Pause, Play, ChevronDown, MoreVertical } from "lucide-react"
import { Button } from "@/components/ui/button"

export default function OrganizationFormsPage() {
  const forms = [
    { id: "1", name: "evbase", provider: "AWS", region: "us-east-1", status: "paused" },
    { id: "2", name: "RailwayConcession", provider: "AWS", region: "ap-south-1", status: "active", plan: "NANO" },
  ]

  return (
    <div className="flex w-full flex-col min-h-screen bg-[#141414] text-zinc-100 font-sans">
      <main className="flex-1 p-6 md:p-12 max-w-[1240px] mx-auto w-full mt-4 flex flex-col gap-6">
        <h1 className="text-[28px] font-medium tracking-tight">Forms</h1>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-[340px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Search for a form" 
                className="w-[280px] pl-10 pr-4 py-[9px] bg-transparent border border-zinc-800 rounded-[6px] text-[14px] placeholder:text-zinc-500 focus:outline-none focus:border-zinc-700 transition-colors"
              />
            </div>
            
            <Button variant="outline" className="h-[38px] bg-transparent border border-zinc-800 text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100 rounded-[6px] px-3 font-normal text-[14px] shadow-none gap-2">
              Status <ChevronDown className="h-4 w-4 text-zinc-500" />
            </Button>
            
            <Button variant="outline" className="h-[38px] bg-transparent border border-zinc-800 text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100 rounded-[6px] px-3 font-normal text-[14px] shadow-none gap-2">
              <ListFilter className="h-[18px] w-[18px] text-zinc-400" /> Sorted by name
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border border-zinc-800 rounded-[6px] p-0.5 h-[38px]">
              <button className="px-2.5 py-[7px] rounded bg-[#2a2a2a] text-zinc-200">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button className="px-2.5 py-[7px] rounded text-zinc-500 hover:text-zinc-300 transition-colors">
                <List className="h-4 w-4" />
              </button>
            </div>
          
            <Button className="bg-[#128a5a] hover:bg-[#128a5a]/90 text-white shadow-none rounded-[6px] px-3.5 h-[38px] font-medium text-[14px]">
              <Plus className="mr-1.5 h-[18px] w-[18px]" />
              New form
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {forms.map((form) => (
            <div key={form.id} className="flex flex-col h-[200px] p-5 rounded-[12px] border border-zinc-800/80 bg-[#1a1a1a] hover:bg-[#202020] transition-colors relative">
              <div className="flex flex-col flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-[15px] text-zinc-100">{form.name}</h3>
                  <button className="text-zinc-500 hover:text-zinc-300 -mr-2">
                    <MoreVertical className="h-[18px] w-[18px]" />
                  </button>
                </div>
                <p className="text-[13px] text-zinc-500 mt-1.5">
                  {form.provider} | {form.region}
                </p>
                
                {form.plan && (
                  <div className="mt-3">
                    <span className="text-[11px] font-mono tracking-wide px-2 py-[2px] rounded-[4px] bg-zinc-800/60 border border-zinc-700/60 text-zinc-400">
                      {form.plan}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2.5 mt-auto bg-[#141414]/50 border border-zinc-800/50 w-max px-2.5 py-1.5 rounded-full">
                {form.status === 'paused' ? (
                  <>
                    <div className="flex items-center justify-center text-zinc-400">
                      <Pause className="h-[10px] w-[10px]" fill="currentColor" strokeWidth={0} />
                    </div>
                    <span className="text-[12px] text-zinc-400 flex items-center gap-1.5">Form is paused <span className="text-zinc-600 border border-zinc-600 rounded-full h-[14px] w-[14px] flex items-center justify-center text-[9px]">i</span></span>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-center text-emerald-500">
                      <Play className="h-[10px] w-[10px]" fill="currentColor" strokeWidth={0} />
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
