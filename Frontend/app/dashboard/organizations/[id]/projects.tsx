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
    <div className="flex w-full flex-col min-h-screen bg-[#111111] text-zinc-100 font-sans">
      <main className="flex-1 p-6 md:p-12 max-w-[1280px] mx-auto w-full mt-4">
        <h1 className="text-[32px] font-medium mb-12 tracking-tight">Projects</h1>
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-[340px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <input 
                type="text" 
                placeholder="Search for a project" 
                className="w-[280px] pl-10 pr-4 py-2.5 bg-[#161616] border border-zinc-800 rounded-[8px] text-[15px] placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
              />
            </div>
            
            <Button variant="outline" className="h-[40px] bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100 rounded-[8px] px-4 font-normal text-[14px] shadow-sm gap-2">
              Status <ChevronDown className="h-4 w-4 text-zinc-500" />
            </Button>
            
            <Button variant="outline" className="h-[40px] bg-transparent border-zinc-800 text-zinc-300 hover:bg-zinc-800/50 hover:text-zinc-100 rounded-[8px] px-4 font-normal text-[14px] shadow-sm gap-2">
              <ListFilter className="h-[18px] w-[18px] text-zinc-500" /> Sorted by name
            </Button>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 border border-zinc-800 rounded-[8px] p-1 h-[40px] bg-[#161616]">
              <button className="p-1 px-2 rounded bg-zinc-800 text-zinc-200">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button className="p-1 px-2 rounded text-zinc-500 hover:text-zinc-300 transition-colors">
                <List className="h-4 w-4" />
              </button>
            </div>
          
            <Button className="bg-[#128a5a] hover:bg-[#128a5a]/90 text-white border-0 shadow-none rounded-[6px] px-4 font-medium h-[36px] text-[14px]">
              <Plus className="mr-1.5 h-[18px] w-[18px]" />
              New project
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {forms.map((form) => (
            <div key={form.id} className="flex flex-col h-[220px] p-6 rounded-[12px] border border-zinc-800/80 bg-[#161616] hover:bg-[#1c1c1c] transition-all relative shadow-sm">
              <div className="flex flex-col flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-medium text-[17px] text-zinc-100">{form.name}</h3>
                  <button className="text-zinc-600 hover:text-zinc-400 p-1 -mr-2">
                    <MoreVertical className="h-[18px] w-[18px]" />
                  </button>
                </div>
                <p className="text-[14px] text-zinc-500 mt-1">
                  {form.provider} | {form.region}
                </p>
                
                {form.plan && (
                  <div className="mt-4">
                    <span className="text-[11px] font-mono tracking-wider px-2 py-0.5 rounded-[4px] bg-zinc-800/60 border border-zinc-700/40 text-zinc-400">
                      {form.plan}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2.5 mt-auto">
                {form.status === 'paused' ? (
                  <div className="flex items-center gap-2 px-2 py-1.5 rounded-md border border-zinc-800 bg-[#0f0f0f] w-fit">
                    <div className="flex items-center justify-center p-1 rounded-sm border border-zinc-700 text-zinc-500">
                      <Pause className="h-2.5 w-2.5" fill="currentColor" strokeWidth={0} />
                    </div>
                    <span className="text-[13px] text-zinc-400 flex items-center gap-1.5 font-normal">Project is paused <span className="text-zinc-600 border border-zinc-700 rounded-full h-[14px] w-[14px] flex items-center justify-center text-[9px]">i</span></span>
                  </div>
                ) : (
                  <div className="h-8 flex items-center">
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
