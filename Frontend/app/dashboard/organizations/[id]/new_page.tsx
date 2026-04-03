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
    <div className="flex w-full flex-col min-h-screen bg-background text-foreground font-sans">
      <main className="flex-1 p-6 md:p-12 max-w-[1240px] mx-auto w-full mt-4 flex flex-col gap-6">
        <h1 className="text-[28px] font-medium tracking-tight">Forms</h1>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative w-full max-w-[340px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search for a form" 
                className="w-[280px] pl-10 pr-4 py-[9px] bg-transparent border border-border rounded-[6px] text-[14px] placeholder:text-muted-foreground focus:outline-none focus:border-border transition-colors"
              />
            </div>
            
            <Button variant="outline" className="h-[38px] bg-transparent border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-[6px] px-3 font-normal text-[14px] shadow-none gap-2">
              Status <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </Button>
            
            <Button variant="outline" className="h-[38px] bg-transparent border border-border text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-[6px] px-3 font-normal text-[14px] shadow-none gap-2">
              <ListFilter className="h-[18px] w-[18px] text-muted-foreground" /> Sorted by name
            </Button>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 border border-border rounded-[6px] p-0.5 h-[38px]">
              <button className="px-2.5 py-[7px] rounded bg-accent text-accent-foreground">
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button className="px-2.5 py-[7px] rounded text-muted-foreground hover:text-foreground transition-colors">
                <List className="h-4 w-4" />
              </button>
            </div>
          
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-none rounded-[6px] px-3.5 h-[38px] font-medium text-[14px]">
              <Plus className="mr-1.5 h-[18px] w-[18px]" />
              New form
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
          {forms.map((form) => (
            <div key={form.id} className="flex flex-col h-[200px] p-5 rounded-[12px] border border-border/80 bg-card hover:bg-accent transition-colors relative">
              <div className="flex flex-col flex-1">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold text-[15px] text-card-foreground">{form.name}</h3>
                  <button className="text-muted-foreground hover:text-foreground -mr-2">
                    <MoreVertical className="h-[18px] w-[18px]" />
                  </button>
                </div>
                <p className="text-[13px] text-muted-foreground mt-1.5">
                  {form.provider} | {form.region}
                </p>
                
                {form.plan && (
                  <div className="mt-3">
                    <span className="text-[11px] font-mono tracking-wide px-2 py-[2px] rounded-[4px] bg-muted/60 border border-border/60 text-muted-foreground">
                      {form.plan}
                    </span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-2.5 mt-auto bg-background/50 border border-border/50 w-max px-2.5 py-1.5 rounded-full">
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
