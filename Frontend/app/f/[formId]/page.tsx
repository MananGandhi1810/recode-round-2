"use client"

import * as React from "react"
import { useParams, useSearchParams } from "next/navigation"
import { apiFetch } from "@/lib/api"
import { type FormRecord } from "@/lib/forms"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  Mail,
  X,
  Plus,
} from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { QRCodeSVG } from "qrcode.react"
import { ThemeToggle } from "@/components/theme-toggle"
import confetti from "canvas-confetti"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const themeClasses = {
  minimal: "bg-background text-foreground border-border",
  playful:
    "bg-[#fdf8f5] text-[#2d3748] border-[#fbd38d] dark:bg-[#0a0a0a] dark:text-[#fdf8f5] dark:border-[#ed8936]",
  corporate:
    "bg-[#f8fafc] text-[#0f172a] border-[#cbd5e1] dark:bg-[#0a0a0a] dark:text-[#f8fafc] dark:border-[#475569]",
}

const buttonClasses = {
  minimal: "bg-primary text-primary-foreground hover:bg-primary/90",
  playful:
    "bg-[#ed8936] text-white hover:bg-[#dd6b20] rounded-2xl font-bold dark:bg-[#f6ad55] dark:text-black",
  corporate:
    "bg-[#1e293b] text-white hover:bg-[#0f172a] rounded-sm uppercase tracking-wide dark:bg-[#334155] dark:text-white",
}

const inputClasses = {
  minimal: "border-input bg-background focus:border-ring rounded-[8px]",
  playful:
    "border-[#fbd38d] bg-white focus:border-[#ed8936] rounded-2xl shadow-sm text-lg dark:bg-[#1a1a1a] dark:border-[#ed8936] dark:text-white",
  corporate:
    "border-[#cbd5e1] bg-white focus:border-[#475569] rounded-sm dark:bg-[#1a1a1a] dark:border-[#475569] dark:text-white",
}

export default function PublicFormPage() {
  const params = useParams<{ formId: string }>()
  const searchParams = useSearchParams()
  const isEmbed = searchParams.get("embed") === "true"
  const [form, setForm] = React.useState<FormRecord | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [answers, setAnswers] = React.useState<
    Record<string, string | string[]>
  >({})
  const [currentStep, setCurrentStep] = React.useState(0)
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null)
  const [uploading, setUploading] = React.useState<Record<string, boolean>>({})
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submissionId, setSubmissionId] = React.useState<string | null>(null)
  const [email, setEmail] = React.useState("")
  const [isEmailing, setIsEmailing] = React.useState(false)
  const [emailSent, setEmailSent] = React.useState(false)

  const [validationError, setValidationError] = React.useState<string | null>(
    null
  )

  const validateInput = (value: string, block: any): string | null => {
    if (block.config?.required && !value) return "This field is required"
    if (block.config?.minLength && value.length < block.config.minLength) {
      return `Minimum ${block.config.minLength} characters required`
    }
    if (block.config?.maxLength && value.length > block.config.maxLength) {
      return `Maximum ${block.config.maxLength} characters allowed`
    }
    if (block.config?.validationType === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (value && !emailRegex.test(value)) return "Invalid email address"
    }
    if (block.config?.validationType === "number") {
      if (value && isNaN(Number(value))) return "Must be a number"
    }
    if (block.config?.validationType === "url") {
      try {
        if (value) new URL(value)
      } catch (e) {
        return "Invalid URL"
      }
    }
    return null
  }

  const parseMentions = React.useCallback(
    (text: string) => {
      if (!text) return ""
      let parsed = text
      const regex = /\{\{([^}]+)\}\}/g
      let match
      while ((match = regex.exec(text)) !== null) {
        const blockId = match[1]
        const answer = answers[blockId]
        const replacement = Array.isArray(answer)
          ? answer.join(", ")
          : answer || `[Blank]`
        parsed = parsed.replace(match[0], String(replacement))
      }
      return parsed
    },
    [answers]
  )

  const evaluateLogic = React.useCallback(
    (block: any) => {
      if (!block.config?.logic || block.config.logic.length === 0) return true

      let isVisible = true
      for (const rule of block.config.logic) {
        if (!rule.conditions || rule.conditions.length === 0) continue

        const conditionResults = rule.conditions.map((cond: any) => {
          const val = answers[cond.blockId]
          const condValue = cond.value

          switch (cond.operator) {
            case "equals":
              return String(val || "") === String(condValue || "")
            case "not_equals":
              return String(val || "") !== String(condValue || "")
            case "greater_than":
              return Number(val || 0) > Number(condValue || 0)
            case "less_than":
              return Number(val || 0) < Number(condValue || 0)
            case "contains":
              return String(val || "")
                .toLowerCase()
                .includes(String(condValue || "").toLowerCase())
            case "is_empty":
              return !val || (Array.isArray(val) && val.length === 0)
            case "is_not_empty":
              return !!val && (!Array.isArray(val) || val.length > 0)
            default:
              return false
          }
        })

        const rulePassed =
          rule.conditionMatch === "all"
            ? conditionResults.every(Boolean)
            : conditionResults.some(Boolean)

        if (rulePassed) {
          if (rule.action === "hide") isVisible = false
          if (rule.action === "show") isVisible = true
        } else {
          if (rule.action === "show") isVisible = false
        }
      }
      return isVisible
    },
    [answers]
  )

  const blocks = form?.schema_snapshot?.blocks ?? []
  const visibleBlocks = React.useMemo(
    () => blocks.filter((b) => evaluateLogic(b)),
    [blocks, evaluateLogic]
  )

  const handleNext = React.useCallback(() => {
    const block = visibleBlocks[currentStep]
    if (block) {
      const error = validateInput(String(answers[block.id] || ""), block)
      if (error) {
        setValidationError(error)
        return
      }
    }
    setValidationError(null)
    setCurrentStep((s) => s + 1)
  }, [currentStep, visibleBlocks, answers])

  React.useEffect(() => {
    if (timeLeft === null) return
    if (timeLeft <= 0) {
      handleNext()
      return
    }
    const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000)
    return () => clearTimeout(timer)
  }, [timeLeft, handleNext])

  React.useEffect(() => {
    if (!form || !form.is_quiz) return
    const block = visibleBlocks[currentStep]
    if (block && block.config?.timerSeconds) {
      setTimeLeft(block.config.timerSeconds)
    } else {
      setTimeLeft(null)
    }
  }, [currentStep, form, visibleBlocks])

  React.useEffect(() => {
    void apiFetch<FormRecord>(`/f/${params.formId}`)
      .then(setForm)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Failed to load form")
      )
      .finally(() => setLoading(false))
  }, [params.formId])

  const handleBack = React.useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }, [currentStep])

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
          <p className="mt-2 text-muted-foreground">
            {error ?? "Form not found"}
          </p>
        </div>
      </div>
    )
  }

  const theme = (form.theme || "minimal") as keyof typeof themeClasses
  const tClass = themeClasses[theme] || themeClasses.minimal
  const bClass = buttonClasses[theme] || buttonClasses.minimal
  const iClass = inputClasses[theme] || inputClasses.minimal

  const isSummaryStep = currentStep >= visibleBlocks.length

  const handleAnswer = (blockId: string, value: string | string[]) => {
    setAnswers((prev) => ({ ...prev, [blockId]: value }))
  }

  const handleFileUpload = async (blockId: string, file: File) => {
    setUploading((prev) => ({ ...prev, [blockId]: true }))
    const formData = new FormData()
    formData.append("file", file)

    const API_BASE_URL =
      process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"

    try {
      const res = await fetch(`${API_BASE_URL}/f/${form.id}/upload`, {
        method: "POST",
        body: formData,
        credentials: "include",
      })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      // Store the filename as well for better UI
      handleAnswer(blockId, data.url)
      handleAnswer(`${blockId}_filename`, data.filename)
    } catch (e) {
      alert("Upload failed")
    } finally {
      setUploading((prev) => ({ ...prev, [blockId]: false }))
    }
  }

  const submitForm = async () => {
    setIsSubmitting(true)
    try {
      const res = await apiFetch<{ id: string; message: string }>(
        `/f/${form.id}/submit`,
        {
          method: "POST",
          body: JSON.stringify({ answers }),
        }
      )
      setSubmissionId(res.id)
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })

      if (form.redirect_url) {
        setTimeout(() => {
          window.location.href = form.redirect_url!
        }, 1500)
      }
    } catch (err: any) {
      if (err.detail?.block_id) {
        const blockIndex = visibleBlocks.findIndex(
          (b) => b.id === err.detail.block_id
        )
        if (blockIndex !== -1) {
          setCurrentStep(blockIndex)
          setValidationError(err.detail.message)
          setIsSubmitting(false)
          return
        }
      }
      alert(
        "Failed to submit: " +
          (err instanceof Error ? err.message : "Unknown error")
      )
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
        body: JSON.stringify({ email }),
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
      <div
        className={cn(
          "flex min-h-screen flex-col items-center justify-center p-6",
          tClass
        )}
      >
        <div className="w-full max-w-md rounded-[16px] border border-inherit bg-inherit p-8 text-inherit shadow-sm">
          <div className="flex flex-col items-center text-center">
            <CheckCircle2 className="mb-4 h-12 w-12 text-emerald-500" />
            <h1 className="mb-2 text-2xl font-bold">Submitted Successfully</h1>
            <p className="mb-8 text-muted-foreground">
              Thank you for filling out {form.name}.
            </p>

            {!emailSent ? (
              <form onSubmit={sendEmailCopy} className="w-full">
                <p className="mb-3 text-left text-sm font-medium">
                  Send a copy of responses to your email:
                </p>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className={cn(
                      "flex-1 border px-3 py-2 transition outline-none",
                      iClass
                    )}
                  />
                  <Button
                    type="submit"
                    disabled={isEmailing}
                    className={cn("px-4", bClass)}
                  >
                    {isEmailing ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Mail className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <div className="w-full rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-600">
                A copy of your responses has been sent to {email}.
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "form-root flex min-h-screen flex-col items-center justify-center transition-colors duration-300",
        isEmbed ? "p-0" : "p-4 md:p-8",
        tClass
      )}
    >
      {form.custom_css && <style>{form.custom_css}</style>}
      {!isEmbed && (
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
      )}
      <div className="w-full max-w-2xl rounded-[20px] border border-inherit bg-inherit p-6 text-inherit shadow-lg md:p-10">
        <div className="mb-8">
          <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{
                width: `${(Math.min(currentStep, visibleBlocks.length) / visibleBlocks.length) * 100}%`,
              }}
            />
          </div>
          <p className="mt-2 text-right text-xs font-medium tracking-wider text-muted-foreground uppercase">
            {isSummaryStep
              ? "Summary"
              : `Step ${currentStep + 1} of ${visibleBlocks.length}`}
          </p>
        </div>

        {isSummaryStep ? (
          <div className="animate-in duration-500 fade-in slide-in-from-bottom-4">
            <h2 className="mb-6 text-3xl font-bold">Review your answers</h2>
            <div className="mb-8 space-y-6">
              {visibleBlocks.map((block, idx) => {
                if (
                  block.type === "h1" ||
                  block.type === "h2" ||
                  block.type === "paragraph"
                )
                  return null
                const answer = answers[block.id]
                return (
                  <div
                    key={block.id}
                    className="border-b border-border pb-4 last:border-0"
                  >
                    <p className="mb-1 text-sm text-muted-foreground">
                      {parseMentions(block.label) || "Untitled Question"}
                    </p>
                    <div className="flex items-start justify-between gap-4">
                      <p className="text-lg font-medium">
                        {block.type === "file_upload" ? (
                          answers[`${block.id}_filename`] ? (
                            <span className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">
                                File:
                              </span>{" "}
                              {answers[`${block.id}_filename`]}
                            </span>
                          ) : (
                            "—"
                          )
                        ) : Array.isArray(answer) ? (
                          answer.join(", ")
                        ) : (
                          answer || "—"
                        )}
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
              <Button
                onClick={handleBack}
                variant="outline"
                className="flex-1 py-6 text-lg"
              >
                Back
              </Button>
              <Button
                onClick={submitForm}
                disabled={isSubmitting}
                className={cn("flex-1 py-6 text-lg", bClass)}
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : null}
                Submit
              </Button>
            </div>
          </div>
        ) : (
          <div
            key={currentStep}
            className="relative animate-in duration-500 fade-in slide-in-from-right-8"
          >
            {timeLeft !== null && (
              <div className="absolute -top-12 right-0 flex items-center gap-2 rounded-full border border-border bg-background px-3 py-1 font-mono text-sm font-medium shadow">
                ⏱ {Math.floor(timeLeft / 60)}:
                {(timeLeft % 60).toString().padStart(2, "0")}
              </div>
            )}

            {(() => {
              const block = visibleBlocks[currentStep]
              if (!block) return null

              if (block.type === "h1")
                return (
                  <h1 className="mb-8 text-4xl font-bold">
                    {parseMentions(block.label)}
                  </h1>
                )
              if (block.type === "h2")
                return (
                  <h2 className="mb-6 text-2xl font-bold">
                    {parseMentions(block.label)}
                  </h2>
                )
              if (block.type === "paragraph")
                return (
                  <p className="mb-8 text-lg text-muted-foreground">
                    {parseMentions(block.label)}
                  </p>
                )

              return (
                <div className="mb-8">
                  <label className="mb-4 block text-2xl leading-tight font-semibold">
                    {parseMentions(block.label)}
                    {block.config?.required && (
                      <span className="ml-1 text-destructive">*</span>
                    )}
                  </label>

                  {block.type === "short_text" && (
                    <input
                      type="text"
                      className={cn(
                        "w-full border px-4 py-4 text-xl transition outline-none",
                        iClass
                      )}
                      placeholder={parseMentions(
                        block.config?.placeholder || "Type your answer here..."
                      )}
                      value={(answers[block.id] as string) || ""}
                      onChange={(e) => handleAnswer(block.id, e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleNext()
                      }}
                      autoFocus
                    />
                  )}
                  {block.type === "long_text" && (
                    <textarea
                      className={cn(
                        "min-h-[150px] w-full resize-none border px-4 py-4 text-lg transition outline-none",
                        iClass
                      )}
                      placeholder={parseMentions(
                        block.config?.placeholder || "Type your answer here..."
                      )}
                      value={(answers[block.id] as string) || ""}
                      onChange={(e) => handleAnswer(block.id, e.target.value)}
                      autoFocus
                    />
                  )}
                  {block.type === "checkbox" && (
                    <div className="space-y-3">
                      {(block.config?.options || []).map((opt) => {
                        const isChecked =
                          (answers[block.id] as string[])?.includes(
                            opt.value
                          ) || false
                        return (
                          <label
                            key={opt.value}
                            className={cn(
                              "flex cursor-pointer items-center gap-4 rounded-[12px] border p-4 transition",
                              iClass,
                              isChecked
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            )}
                          >
                            <input
                              type="checkbox"
                              className="h-5 w-5 rounded border-muted"
                              checked={isChecked}
                              onChange={(e) => {
                                const current =
                                  (answers[block.id] as string[]) || []
                                if (e.target.checked) {
                                  handleAnswer(block.id, [
                                    ...current,
                                    opt.value,
                                  ])
                                } else {
                                  handleAnswer(
                                    block.id,
                                    current.filter((v) => v !== opt.value)
                                  )
                                }
                              }}
                            />
                            <span className="text-lg">{opt.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                  {block.type === "multiple_choice" && (
                    <div className="space-y-3">
                      {(block.config?.options || []).map((opt) => {
                        const isChecked = answers[block.id] === opt.value
                        return (
                          <label
                            key={opt.value}
                            className={cn(
                              "flex cursor-pointer items-center gap-4 rounded-[12px] border p-4 transition",
                              iClass,
                              isChecked
                                ? "border-primary bg-primary/5"
                                : "border-border"
                            )}
                          >
                            <input
                              type="radio"
                              name={`radio-${block.id}`}
                              className="h-5 w-5 border-muted"
                              checked={isChecked}
                              onChange={() => handleAnswer(block.id, opt.value)}
                            />
                            <span className="text-lg">{opt.label}</span>
                          </label>
                        )
                      })}
                    </div>
                  )}
                  {block.type === "dropdown" && (
                    <select
                      className={cn(
                        "w-full border px-4 py-4 text-xl transition outline-none",
                        iClass
                      )}
                      value={(answers[block.id] as string) || ""}
                      onChange={(e) => handleAnswer(block.id, e.target.value)}
                    >
                      <option value="">Select an option</option>
                      {(block.config?.options || []).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {block.type === "date_picker" && (
                    <input
                      type="date"
                      className={cn(
                        "w-full border px-4 py-4 text-xl transition outline-none",
                        iClass
                      )}
                      value={(answers[block.id] as string) || ""}
                      onChange={(e) => handleAnswer(block.id, e.target.value)}
                    />
                  )}
                  {block.type === "rating" && (
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className={cn(
                            "text-4xl transition-transform hover:scale-110",
                            (answers[block.id] as string) >= String(star)
                              ? "text-amber-400"
                              : "text-muted"
                          )}
                          onClick={() => handleAnswer(block.id, String(star))}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  )}
                  {block.type === "file_upload" && (
                    <div
                      className={cn(
                        "flex w-full flex-col items-center justify-center rounded-[12px] border-2 border-dashed p-8 text-center transition-all",
                        iClass,
                        answers[block.id] ? "border-primary bg-primary/5" : ""
                      )}
                    >
                      {answers[block.id] ? (
                        <div className="flex flex-col items-center gap-3">
                          <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-primary">
                            <span className="max-w-[200px] truncate font-medium">
                              {(answers[`${block.id}_filename`] as string) ||
                                "File uploaded"}
                            </span>
                            <button
                              onClick={() => {
                                handleAnswer(block.id, "")
                                handleAnswer(`${block.id}_filename`, "")
                              }}
                              className="ml-2 rounded-full p-1 hover:bg-primary/20"
                            >
                              <X className="size-4" />
                            </button>
                          </div>
                          <a
                            href={answers[block.id] as string}
                            target="_blank"
                            rel="noreferrer"
                            className="text-sm text-muted-foreground underline hover:text-primary"
                          >
                            View file
                          </a>
                        </div>
                      ) : uploading[block.id] ? (
                        <div className="flex flex-col items-center gap-2">
                          <Loader2 className="h-6 w-6 animate-spin text-primary" />
                          <p className="text-sm text-muted-foreground text-primary">
                            Uploading...
                          </p>
                        </div>
                      ) : (
                        <label className="flex cursor-pointer flex-col items-center gap-2">
                          <div className="rounded-full bg-muted p-3">
                            <Plus className="size-6 text-muted-foreground" />
                          </div>
                          <span className="font-medium">
                            Click to upload or drag and drop
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Maximum file size: 10MB
                          </span>
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              if (e.target.files?.[0])
                                handleFileUpload(block.id, e.target.files[0])
                            }}
                          />
                        </label>
                      )}
                    </div>
                  )}
                  {block.type === "upi_payment" && (
                    <div className="flex flex-col items-center space-y-6">
                      <div className="inline-block rounded-xl border border-border bg-white p-4 shadow-sm">
                        <QRCodeSVG
                          value={`upi://pay?pa=${block.config?.upiId}&pn=Merchant&am=${parseMentions(block.config?.upiAmount || "0")}&cu=INR`}
                          size={200}
                          level="Q"
                        />
                      </div>
                      <p className="text-sm font-medium">
                        Scan to pay{" "}
                        {parseMentions(block.config?.upiAmount || "0")} INR via
                        UPI
                      </p>

                      <div className="w-full space-y-4 border-t border-border pt-4">
                        <input
                          type="text"
                          className={cn(
                            "w-full border px-4 py-4 text-xl transition outline-none",
                            iClass
                          )}
                          placeholder="Transaction Reference ID"
                          value={(answers[block.id] as string) || ""}
                          onChange={(e) =>
                            handleAnswer(block.id, e.target.value)
                          }
                        />
                        <div
                          className={cn(
                            "flex w-full flex-col items-center justify-center rounded-[12px] border-2 border-dashed p-4 text-center",
                            iClass
                          )}
                        >
                          <p className="mb-2 text-sm font-medium">
                            Upload Payment Screenshot
                          </p>
                          {answers[block.id + "_img"] ? (
                            <a
                              href={answers[block.id + "_img"] as string}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm break-all text-primary underline"
                            >
                              View screenshot
                            </a>
                          ) : uploading[block.id + "_img"] ? (
                            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                          ) : (
                            <input
                              type="file"
                              accept="image/*"
                              onChange={(e) => {
                                if (e.target.files?.[0]) {
                                  handleFileUpload(
                                    block.id + "_img",
                                    e.target.files[0]
                                  )
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

            {validationError && (
              <p className="mb-4 animate-in text-sm font-medium text-destructive fade-in slide-in-from-top-1">
                {validationError}
              </p>
            )}

            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  onClick={handleBack}
                  variant="outline"
                  size="lg"
                  className="px-6 py-6"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              )}
              <Button
                onClick={handleNext}
                size="lg"
                className={cn("group flex-1 py-6 text-lg", bClass)}
              >
                {currentStep >= visibleBlocks.length - 1 ? "Review" : "Next"}
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>

            <p className="mt-6 flex items-center justify-center gap-1 text-center text-sm text-muted-foreground">
              Press{" "}
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground">
                Enter ↵
              </span>{" "}
              to continue
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
