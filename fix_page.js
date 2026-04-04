const fs = require('fs');

const content = `
"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"

import { ThemeToggle } from "@/components/theme-toggle"
import { Button } from "@/components/ui/button"

const SparklesIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 3L10.5 9.5L4 11L10.5 12.5L12 19L13.5 12.5L20 11L13.5 9.5L12 3Z" />
    <path d="M18 4L17 7L14 8L17 9L18 12L19 9L22 8L19 7L18 4Z" />
  </svg>
)

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
  </svg>
)

const BotIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="14" x="3" y="7" rx="2" ry="2"/>
    <path d="M12 3v4"/><path d="M8 13v.01"/><path d="M16 13v.01"/>
  </svg>
)

const ZapIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
)

const BranchIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="6" x2="6" y1="3" y2="15"/><circle cx="18" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M18 9a9 9 0 0 1-9 9"/>
  </svg>
)

const MessageIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
  </svg>
)

const CardIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>
  </svg>
)

const ChartIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M3 3v18h18"/><rect width="4" height="7" x="7" y="10" rx="1"/><rect width="4" height="12" x="15" y="5" rx="1"/>
  </svg>
)

const CheckIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <rect width="18" height="18" x="3" y="3" rx="2"/><path d="m9 12 2 2 4-4"/>
  </svg>
)

const GlobeIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20" />
  </svg>
)


const features = [
  {
    icon: BotIcon,
    title: "AI-Powered Builder",
    description: "Generate complex forms in seconds with intelligent AI prompts. No manual dragging required.",
  },
  {
    icon: ZapIcon,
    title: "Realtime Sync",
    description: "Watch responses flow in instantly. Collaborate with your team without refreshing.",
  },
  {
    icon: BranchIcon,
    title: "Conditional Branching",
    description: "Build incredibly smart flows that adapt to user answers in real-time.",
  },
  {
    icon: MessageIcon,
    title: "WhatsApp Surveys",
    description: "Drop phone numbers and auto-blast survey questions directly to WhatsApp.",
  },
  {
    icon: CardIcon,
    title: "In-Form Payments",
    description: "Accept payments seamlessly via integrated gateways without redirecting users.",
  },
  {
    icon: ChartIcon,
    title: "Advanced Analytics",
    description: "Dive deep into drop-off rates, conversion metrics, and detailed user insights.",
  },
  {
    icon: CheckIcon,
    title: "Interactive Quizzes",
    description: "Engage your audience with scored quizzes, logic jumps, and immediate feedback.",
  },
  {
    icon: GlobeIcon,
    title: "Custom Domains",
    description: "Host forms on your own domain to maintain full brand consistency.",
  },
]

export default function Page() {
  return (
    <main className="relative min-h-svh overflow-hidden bg-gradient-to-br from-primary/15 via-background to-background text-foreground">
      <div className="relative mx-auto flex w-full max-w-7xl flex-col px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-4 relative z-20">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl border border-border/70 bg-background/80 shadow-sm">
              <img src="/logo.png" alt="FormBar Logo" className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs tracking-[0.32em] text-foreground font-semibold uppercase">
                FormBar
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Button asChild variant="ghost" className="font-semibold text-muted-foreground hover:text-foreground">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild className="rounded-2xl px-5 h-10 shadow-sm">
              <Link href="/dashboard">Get Started</Link>
            </Button>
          </div>
        </header>

        {/* Mintlify style centered Hero */}
        <section className="flex flex-col items-center justify-center text-center pt-20 pb-12 lg:pt-28 relative z-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/75 px-4 py-2 text-sm text-muted-foreground shadow-sm backdrop-blur mb-8">
            <SparklesIcon className="size-4 text-primary" />
            Introducing Formbar Builder
          </div>
          
          <h1 className="max-w-4xl text-5xl font-extrabold tracking-tight sm:text-6xl lg:text-7xl">
            Build forms that feel like <br className="hidden sm:block" />
            first-class products
          </h1>
          
          <p className="mt-8 max-w-2xl text-lg text-muted-foreground sm:text-xl leading-relaxed">
            Create AI-powered forms, collect realtime payments, and blast WhatsApp surveys automatically. 
            Formbar is the ultimate minimalistic tool for maximum data collection.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center w-full max-w-md">
            <Button asChild size="lg" className="rounded-2xl h-12 px-8 text-base bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90 w-full sm:w-auto">
              <Link href="/dashboard">
                Start building
                <ArrowRightIcon className="ml-2 size-5" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="rounded-2xl h-12 px-8 text-base border-border/70 bg-background/50 hover:bg-muted/50 backdrop-blur w-full sm:w-auto">
              <Link href="/login">View demo</Link>
            </Button>
          </div>
        </section>

        {/* Hero Visual / Demo Block wide preview */}
        <section className="relative mx-auto w-full max-w-5xl mt-8 mb-24 z-10">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-b from-primary/30 to-transparent blur-2xl opacity-60" />
          <div className="rounded-[2rem] border border-border/70 bg-card/90 p-4 lg:p-6 shadow-2xl backdrop-blur relative overflow-hidden">
            <div className="rounded-[1.5rem] border border-border/60 bg-background/75 p-6 transition-colors duration-500">
              <div className="flex items-center gap-3 text-sm font-medium border-b border-border/60 pb-5 mb-6">
                <div className="flex gap-1.5">
                  <div className="size-3 rounded-full bg-border/80 outline border-border"></div>
                  <div className="size-3 rounded-full bg-border/80"></div>
                  <div className="size-3 rounded-full bg-border/80"></div>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <BotIcon className="size-4 text-primary" />
                  AI Builder Preview
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-[0.8fr_1.2fr]">
                <div className="rounded-3xl border border-border/60 p-5 bg-card/50">
                  <p className="text-sm font-medium">Prompt the AI</p>
                  <div className="mt-4 flex flex-col h-[calc(100%-2rem)]">
                    <div className="flex-1 rounded-2xl border border-input/50 bg-background/50 p-4 text-sm text-muted-foreground leading-relaxed">
                      "Generate a user feedback survey with an NPS rating scale, and add conditional logic asking for improvement areas if their score is below 7..."
                    </div>
                    <div className="mt-4 h-11 rounded-2xl bg-primary shadow-md shadow-primary/20 flex items-center justify-center text-primary-foreground font-medium w-full shrink-0">
                      Generate
                    </div>
                  </div>
                </div>
                
                {/* PRESERVED ANIMATION BLOCK EXACTLY AS IT WAS */}
                <div className="rounded-3xl border border-border/60 p-4 h-[250px] overflow-hidden relative bg-card/50">
                  <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent pointer-events-none z-10" />
                  <p className="text-sm font-medium mb-3 relative z-20">Live Build Output</p>
                  <div className="space-y-3 mt-4 absolute left-4 right-4 animate-[slide-up_5s_ease-in-out_infinite_alternate]">
                      <div className="h-10 rounded-2xl bg-muted/40 w-full flex items-center px-4"><div className="h-2 w-2/3 bg-background/50 rounded"></div></div>
                      <div className="h-10 rounded-xl bg-muted/40 w-5/6 flex items-center px-4"><div className="h-2 w-1/3 bg-background/50 rounded"></div></div>
                      <div className="h-24 rounded-xl bg-primary/10 border border-primary/20 w-full flex flex-col justify-center px-4 gap-2">
                         <div className="h-2 w-1/4 bg-primary/40 rounded"></div>
                         <div className="h-8 rounded-lg bg-background/60 w-full border border-border/40"></div>
                      </div>
                      <div className="h-10 rounded-xl bg-muted/40 w-4/5 flex items-center px-4"><div className="h-2 w-1/2 bg-background/50 rounded"></div></div>
                      <div className="h-10 rounded-2xl bg-primary w-1/3 ml-auto flex items-center justify-center shadow-lg"><div className="h-2 w-1/2 bg-primary-foreground/50 rounded"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Centered Grid */}
        <section className="py-20 relative z-10 border-t border-border/40">
          <div className="mb-16 text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Everything you need to collect data</h2>
            <p className="mt-4 text-muted-foreground text-lg">Minimalistic interface, powerhouse features.</p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 mt-12 w-full mx-auto text-left">
            {features.map((feature) => {
              const Icon = feature.icon
              return (
                <article
                  key={feature.title}
                  className="rounded-[1.75rem] border border-border/70 bg-card/80 p-6 backdrop-blur group transition-all hover:shadow-lg hover:border-primary/40"
                >
                  <div className="flex size-12 items-center justify-center rounded-2xl border border-border/70 bg-background/80 transition-colors group-hover:border-primary/50 group-hover:bg-primary/10">
                    <Icon className="size-6 text-primary" />
                  </div>
                  <h3 className="mt-5 text-base font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </p>
                </article>
              )
            })}
          </div>
        </section>
        
        <footer className="mt-20 flex flex-col sm:flex-row items-center justify-between gap-4 py-8 text-sm text-muted-foreground border-t border-border/40 relative z-10 w-full mb-8">
          <p>© {new Date().getFullYear()} formbar. All rights reserved.</p>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-foreground transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-foreground transition-colors">GitHub</Link>
            <Link href="#" className="hover:text-foreground transition-colors">Terms of Service</Link>
          </div>
        </footer>
      </div>
    </main>
  )
}
\`;

fs.writeFileSync('/Users/manangandhi/Coding/python_projects/recode-round-2/frontend/app/page.tsx', content, 'utf8');
