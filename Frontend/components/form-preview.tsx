"use client"

import * as React from "react"
import { type FormRecord } from "@/lib/forms"
import { Button } from "@/components/ui/button"
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  CheckCircle2,
  X,
  Plus,
  Timer,
} from "lucide-react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { QRCodeSVG } from "qrcode.react"
import confetti from "canvas-confetti"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

function validateInput(value: any, block: any): string | null {
  if (block.config?.required) {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return `${block.label || "This field"} is required`
    }
  }
  return null
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

export function FormPreview({
  form,
  onClose,
}: {
  form: FormRecord
  onClose: () => void
}) {
  const [answers, setAnswers] = React.useState<Record<string, any>>({})
  const [currentStep, setCurrentStep] = React.useState(0)
  const [isSubmitted, setIsSubmitted] = React.useState(false)
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null)
  const [score, setScore] = React.useState(0)
  const [validationError, setValidationError] = React.useState<string | null>(null)

  const blocks = form.schema_snapshot?.blocks ?? []
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

  const visibleBlocks = React.useMemo(
    () => blocks.filter((b) => evaluateLogic(b)),
    [blocks, evaluateLogic]
  )

  const handleNext = React.useCallback(() => {
    const block = visibleBlocks[currentStep]
    if (block) {
      const error = validateInput(answers[block.id], block)
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
    if (!form.is_quiz) return
    const block = visibleBlocks[currentStep]
    if (block && block.config?.timerSeconds) {
      setTimeLeft(block.config.timerSeconds)
    } else {
      setTimeLeft(null)
    }
  }, [currentStep, form.is_quiz, visibleBlocks])

  const theme = (form.theme || "minimal") as keyof typeof themeClasses
  const tClass = themeClasses[theme] || themeClasses.minimal
  const bClass = buttonClasses[theme] || buttonClasses.minimal
  const iClass = inputClasses[theme] || inputClasses.minimal

  const isSummaryStep = currentStep >= visibleBlocks.length

  const handleBack = React.useCallback(() => {
    if (currentStep > 0) setCurrentStep((s) => s - 1)
  }, [currentStep])

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

  const handleAnswer = (blockId: string, value: any) => {
    setAnswers((prev) => ({ ...prev, [blockId]: value }))
  }

  const submitForm = () => {
    let finalScore = 0
    if (form.is_quiz) {
      visibleBlocks.forEach((block) => {
        const correct = block.config?.correctAnswer
        if (correct) {
          const ans = answers[block.id]
          if (String(ans).toLowerCase() === String(correct).toLowerCase()) {
            finalScore += block.config.points || 0
          }
        }
      })
    }
    setScore(finalScore)
    setIsSubmitted(true)
    confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })

    if (form.redirect_url) {
      setTimeout(() => {
        alert(`Redirecting to: ${form.redirect_url}`)
        onClose()
      }, 2000)
    }
  }

  if (isSubmitted) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-[100] flex flex-col items-center justify-center p-6",
          tClass
        )}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 hover:bg-black/5"
        >
          <X className="size-6" />
        </button>
        <div className="w-full max-w-md rounded-[16px] border border-inherit bg-inherit p-8 text-center text-inherit shadow-sm">
          <CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-emerald-500" />
          <h1 className="mb-2 text-2xl font-bold">
            {form.is_quiz ? "Quiz Completed" : "Preview Submission"}
          </h1>
          <p className="mb-4 text-muted-foreground">
            Thank you for filling out {form.name}.
          </p>

          {form.is_quiz && (
            <div className="mb-8 rounded-xl bg-primary/5 p-6">
              <p className="text-sm font-black uppercase tracking-widest text-primary/60">
                Your Final Score
              </p>
              <div className="mt-1 text-5xl font-black text-primary">
                {score}
                <span className="text-xl text-primary/40">
                  {" "}
                  /{" "}
                  {visibleBlocks.reduce(
                    (acc, b) => acc + (b.config?.points || 0),
                    0
                  )}
                </span>
              </div>
            </div>
          )}

          <Button onClick={onClose} className={cn("w-full py-6 text-lg", bClass)}>
            Close Preview
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div
      className={cn(
        "form-root fixed inset-0 z-[100] flex flex-col items-center justify-center p-4 transition-colors duration-300 md:p-8",
        tClass
      )}
    >
      {form.custom_css && <style>{form.custom_css}</style>}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-[110] rounded-full p-2 hover:bg-black/5"
      >
        <X className="size-6" />
      </button>

      <div className="relative w-full max-w-2xl rounded-[20px] border border-inherit bg-inherit p-6 text-inherit shadow-2xl md:p-10">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 rounded-full bg-primary px-4 py-1 text-xs font-bold tracking-widest text-primary-foreground uppercase shadow-sm">
          Preview Mode
        </div>

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

        {timeLeft !== null && !isSummaryStep && (
          <div className="mb-6 flex justify-center">
            <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2 font-mono text-xl font-black text-primary shadow-sm ring-4 ring-primary/5 animate-pulse">
              <Timer className="size-5" />
              {Math.floor(timeLeft / 60)}:
              {(timeLeft % 60).toString().padStart(2, "0")}
            </div>
          </div>
        )}

        {isSummaryStep ? (
          <div className="animate-in duration-500 fade-in slide-in-from-bottom-4">
            <h2 className="mb-6 text-3xl font-bold">Review your answers</h2>
            <div className="mb-8 max-h-[40vh] space-y-6 overflow-y-auto pr-2">
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
                className={cn("flex-1 py-6 text-lg", bClass)}
              >
                Submit
              </Button>
            </div>
          </div>
        ) : (
          <div
            key={currentStep}
            className="relative animate-in duration-500 fade-in slide-in-from-right-8"
          >
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
                      value={answers[block.id] || ""}
                      onChange={(e) => handleAnswer(block.id, e.target.value)}
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
                      value={answers[block.id] || ""}
                      onChange={(e) => handleAnswer(block.id, e.target.value)}
                    />
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
                              {answers[`${block.id}_filename`] ||
                                "demo-file.pdf"}
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
                        </div>
                      ) : (
                        <label
                          className="flex cursor-pointer flex-col items-center gap-2"
                          onClick={() => {
                            handleAnswer(block.id, "https://example.com/file")
                            handleAnswer(
                              `${block.id}_filename`,
                              "preview-sample.pdf"
                            )
                          }}
                        >
                          <div className="rounded-full bg-muted p-3">
                            <Plus className="size-6 text-muted-foreground" />
                          </div>
                          <span className="text-sm font-medium">
                            Click to simulate upload
                          </span>
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
                          placeholder="Enter Transaction ID / UTR"
                          value={answers[block.id] || ""}
                          onChange={(e) =>
                            handleAnswer(block.id, e.target.value)
                          }
                        />
                        <p className="text-center text-xs text-muted-foreground">
                          Enter the transaction ID after completing the payment
                        </p>
                      </div>
                    </div>
                  )}

                  {[
                    "checkbox",
                    "multiple_choice",
                    "dropdown",
                    "date_picker",
                    "rating",
                  ].includes(block.type) && (
                    <div className="rounded-xl border-2 border-dashed border-muted p-8 text-center text-muted-foreground">
                      {block.type.replace("_", " ")} input preview
                    </div>
                  )}
                </div>
              )
            })()}

            {validationError && (
              <p className="mb-4 text-center text-sm font-bold text-destructive animate-in fade-in slide-in-from-top-1">
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
          </div>
        )}
      </div>
    </div>
  )
}
