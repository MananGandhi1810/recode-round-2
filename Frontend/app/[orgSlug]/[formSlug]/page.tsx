"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { type FormRecord } from "@/lib/forms"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Mail } from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { QRCodeSVG } from "qrcode.react"
import { format, differenceInSeconds } from "date-fns"
import confetti from "canvas-confetti"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const themeClasses = {
  minimal: "bg-background text-foreground border-border",
  playful: "bg-[#fdf8f5] text-[#2d3748] border-[#fbd38d]",
  corporate: "bg-[#f8fafc] text-[#0f172a] border-[#cbd5e1]",
}

const buttonClasses = {
  minimal: "bg-primary text-primary-foreground hover:bg-primary/90",
  playful: "bg-[#ed8936] text-white hover:bg-[#dd6b20] rounded-2xl font-bold",
  corporate: "bg-[#1e293b] text-white hover:bg-[#0f172a] rounded-sm uppercase tracking-wide",
}

const inputClasses = {
  minimal: "border-input bg-background focus:border-ring rounded-[8px]",
  playful: "border-[#fbd38d] bg-white focus:border-[#ed8936] rounded-2xl shadow-sm text-lg",
  corporate: "border-[#cbd5e1] bg-white focus:border-[#475569] rounded-sm",
}

export default function PublicFormPage() {
  const params = useParams<{ formSlug: string, orgSlug: string }>()
  const [form, setForm] = React.useState<FormRecord | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [answers, setAnswers] = React.useState<Record<string, string | string[]>>({})
  const [currentStep, setCurrentStep] = React.useState(0)
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null)
  
  const handleNext = React.useCallback(() => {
    setCurrentStep(s => s + 1)
  }, [])

  const handleBack = React.useCallback(() => {
    if (currentStep > 0) setCurrentStep(s => s - 1)
  }, [currentStep])

  React.useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) {
      handleNext()
      return
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, handleNext])

  const [uploading, setUploading] = React.useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submissionId, setSubmissionId] = React.useState<string | null>(null)
  const [email, setEmail] = React.useState("")
  const [isEmailing, setIsEmailing] = React.useState(false)
  const [emailSent, setEmailSent] = React.useState(false)

  React.useEffect(() => {
    void apiFetch<FormRecord>(`/f/by-slug/${params.formSlug}`)
      .then(setForm)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load form"))
      .finally(() => setLoading(false))
  }, [params.formSlug])

  const evaluateLogic = React.useCallback((block: any) => {
    if (!block.config?.logic || block.config.logic.length === 0) return true
    
    let isVisible = true
    for (const rule of block.config.logic) {
      const conditionResults = rule.conditions.map((cond: any) => {
        const val = answers[cond.blockId]
        if (val === undefined) return false
        switch (cond.operator) {
          case 'equals': return val === cond.value
          case 'not_equals': return val !== cond.value
          case 'contains': return String(val).toLowerCase().includes(String(cond.value).toLowerCase())
          case 'is_empty': return !val || val.length === 0
          case 'is_not_empty': return val && val.length > 0
          default: return false
        }
      })
      const rulePassed = rule.conditionMatch === 'all' ? conditionResults.every(Boolean) : conditionResults.some(Boolean)
      if (rulePassed && rule.action === 'hide') isVisible = false
      else if (rulePassed && rule.action === 'show') isVisible = true
      else if (!rulePassed && rule.action === 'show') isVisible = false
    }
    return isVisible
  }, [answers])

  const blocks = form?.schema_snapshot?.blocks ?? []
  const visibleBlocks = React.useMemo(() => blocks.filter(b => evaluateLogic(b)), [blocks, evaluateLogic])

  React.useEffect(() => {
    if (!form || !form.is_quiz) return
    const block = visibleBlocks[currentStep]
    if (block && block.config?.timerSeconds) {
      setTimeLeft(block.config.timerSeconds)
    } else {
      setTimeLeft(null)
    }
  }, [currentStep, form, visibleBlocks])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !form) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Form Unavailable</h1>
          <p className="mt-2 text-muted-foreground">{error ?? "Form not found"}</p>
        </div>
      </div>
    )
  }

  const theme = (form.theme || "minimal") as keyof typeof themeClasses
  const tClass = themeClasses[theme] || themeClasses.minimal
  const bClass = buttonClasses[theme] || buttonClasses.minimal
  const iClass = inputClasses[theme] || inputClasses.minimal

  const parseMentions = (text: string) => {
    if (!text) return ""
    let parsed = text
    const regex = /\{\{([^}]+)\}\}/g
    let match
    while ((match = regex.exec(text)) !== null) {
      const blockId = match[1]
      const answer = answers[blockId]
      parsed = parsed.replace(match[0], answer ? String(answer) : `[Blank]`)
    }
    return parsed
  }
  
  const isSummaryStep = currentStep >= visibleBlocks.length

  const handleAnswer = (blockId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [blockId]: value }))
  }

  const handleFileUpload = async (blockId: string, file: File) => {
    setUploading(prev => ({...prev, [blockId]: true}))
    const formData = new FormData()
    formData.append('file', file)
    
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
    
    try {
      const res = await fetch(`${API_BASE_URL}/f/${form.id}/upload`, {
        method: 'POST',
        body: formData
      })
      const data = await res.json()
      handleAnswer(blockId, data.url)
    } catch (e) {
      alert('Upload failed')
    } finally {
      setUploading(prev => ({...prev, [blockId]: false}))
    }
  }

  const submitForm = async () => {
    setIsSubmitting(true)
    try {
      const res = await apiFetch<{id: string, message: string}>(`/f/${form.id}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers })
      })
      setSubmissionId(res.id)
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    } catch (err) {
      alert("Failed to submit: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setIsSubmitting(false)
    }
  }

  const sendEmailCopy = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!submissionId || !email) return
    setIsEmailing(true)
    try {
      await apiFetch(`/f/${form.id}/submissions/${submissionId}/email`, {
        method: "POST",
        body: JSON.stringify({ email })
      })
      setEmailSent(true)
    } catch (err) {
      alert("Failed to send email")
    } finally {
      setIsEmailing(false)
    }
  }

  if (submissionId) {
    return (
      <div className={cn("flex min-h-screen flex-col items-center justify-center p-6", tClass)}>
        <div className="w-full max-w-md rounded-[16px] p-8 shadow-sm border border-inherit bg-inherit text-inherit">
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mb-4" />
            <h1 className="text-2xl font-bold mb-2">Submitted Successfully</h1>
            <p className="text-muted-foreground mb-8">Thank you for filling out {form.name}.</p>
            
            {!emailSent ? (
              <form onSubmit={sendEmailCopy} className="w-full">
                <p className="text-sm font-medium mb-3 text-left">Send a copy of responses to your email:</p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={cn("flex-1 px-3 py-2 border transition outline-none", iClass)}
                  />
                  <Button type="submit" disabled={isEmailing} className={cn("px-4", bClass)}>
                    {isEmailing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="w-full p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-600 text-sm">
                A copy of your responses has been sent to {email}.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex min-h-screen flex-col items-center justify-center p-4 md:p-8 transition-colors duration-300", tClass)}>
      <div className="w-full max-w-2xl p-6 md:p-10 rounded-[20px] shadow-lg border border-inherit bg-inherit text-inherit">
        
        <div className="mb-8">
          <div className="h-2 w-full bg-muted overflow-hidden rounded-full">
            <div 
              className="h-full bg-primary transition-all duration-500" 
              style={{ width: `${(Math.min(currentStep, visibleBlocks.length) / visibleBlocks.length) * 100}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground font-medium uppercase tracking-wider text-right">
            {isSummaryStep ? "Summary" : `Step ${currentStep + 1} of ${visibleBlocks.length}`}
          </p>
        </div>

        {isSummaryStep ? (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <h2 className="text-3xl font-bold mb-6">Review your answers</h2>
            <div className="space-y-6 mb-8">
              {visibleBlocks.map((block, idx) => {
                if (block.type === 'h1' || block.type === 'h2' || block.type === 'paragraph') return null;
                const answer = answers[block.id]
                return (
                  <div key={block.id} className="border-b border-border pb-4 last:border-0">
                    <p className="text-sm text-muted-foreground mb-1">{parseMentions(block.label) || "Untitled Question"}</p>
                    <div className="flex justify-between items-start gap-4">
                      <p className="font-medium text-lg">
                        {Array.isArray(answer) ? answer.join(", ") : (answer || "—")}
                      </p>
                      <button 
                        onClick={() => setCurrentStep(idx)}
                        className="text-sm text-primary hover:underline"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-3">
              <Button onClick={handleBack} variant="outline" className="flex-1 py-6 text-lg">
                Back
              </Button>
              <Button onClick={submitForm} disabled={isSubmitting} className={cn("flex-1 py-6 text-lg", bClass)}>
                {isSubmitting ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : null}
                Submit
              </Button>
            </div>
          </div>
        ) : (
          <div key={currentStep} className="animate-in fade-in slide-in-from-right-8 duration-500 relative">
            {timeLeft !== null && (
              <div className="absolute -top-12 right-0 bg-background shadow border border-border px-3 py-1 rounded-full text-sm font-mono font-medium flex items-center gap-2">
                ⏱ {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </div>
            )}

            {(() => {
              const block = visibleBlocks[currentStep]
              if (block.type === 'h1') return <h1 className="text-4xl font-bold mb-8">{parseMentions(block.label)}</h1>
              if (block.type === 'h2') return <h2 className="text-2xl font-bold mb-6">{parseMentions(block.label)}</h2>
              if (block.type === 'paragraph') return <p className="text-lg text-muted-foreground mb-8">{parseMentions(block.label)}</p>
              
              return (
                <div className="mb-8">
                  <label className="block text-2xl font-semibold mb-4 leading-tight">
                    {parseMentions(block.label)}
                    {block.config.required && <span className="text-destructive ml-1">*</span>}
                  </label>
                  
                  {block.type === 'short_text' && (
                    <input 
                      type="text"
                      className={cn("w-full px-4 py-4 text-xl border transition outline-none", iClass)}
                      placeholder={block.config.placeholder || "Type your answer here..."}
                      value={(answers[block.id] as string) || ""}
                      onChange={(e) => handleAnswer(block.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleNext()
                      }}
                      autoFocus
                    />
                  )}
                  {block.type === 'long_text' && (
                    <textarea 
                      className={cn("w-full px-4 py-4 text-lg border transition outline-none min-h-[150px] resize-none", iClass)}
                      placeholder={block.config.placeholder || "Type your answer here..."}
                      value={(answers[block.id] as string) || ""}
                      onChange={(e) => handleAnswer(block.id, e.target.value)}
                      autoFocus
                    />
                  )}
                  {block.type === 'checkbox' && (
                    <div className="space-y-3">
                      {(block.config.options || []).map((opt) => {
                        const isChecked = (answers[block.id] as string[])?.includes(opt.value) || false
                        return (
                          <label key={opt.value} className={cn("flex items-center gap-4 p-4 border rounded-[12px] cursor-pointer transition", iClass, isChecked ? "border-primary bg-primary/5" : "border-border")}>
                            <input 
                              type="checkbox"
                              className="w-5 h-5 rounded border-muted"
                              checked={isChecked}
                              onChange={(e) => {
                                const current = (answers[block.id] as string[]) || []
                                if (e.target.checked) {
                                  handleAnswer(block.id, [...current, opt.value])
                                } else {
                                  handleAnswer(block.id, current.filter(v => v !== opt.value))
                                }
                              }}
                            />
                            <span className="text-lg">{opt.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                  {block.type === 'multiple_choice' && (
                    <div className="space-y-3">
                      {(block.config.options || []).map((opt) => {
                        const isChecked = answers[block.id] === opt.value
                        return (
                          <label key={opt.value} className={cn("flex items-center gap-4 p-4 border rounded-[12px] cursor-pointer transition", iClass, isChecked ? "border-primary bg-primary/5" : "border-border")}>
                            <input 
                              type="radio"
                              name={`radio-${block.id}`}
                              className="w-5 h-5 border-muted"
                              checked={isChecked}
                              onChange={() => handleAnswer(block.id, opt.value)}
                            />
                            <span className="text-lg">{opt.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                  {block.type === 'dropdown' && (
                    <select
                      className={cn("w-full px-4 py-4 text-xl border transition outline-none", iClass)}
                      value={(answers[block.id] as string) || ""}
                      onChange={(e) => handleAnswer(block.id, e.target.value)}
                    >
                      <option value="">Select an option</option>
                      {(block.config.options || []).map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  )}
                  {block.type === 'date_picker' && (
                    <input 
                      type="date"
                      className={cn("w-full px-4 py-4 text-xl border transition outline-none", iClass)}
                      value={(answers[block.id] as string) || ""}
                      onChange={(e) => handleAnswer(block.id, e.target.value)}
                    />
                  )}
                  {block.type === 'rating' && (
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(star => (
                        <button
                          key={star}
                          type="button"
                          className={cn("text-4xl hover:scale-110 transition-transform", (answers[block.id] as string) >= String(star) ? "text-amber-400" : "text-muted")}
                          onClick={() => handleAnswer(block.id, String(star))}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  )}
                  {block.type === 'file_upload' && (
                    <div className={cn("w-full border-2 border-dashed p-8 rounded-[12px] flex flex-col items-center justify-center text-center", iClass)}>
                      {(answers[block.id]) ? (
                        <a href={answers[block.id] as string} target="_blank" rel="noreferrer" className="text-primary underline font-medium break-all">View uploaded file</a>
                      ) : uploading[block.id] ? (
                        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      ) : (
                        <input 
                          type="file" 
                          onChange={(e) => {
                            if (e.target.files?.[0]) handleFileUpload(block.id, e.target.files[0])
                          }} 
                        />
                      )}
                    </div>
                  )}
                  {block.type === 'upi_payment' && (
                    <div className="space-y-6 flex flex-col items-center">
                      <div className="p-4 bg-white rounded-xl shadow-sm border border-border inline-block">
                        <QRCodeSVG 
                          value={`upi://pay?pa=${block.config.upiId}&pn=Merchant&am=${parseMentions(block.config.upiAmount || '0')}&cu=INR`}
                          size={200}
                          level="Q"
                        />
                      </div>
                      <p className="text-sm font-medium">Scan to pay {parseMentions(block.config.upiAmount || '0')} INR via UPI</p>
                      
                      <div className="w-full space-y-4 pt-4 border-t border-border">
                        <input 
                          type="text"
                          className={cn("w-full px-4 py-4 text-xl border transition outline-none", iClass)}
                          placeholder="Transaction Reference ID"
                          value={(answers[block.id] as string) || ""}
                          onChange={(e) => handleAnswer(block.id, e.target.value)}
                        />
                        <div className={cn("w-full border-2 border-dashed p-4 rounded-[12px] flex flex-col items-center justify-center text-center", iClass)}>
                          <p className="text-sm font-medium mb-2">Upload Payment Screenshot</p>
                          {(answers[block.id + '_img']) ? (
                            <a href={answers[block.id + '_img'] as string} target="_blank" rel="noreferrer" className="text-primary underline text-sm break-all">View screenshot</a>
                          ) : uploading[block.id + '_img'] ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          ) : (
                            <input 
                              type="file" 
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleFileUpload(block.id + '_img', e.target.files[0])
                                }
                              }} 
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })()}

            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button onClick={handleBack} variant="outline" size="lg" className="py-6 px-6">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <Button onClick={handleNext} size="lg" className={cn("flex-1 py-6 text-lg group", bClass)}>
                {currentStep >= visibleBlocks.length - 1 ? "Review" : "Next"}
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
            
            <p className="text-center mt-6 text-sm text-muted-foreground flex items-center justify-center gap-1">
              Press <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs text-foreground">Enter ↵</span> to continue
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
