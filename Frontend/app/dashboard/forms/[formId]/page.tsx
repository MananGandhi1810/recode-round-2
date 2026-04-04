"use client"

import * as React from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Check,
  FilePlus2,
  Loader2,
  MousePointer2,
  Trash2,
  Users,
  GripVertical,
  Plus,
  Settings2,
  Component,
  List,
  Eye,
  Route,
  Copy,
  X,
  Sparkles,
  Timer,
  Download,
  Maximize2,
  FileSpreadsheet,
  CheckCircle2,
  LayoutGrid,
  Calendar,
  Star,
  Upload,
  CreditCard,
  Palette,
  Send,
} from "lucide-react"
import toast from "react-hot-toast"

import { SendWhatsappFormModal } from "@/components/SendWhatsappFormModal"

import {
  DndContext,
  useDroppable,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDraggable,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { ThemeToggle } from "@/components/theme-toggle"
import { FormPreview } from "@/components/form-preview"
import { cn } from "@/lib/utils"
import { apiFetch } from "@/lib/api"
import {
  applyFormEvent,
  type FormBlock,
  type FormEventPayload,
  type FormRecord,
  getWsBaseUrl,
  type LogicRule,
  type LogicCondition,
  type FormSubmissionRecord,
} from "@/lib/forms"

type PresenceUser = {
  userId: string
  label: string
  initials: string
  color: string
}

type SubmissionScoreUpdate = {
  id: string
  score: number
  answers: Record<string, string | string[]>
  submitted_at: string // ISO format string
}

type WsIncoming =
  | { type: "PRESENCE_SNAPSHOT"; users: PresenceUser[] }
  | { type: "CURSOR_JOIN"; user: PresenceUser }
  | { type: "CURSOR_LEAVE"; userId: string }
  | { type: "CURSOR_MOVE"; userId: string; x: number; y: number }
  | { type: "EVENT_APPLIED"; formEvent: FormEventPayload; actor?: any }
  | { type: "FORM_EVENT"; payload: FormEventPayload }
  | { type: "SCORE_UPDATE"; submission: SubmissionScoreUpdate }
  | { type: "ERROR"; message: string }

function DroppableCanvas({ children }: { children: React.ReactNode }) {
  const { setNodeRef } = useDroppable({ id: "canvas-root" })
  return (
    <div ref={setNodeRef} className="mt-4 space-y-3 pb-8" id="canvas">
      {children}
    </div>
  )
}

function DraggableSidebarItem({
  type,
  label,
  icon: Icon,
}: {
  type: string
  label: string
  icon: React.ElementType
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `new-${type}`,
    data: { type, isNew: true },
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={cn(
        "flex cursor-grab items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-sm font-bold transition-all hover:scale-[1.02] hover:border-primary/50 hover:bg-primary/5 active:scale-95",
        isDragging && "opacity-50 shadow-none grayscale"
      )}
    >
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-muted-foreground transition-colors group-hover:bg-primary/10 group-hover:text-primary">
        <Icon className="h-4 w-4" />
      </div>
      {label}
    </div>
  )
}

function BlockItem({
  block,
  allBlocks,
  isQuiz,
  addBlockBase,
  onChange,
  onBlur,
  onRemove,
}: {
  block: FormBlock
  allBlocks: FormBlock[]
  isQuiz: boolean
  addBlockBase: (index: number) => void
  onChange: (id: string, updater: (b: FormBlock) => FormBlock) => void
  onBlur: (id: string) => void
  onRemove: (id: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const [showLogic, setShowLogic] = React.useState(false)
  const [showConfig, setShowConfig] = React.useState(false)

  const handleLabelKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      addBlockBase(allBlocks.findIndex((b) => b.id === block.id) + 1)
    }
  }

  const addLogicRule = () => {
    onChange(block.id, (b) => {
      const currentLogic = b.config.logic || []
      const newRule: LogicRule = {
        id: crypto.randomUUID(),
        action: "show",
        conditionMatch: "all",
        conditions: [{ blockId: "", operator: "equals", value: "" }],
      }
      return {
        ...b,
        config: { ...b.config, logic: [...currentLogic, newRule] },
      }
    })
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative z-10 flex items-start bg-transparent py-2"
    >
      <div className="absolute -left-14 hidden w-12 items-center justify-end pt-2 pr-2 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
        <button
          type="button"
          onClick={() =>
            addBlockBase(allBlocks.findIndex((b) => b.id === block.id) + 1)
          }
          className="rounded-full p-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-full p-2 text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </div>

      <div className="w-full rounded-2xl border border-border bg-background p-5 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
        <div className="mb-4 flex items-center gap-3">
          <select
            value={block.type}
            onChange={(e) =>
              onChange(block.id, (b) => ({ ...b, type: e.target.value }))
            }
            onBlur={() => onBlur(block.id)}
            className="rounded-lg border-0 bg-muted px-2 py-1 text-[10px] font-black tracking-widest text-muted-foreground uppercase ring-primary/20 transition-all outline-none focus:ring-2"
          >
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="paragraph">Paragraph</option>
            <option value="short_text">Short Text</option>
            <option value="long_text">Long Text</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="checkbox">Checkbox</option>
            <option value="dropdown">Dropdown</option>
            <option value="date_picker">Date Picker</option>
            <option value="rating">Rating</option>
            <option value="file_upload">File Upload</option>
            <option value="upi_payment">UPI Payment</option>
          </select>
          <div className="flex-1" />
          <span className="mr-2 rounded-full bg-muted/50 px-2 py-0.5 font-mono text-[9px] font-black tracking-tighter text-muted-foreground">
            #{block.id}
          </span>
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className={cn(
              "rounded-full p-2 transition-all",
              showConfig
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowLogic(!showLogic)}
            className={cn(
              "rounded-full p-2 transition-all",
              showLogic
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            <Route className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(block.id)}
            className="rounded-full p-2 text-muted-foreground transition-all hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="relative">
          <input
            value={block.label}
            onChange={(e) =>
              onChange(block.id, (b) => ({ ...b, label: e.target.value }))
            }
            onBlur={() => onBlur(block.id)}
            onKeyDown={handleLabelKeyDown}
            placeholder={
              block.type.startsWith("h")
                ? "Heading..."
                : block.type === "paragraph"
                  ? "Type something..."
                  : "Question..."
            }
            className={`w-full border-0 bg-transparent px-0 py-1 outline-none placeholder:text-muted-foreground/30 focus:ring-0 ${
              block.type === "h1"
                ? "text-3xl font-black tracking-tight"
                : block.type === "h2"
                  ? "text-xl font-bold tracking-tight"
                  : "text-base font-semibold"
            }`}
          />
        </div>

        {/* Render interactive parts if input */}
        {(block.type === "short_text" || block.type === "long_text") && (
          <div className="mt-4 space-y-3">
            <p className="flex items-center gap-2 text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              <span className="inline-block size-1 rounded-full bg-primary" />
              Dynamic Reference Hint: Type @ or use {"{{"}
              {block.id}
              {"}}"}
            </p>
            {block.type === "short_text" ? (
              <input
                disabled
                className="w-full rounded-xl border border-input bg-muted/20 px-4 py-3 text-sm text-muted-foreground/50 italic"
                placeholder={
                  block.config.placeholder || "Type your answer here..."
                }
              />
            ) : (
              <textarea
                disabled
                rows={3}
                className="w-full resize-none rounded-xl border border-input bg-muted/20 px-4 py-3 text-sm text-muted-foreground/50 italic"
                placeholder={
                  block.config.placeholder || "Type your answer here..."
                }
              />
            )}
          </div>
        )}

        {(block.type === "checkbox" ||
          block.type === "multiple_choice" ||
          block.type === "dropdown") && (
          <div className="mt-4 space-y-2">
            {(
              block.config.options || [{ label: "Option 1", value: "opt1" }]
            ).map((opt, i) => (
              <div key={i} className="group/opt flex items-center gap-3">
                <div
                  className={cn(
                    "h-5 w-5 border-2 border-muted bg-muted/20 transition-colors group-hover/opt:border-primary/30",
                    block.type === "checkbox" ? "rounded-lg" : "rounded-full"
                  )}
                />
                <input
                  value={opt.label}
                  onChange={(e) => {
                    onChange(block.id, (b) => {
                      const newOpts = [...(b.config.options || [])]
                      newOpts[i] = {
                        label: e.target.value,
                        value: e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]/g, ""),
                      }
                      return { ...b, config: { ...b.config, options: newOpts } }
                    })
                  }}
                  onBlur={() => onBlur(block.id)}
                  className="flex-1 border-0 bg-transparent py-1 text-sm font-medium outline-none placeholder:text-muted-foreground/30"
                  placeholder="Option label"
                />
              </div>
            ))}
            <button
              onClick={() => {
                onChange(block.id, (b) => {
                  const newOpts = [
                    ...(b.config.options || []),
                    {
                      label: `Option ${(b.config.options?.length || 0) + 1}`,
                      value: `opt${(b.config.options?.length || 0) + 1}`,
                    },
                  ]
                  return { ...b, config: { ...b.config, options: newOpts } }
                })
                onBlur(block.id)
              }}
              className="ml-8 pt-2 text-[10px] font-black tracking-widest text-primary uppercase transition-colors hover:text-primary/80"
            >
              + Add Choice
            </button>
          </div>
        )}

        {showConfig && (
          <div className="mt-6 animate-in space-y-5 rounded-2xl border border-border bg-muted/30 p-5 duration-200 zoom-in-95 fade-in">
            <h4 className="border-b border-border pb-2 text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
              Configuration
            </h4>
            <div className="grid gap-6 md:grid-cols-2">
              <label className="group flex cursor-pointer items-center gap-3">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    checked={block.config.required}
                    onChange={(e) =>
                      onChange(block.id, (b) => ({
                        ...b,
                        config: { ...b.config, required: e.target.checked },
                      }))
                    }
                    onBlur={() => onBlur(block.id)}
                    className="h-5 w-5 rounded-md border-2 border-muted-foreground/20 accent-primary"
                  />
                </div>
                <span className="text-xs font-bold text-foreground/80">
                  Required Field
                </span>
              </label>

              {(block.type === "short_text" || block.type === "long_text") && (
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-muted-foreground uppercase">
                    Validation
                  </label>
                  <select
                    value={block.config.validationType || ""}
                    onChange={(e) =>
                      onChange(block.id, (b) => ({
                        ...b,
                        config: {
                          ...b.config,
                          validationType: e.target.value || null,
                        },
                      }))
                    }
                    onBlur={() => onBlur(block.id)}
                    className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
                  >
                    <option value="">None</option>
                    <option value="email">Email Address</option>
                    <option value="number">Numeric Only</option>
                    <option value="url">Valid URL</option>
                  </select>
                </div>
              )}

              {(block.type === "short_text" || block.type === "long_text") && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase">
                      Min Length
                    </label>
                    <input
                      type="number"
                      value={block.config.minLength || ""}
                      onChange={(e) =>
                        onChange(block.id, (b) => ({
                          ...b,
                          config: {
                            ...b.config,
                            minLength: parseInt(e.target.value) || null,
                          },
                        }))
                      }
                      onBlur={() => onBlur(block.id)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-muted-foreground uppercase">
                      Max Length
                    </label>
                    <input
                      type="number"
                      value={block.config.maxLength || ""}
                      onChange={(e) =>
                        onChange(block.id, (b) => ({
                          ...b,
                          config: {
                            ...b.config,
                            maxLength: parseInt(e.target.value) || null,
                          },
                        }))
                      }
                      onBlur={() => onBlur(block.id)}
                      className="w-full rounded-xl border border-border bg-background px-3 py-2 text-xs font-bold outline-none"
                      placeholder="∞"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {isQuiz &&
          !block.type.startsWith("h") &&
          block.type !== "paragraph" && (
            <div className="mt-6 flex animate-in flex-wrap items-center gap-4 rounded-2xl border-2 border-emerald-500/10 bg-emerald-500/5 p-4 slide-in-from-top-2">
              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-background px-3 py-2">
                <Sparkles className="size-4 text-emerald-500" />
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black tracking-widest text-emerald-600 uppercase">
                    Points
                  </p>
                  <input
                    type="number"
                    value={block.config.points || 1}
                    onChange={(e) =>
                      onChange(block.id, (b) => ({
                        ...b,
                        config: {
                          ...b.config,
                          points: parseInt(e.target.value) || 0,
                        },
                      }))
                    }
                    onBlur={() => onBlur(block.id)}
                    className="w-12 bg-transparent text-sm font-black text-emerald-950 outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 rounded-xl border border-emerald-500/20 bg-background px-3 py-2">
                <Timer className="size-4 text-emerald-500" />
                <div className="space-y-0.5">
                  <p className="text-[8px] font-black tracking-widest text-emerald-600 uppercase">
                    Time (sec)
                  </p>
                  <input
                    type="number"
                    placeholder="∞"
                    value={block.config.timerSeconds || ""}
                    onChange={(e) =>
                      onChange(block.id, (b) => ({
                        ...b,
                        config: {
                          ...b.config,
                          timerSeconds: parseInt(e.target.value) || null,
                        },
                      }))
                    }
                    onBlur={() => onBlur(block.id)}
                    className="w-12 bg-transparent text-sm font-black text-emerald-950 outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-1 items-center gap-3 rounded-xl border border-emerald-500/20 bg-background px-4 py-2">
                <CheckCircle2 className="size-4 text-emerald-500" />
                <div className="flex-1 space-y-0.5">
                  <p className="text-[8px] font-black tracking-widest text-emerald-600 uppercase">
                    Correct Answer
                  </p>
                  <input
                    type="text"
                    placeholder="Type the exact answer..."
                    value={block.config.correctAnswer || ""}
                    onChange={(e) =>
                      onChange(block.id, (b) => ({
                        ...b,
                        config: { ...b.config, correctAnswer: e.target.value },
                      }))
                    }
                    onBlur={() => onBlur(block.id)}
                    className="w-full bg-transparent text-sm font-bold text-emerald-950 outline-none placeholder:text-emerald-900/20"
                  />
                </div>
              </div>
            </div>
          )}

        {showLogic && (
          <div className="mt-6 animate-in rounded-2xl border border-border bg-card p-5 duration-200 zoom-in-95 fade-in">
            <div className="mb-4 flex items-center justify-between">
              <h4 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
                Conditional Logic
              </h4>
              <button
                type="button"
                onClick={addLogicRule}
                className="rounded-full bg-primary/10 px-3 py-1.5 text-[10px] font-black tracking-widest text-primary uppercase transition-all hover:bg-primary hover:text-primary-foreground"
              >
                + New Rule
              </button>
            </div>
            <div className="space-y-4">
              {(block.config.logic || []).map((rule: any, ruleIdx: number) => (
                <div
                  key={rule.id}
                  className="group/rule relative rounded-xl border border-border/50 bg-muted/20 p-4"
                >
                  <div className="mb-4 flex flex-wrap items-center gap-3 text-xs font-bold">
                    <select
                      value={rule.action}
                      onChange={(e) =>
                        onChange(block.id, (b) => {
                          const next = [...(b.config.logic || [])]
                          next[ruleIdx] = {
                            ...next[ruleIdx],
                            action: e.target.value as "show" | "hide",
                          }
                          return { ...b, config: { ...b.config, logic: next } }
                        })
                      }
                      className="h-8 rounded-lg border border-border bg-background px-3 outline-none"
                    >
                      <option value="show">Show Block</option>
                      <option value="hide">Hide Block</option>
                    </select>
                    <span className="text-[9px] tracking-widest text-muted-foreground uppercase">
                      if
                    </span>
                    <select
                      value={rule.conditionMatch}
                      onChange={(e) =>
                        onChange(block.id, (b) => {
                          const next = [...(b.config.logic || [])]
                          next[ruleIdx] = {
                            ...next[ruleIdx],
                            conditionMatch: e.target.value as "all" | "any",
                          }
                          return { ...b, config: { ...b.config, logic: next } }
                        })
                      }
                      className="h-8 rounded-lg border border-border bg-background px-3 outline-none"
                    >
                      <option value="all">ALL Conditions</option>
                      <option value="any">ANY Condition</option>
                    </select>
                    <div className="flex-1" />
                    <button
                      onClick={() =>
                        onChange(block.id, (b) => {
                          const next = (b.config.logic || []).filter(
                            (r: any) => r.id !== rule.id
                          )
                          return { ...b, config: { ...b.config, logic: next } }
                        })
                      }
                      className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="space-y-3">
                    {rule.conditions.map((cond: any, condIdx: number) => (
                      <div
                        key={condIdx}
                        className="flex flex-wrap items-center gap-3"
                      >
                        <select
                          value={cond.blockId}
                          onChange={(e) =>
                            onChange(block.id, (b) => {
                              const next = [...(b.config.logic || [])]
                              const nextConds = [...next[ruleIdx].conditions]
                              nextConds[condIdx] = {
                                ...nextConds[condIdx],
                                blockId: e.target.value,
                              }
                              next[ruleIdx] = {
                                ...next[ruleIdx],
                                conditions: nextConds,
                              }
                              return {
                                ...b,
                                config: { ...b.config, logic: next },
                              }
                            })
                          }
                          className="h-9 min-w-[150px] flex-1 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none"
                        >
                          <option value="">Select Target...</option>
                          {allBlocks
                            .filter((cand) => cand.id !== block.id)
                            .map((cand) => (
                              <option key={cand.id} value={cand.id}>
                                {cand.label || cand.type}
                              </option>
                            ))}
                        </select>
                        {(() => {
                          const targetBlock = allBlocks.find(
                            (b) => b.id === cond.blockId
                          )
                          const tType = targetBlock?.type || "short_text"
                          const tValType = targetBlock?.config?.validationType

                          let options = [
                            <option key="equals" value="equals">
                              equals
                            </option>,
                            <option key="not_equals" value="not_equals">
                              not equals
                            </option>,
                            <option key="contains" value="contains">
                              contains
                            </option>,
                            <option key="is_empty" value="is_empty">
                              is empty
                            </option>,
                            <option key="is_not_empty" value="is_not_empty">
                              is not empty
                            </option>,
                          ]

                          if (
                            tType === "checkbox" ||
                            tType === "multiple_choice"
                          ) {
                            options = [
                              <option key="equals" value="equals">
                                is selected
                              </option>,
                              <option key="contains" value="contains">
                                contains
                              </option>,
                              <option key="is_empty" value="is_empty">
                                is empty
                              </option>,
                              <option key="is_not_empty" value="is_not_empty">
                                is not empty
                              </option>,
                            ]
                          } else if (
                            tType === "short_text" &&
                            tValType === "number"
                          ) {
                            options = [
                              <option key="equals" value="equals">
                                equals
                              </option>,
                              <option key="not_equals" value="not_equals">
                                not equals
                              </option>,
                              <option key="greater_than" value="greater_than">
                                greater than
                              </option>,
                              <option key="less_than" value="less_than">
                                less than
                              </option>,
                              <option key="is_empty" value="is_empty">
                                is empty
                              </option>,
                              <option key="is_not_empty" value="is_not_empty">
                                is not empty
                              </option>,
                            ]
                          }

                          return (
                            <select
                              value={cond.operator}
                              onChange={(e) =>
                                onChange(block.id, (b) => {
                                  const next = [...(b.config.logic || [])]
                                  const nextConds = [
                                    ...next[ruleIdx].conditions,
                                  ]
                                  nextConds[condIdx] = {
                                    ...nextConds[condIdx],
                                    operator: e.target.value as any,
                                  }
                                  next[ruleIdx] = {
                                    ...next[ruleIdx],
                                    conditions: nextConds,
                                  }
                                  return {
                                    ...b,
                                    config: { ...b.config, logic: next },
                                  }
                                })
                              }
                              className="h-9 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none"
                            >
                              {options}
                            </select>
                          )
                        })()}
                        {cond.operator !== "is_empty" &&
                          cond.operator !== "is_not_empty" && (
                            <input
                              type="text"
                              value={cond.value}
                              onChange={(e) =>
                                onChange(block.id, (b) => {
                                  const next = [...(b.config.logic || [])]
                                  const nextConds = [
                                    ...next[ruleIdx].conditions,
                                  ]
                                  nextConds[condIdx] = {
                                    ...nextConds[condIdx],
                                    value: e.target.value,
                                  }
                                  next[ruleIdx] = {
                                    ...next[ruleIdx],
                                    conditions: nextConds,
                                  }
                                  return {
                                    ...b,
                                    config: { ...b.config, logic: next },
                                  }
                                })
                              }
                              placeholder="Match value..."
                              className="h-9 min-w-[100px] flex-1 rounded-xl border border-border bg-background px-3 text-xs font-bold outline-none"
                            />
                          )}
                        {rule.conditions.length > 1 && (
                          <button
                            onClick={() =>
                              onChange(block.id, (b) => {
                                const next = [...(b.config.logic || [])]
                                const nextConds = next[
                                  ruleIdx
                                ].conditions.filter(
                                  (_: any, i: number) => i !== condIdx
                                )
                                next[ruleIdx] = {
                                  ...next[ruleIdx],
                                  conditions: nextConds,
                                }
                                return {
                                  ...b,
                                  config: { ...b.config, logic: next },
                                }
                              })
                            }
                            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={() =>
                        onChange(block.id, (b) => {
                          const next = [...(b.config.logic || [])]
                          const nextConds = [
                            ...next[ruleIdx].conditions,
                            {
                              blockId: "",
                              operator: "equals" as const,
                              value: "",
                            },
                          ]
                          next[ruleIdx] = {
                            ...next[ruleIdx],
                            conditions: nextConds,
                          }
                          return { ...b, config: { ...b.config, logic: next } }
                        })
                      }
                      className="ml-1 text-[9px] font-black tracking-widest text-primary uppercase hover:underline"
                    >
                      + Add condition
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function FormEditorPage() {
  const params = useParams<{ formId: string }>()
  const formId = params.formId
  const router = useRouter()

  const [form, setForm] = React.useState<FormRecord | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [presence, setPresence] = React.useState<PresenceUser[]>([])
  const [cursors, setCursors] = React.useState<
    Record<string, { x: number; y: number }>
  >({})

  const canvasRef = React.useRef<HTMLDivElement | null>(null)

  const [nameDraft, setNameDraft] = React.useState("")
  const [descriptionDraft, setDescriptionDraft] = React.useState("")
  const [publishedDraft, setPublishedDraft] = React.useState(false)
  const [themeDraft, setThemeDraft] = React.useState("minimal")
  const [slugDraft, setSlugDraft] = React.useState("")
  const [redirectUrlDraft, setRedirectUrlDraft] = React.useState("")
  const [isQuizDraft, setIsQuizDraft] = React.useState(false)
  const [leaderboard, setLeaderboard] = React.useState<any[]>([])
  const [expiresAtDraft, setExpiresAtDraft] = React.useState("")
  const [activeTab, setActiveTab] = React.useState<
    "editor" | "submissions" | "leaderboard"
  >("editor")
  const [sidebarTab, setSidebarTab] = React.useState<"setup" | "ai" | "theme">(
    "setup"
  )
  const [isPreview, setIsPreview] = React.useState(false)
  const [isPresentation, setIsPresentation] = React.useState(false)
  const [submissions, setSubmissions] = React.useState<any[]>([])
  const [subsLoading, setSubsLoading] = React.useState(false)
  const [isCopied, setIsCopied] = React.useState(false)
  const [socketConnected, setSocketConnected] = React.useState(false)
  const [aiPrompt, setAiPrompt] = React.useState("")
  const [isGeneratingAi, setIsGeneratingAi] = React.useState(false)
  const [customCss, setCustomCss] = React.useState("")
  const [inspectSubmission, setInspectSubmission] = React.useState<any | null>(
    null
  )

  const socketRef = React.useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const blocks = form?.schema_snapshot.blocks ?? []

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const loadSubmissions = React.useCallback(async () => {
    setSubsLoading(true)
    try {
      const data = await apiFetch<any[]>(`/forms/${formId}/submissions`)
      setSubmissions(data)
    } catch (e) {
      console.error("Failed to load submissions", e)
    } finally {
      setSubsLoading(false)
    }
  }, [formId])

  React.useEffect(() => {
    if (activeTab === "submissions") {
      void loadSubmissions()
    }
  }, [activeTab, loadSubmissions])

  const exportCsv = () => {
    const API_BASE =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
    window.open(`${API_BASE}/forms/${formId}/export/csv`, "_blank")
  }

  const deleteForm = async () => {
    if (!confirm("Are you sure? This cannot be undone.")) return
    try {
      await apiFetch(`/forms/${formId}`, { method: "DELETE" })
      router.push("/dashboard")
    } catch (e) {
      alert("Failed to delete")
    }
  }

  const copyPublicUrl = () => {
    const baseUrl = window.location.origin
    const url = form?.slug
      ? `${baseUrl}/${form.organization_slug}/${form.slug}`
      : `${baseUrl}/f/${form?.id}`
    navigator.clipboard.writeText(url)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const hydrateForm = React.useCallback((nextForm: FormRecord) => {
    setForm(nextForm)
    setNameDraft(nextForm.name)
    setDescriptionDraft(nextForm.description ?? "")
    setPublishedDraft(nextForm.is_published)
    setThemeDraft(nextForm.theme || "minimal")
    setSlugDraft(nextForm.slug || "")
    setRedirectUrlDraft(nextForm.redirect_url || "")
    setIsQuizDraft(nextForm.is_quiz || false)
    setExpiresAtDraft(
      nextForm.expires_at
        ? new Date(nextForm.expires_at).toISOString().slice(0, 16)
        : ""
    )
  }, [])

  const loadForm = React.useCallback(async () => {
    try {
      const nextForm = await apiFetch<FormRecord>(`/forms/${formId}`)
      hydrateForm(nextForm)
      setError(null)
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Could not load form"
      )
    } finally {
      setLoading(false)
    }
  }, [formId, hydrateForm])

  React.useEffect(() => {
    void loadForm()
  }, [loadForm])

  const connectWebSocket = React.useCallback(() => {
    if (!formId) return
    if (socketRef.current) socketRef.current.close()
    const ws = new WebSocket(`${getWsBaseUrl()}/forms/${formId}/ws`)
    socketRef.current = ws
    ws.onopen = () => {
      setSocketConnected(true)
      setError(null)
    }
    ws.onclose = () => {
      setSocketConnected(false)
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 3000)
    }
    ws.onerror = () => ws.close()
    ws.onmessage = (event) => {
      const incoming = JSON.parse(event.data) as WsIncoming
      if (incoming.type === "PRESENCE_SNAPSHOT") setPresence(incoming.users)
      else if (incoming.type === "CURSOR_JOIN")
        setPresence((current) => [
          ...current.filter((u) => u.userId !== incoming.user.userId),
          incoming.user,
        ])
      else if (incoming.type === "CURSOR_LEAVE")
        setPresence((current) =>
          current.filter((u) => u.userId !== incoming.userId)
        )
      else if (incoming.type === "CURSOR_MOVE")
        setCursors((curr) => ({
          ...curr,
          [incoming.userId]: { x: incoming.x, y: incoming.y },
        }))
      else if (incoming.type === "EVENT_APPLIED")
        setForm((curr) =>
          curr
            ? {
                ...curr,
                schema_snapshot: applyFormEvent(
                  curr.schema_snapshot,
                  incoming.formEvent
                ),
              }
            : curr
        )
      else if (incoming.type === "SCORE_UPDATE")
        setLeaderboard((curr) =>
          [
            ...curr.filter((s) => s.id !== incoming.submission.id),
            incoming.submission,
          ].sort((a, b) => b.score - a.score)
        )
    }
  }, [formId])

  React.useEffect(() => {
    connectWebSocket()
    return () => {
      socketRef.current?.close()
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    }
  }, [connectWebSocket])

  const persistEvent = async (event: FormEventPayload) => {
    setForm((curr) =>
      curr
        ? {
            ...curr,
            schema_snapshot: applyFormEvent(curr.schema_snapshot, event),
          }
        : curr
    )
    try {
      await apiFetch(`/forms/${formId}/events`, {
        method: "POST",
        body: JSON.stringify(event),
      })
    } catch (e) {
      console.error(e)
    }
  }

  const blockSaveTimers = React.useRef<Record<string, NodeJS.Timeout>>({})
  const onBlockChange = React.useCallback(
    (id: string, updater: (b: FormBlock) => FormBlock) => {
      setForm((curr) => {
        if (!curr) return curr
        const newBlocks = curr.schema_snapshot.blocks.map((b) =>
          b.id === id ? updater(b) : b
        )
        const updatedBlock = newBlocks.find((b) => b.id === id)
        if (updatedBlock) {
          if (blockSaveTimers.current[id])
            clearTimeout(blockSaveTimers.current[id])
          blockSaveTimers.current[id] = setTimeout(() => {
            persistEvent({
              event_type: "UPDATE_BLOCK",
              payload: { id, block: updatedBlock },
            })
          }, 500)
        }
        return { ...curr, schema_snapshot: { blocks: newBlocks } }
      })
    },
    [persistEvent]
  )

  const persistBlock = React.useCallback(
    async (id: string) => {
      const block = form?.schema_snapshot.blocks.find((b) => b.id === id)
      if (block)
        await persistEvent({
          event_type: "UPDATE_BLOCK",
          payload: { id, block },
        })
    },
    [form, persistEvent]
  )

  const saveMeta = React.useCallback(async () => {
    const eventPayload: FormEventPayload = {
      event_type: "UPDATE_FORM_META",
      payload: {
        name: nameDraft,
        description: descriptionDraft || null,
        is_published: publishedDraft,
        theme: themeDraft,
        slug: slugDraft,
        redirect_url: redirectUrlDraft || null,
        is_quiz: isQuizDraft,
        custom_css: customCss || null,
        expires_at: expiresAtDraft
          ? new Date(expiresAtDraft).toISOString()
          : null,
      },
    }
    await persistEvent(eventPayload)
    toast.success("Saved!")
  }, [
    nameDraft,
    descriptionDraft,
    publishedDraft,
    themeDraft,
    slugDraft,
    redirectUrlDraft,
    isQuizDraft,
    expiresAtDraft,
    persistEvent,
  ])

  const pushCursor = React.useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current || !socketRef.current || !socketConnected) return
      const rect = canvasRef.current.getBoundingClientRect()
      socketRef.current.send(
        JSON.stringify({
          type: "CURSOR_MOVE",
          x: e.clientX - rect.left,
          y: e.clientY - rect.top,
        })
      )
    },
    [socketConnected]
  )

  const addBlock = async (index?: number) => {
    const newBlock: FormBlock = {
      id: `q_${Math.random().toString(36).substring(2, 7)}`,
      type: "short_text",
      label: "",
      config: { required: false },
    }
    await persistEvent({
      event_type: "ADD_BLOCK",
      payload: { block: newBlock, index },
    })
  }

  const removeBlock = async (id: string) => {
    await persistEvent({ event_type: "REMOVE_BLOCK", payload: { id } })
  }

  const handleDragStart = (event: DragStartEvent) =>
    setActiveId(event.active.id as string)
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)
    if (over && active.id !== over.id) {
      if (active.data?.current?.isNew) {
        const newBlock = {
          id: `q_${Math.random().toString(36).substring(2, 7)}`,
          type: active.data.current.type as string,
          label: "",
          config: { required: false },
        }
        const overIndex = blocks.findIndex((b) => b.id === over.id)
        await persistEvent({
          event_type: "ADD_BLOCK",
          payload: {
            block: newBlock,
            index: overIndex !== -1 ? overIndex : blocks.length,
          },
        })
      } else {
        const oldIndex = blocks.findIndex((b) => b.id === active.id)
        const newIndex =
          over.id === "canvas-root"
            ? blocks.length - 1
            : blocks.findIndex((b) => b.id === over.id)
        if (oldIndex !== -1 && newIndex !== -1)
          await persistEvent({
            event_type: "REORDER_BLOCKS",
            payload: {
              order: arrayMove(blocks, oldIndex, newIndex).map((b) => b.id),
            },
          })
      }
    }
  }

  const handleGenerateAi = async () => {
    if (!aiPrompt) return
    setIsGeneratingAi(true)
    try {
      const res = await apiFetch<{ blocks: FormBlock[] }>("/ai/generate", {
        method: "POST",
        body: JSON.stringify({ prompt: aiPrompt }),
      })
      if (res.blocks) {
        // Bulk apply events or just a special EVENT_TYPE
        await persistEvent({
          event_type: "REORDER_BLOCKS",
          payload: { order: [] },
        }) // Clear current?
        // For now let's just add them one by one or create a new event type
        for (const b of res.blocks) {
          await persistEvent({ event_type: "ADD_BLOCK", payload: { block: b } })
        }
        toast.success("AI Generation complete!")
        setAiPrompt("")
      }
    } catch (e) {
      toast.error("AI Generation failed")
    } finally {
      setIsGeneratingAi(false)
    }
  }

  if (loading)
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  if (error && !form)
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <h1 className="text-xl font-bold">Error</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
      </div>
    )

  return (
    <main className="flex h-screen flex-col overflow-hidden bg-background">
      <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-background px-6 shadow-sm">
        <div className="flex items-center gap-4">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="rounded-full px-2"
          >
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="mx-2 h-6 w-px bg-border" />
          <h1 className="max-w-[200px] truncate text-xl font-black tracking-tight">
            {nameDraft || "Untitled"}
          </h1>
          <div className="ml-4 flex rounded-lg bg-muted p-1 shadow-inner ring-1 ring-border">
            <button
              onClick={() => setActiveTab("editor")}
              className={cn(
                "rounded-md px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all",
                activeTab === "editor"
                  ? "bg-background text-primary shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Editor
            </button>
            <button
              onClick={() => setActiveTab("submissions")}
              className={cn(
                "rounded-md px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all",
                activeTab === "submissions"
                  ? "bg-background text-primary shadow"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Submissions
            </button>
            {isQuizDraft && (
              <button
                onClick={() => setActiveTab("leaderboard")}
                className={cn(
                  "rounded-md px-4 py-1.5 text-[10px] font-black tracking-widest uppercase transition-all",
                  activeTab === "leaderboard"
                    ? "bg-background text-primary shadow"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Board
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={copyPublicUrl}
              className="hidden rounded-[8px] sm:flex"
            >
              {isCopied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-emerald-500" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPreview(true)}
              className="rounded-[8px]"
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview
            </Button>
            <SendWhatsappFormModal formId={formId}>
              <Button variant="outline" size="sm" className="rounded-[8px]">
                <Send className="mr-2 h-4 w-4" />
                Send via WhatsApp
              </Button>
            </SendWhatsappFormModal>
            <ThemeToggle />
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={copyPublicUrl}
            className="hidden h-9 rounded-full px-5 font-bold sm:flex"
          >
            {isCopied ? (
              <Check className="mr-2 h-3 w-3 text-emerald-500" />
            ) : (
              <Copy className="mr-2 h-3 w-3" />
            )}
            Copy Link
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsPreview(true)}
            className="h-9 rounded-full px-5 font-bold"
          >
            <Eye className="mr-2 h-3 w-3" />
            Preview
          </Button>
          <div className="mx-1 h-6 w-px bg-border" />
          <ThemeToggle />
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {activeTab === "editor" && (
            <>
              <aside className="flex w-72 shrink-0 flex-col border-r border-border bg-card/30">
                <div className="border-b border-border bg-muted/20 p-5">
                  <h3 className="flex items-center gap-2 text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase">
                    <LayoutGrid className="size-3" /> Toolset
                  </h3>
                </div>
                <div className="flex-1 space-y-3 overflow-y-auto p-5">
                  <DraggableSidebarItem
                    type="short_text"
                    label="Short Answer"
                    icon={X}
                  />
                  <DraggableSidebarItem
                    type="long_text"
                    label="Long Answer"
                    icon={List}
                  />
                  <DraggableSidebarItem
                    type="checkbox"
                    label="Checkboxes"
                    icon={Check}
                  />
                  <DraggableSidebarItem
                    type="multiple_choice"
                    label="Multiple Choice"
                    icon={List}
                  />
                  <DraggableSidebarItem
                    type="dropdown"
                    label="Dropdown"
                    icon={List}
                  />
                  <DraggableSidebarItem
                    type="date_picker"
                    label="Date Selection"
                    icon={Calendar}
                  />
                  <DraggableSidebarItem
                    type="rating"
                    label="Rating Scale"
                    icon={Star}
                  />
                  <DraggableSidebarItem
                    type="file_upload"
                    label="File Upload"
                    icon={Upload}
                  />
                  <DraggableSidebarItem
                    type="upi_payment"
                    label="UPI Payment"
                    icon={CreditCard}
                  />
                </div>
              </aside>

              <div
                className="flex-1 overflow-y-auto scroll-smooth bg-muted/5 p-12"
                ref={canvasRef}
                onMouseMove={pushCursor}
              >
                <div className="mx-auto max-w-3xl space-y-8 pb-40">
                  {Object.entries(cursors).map(([id, pos]) => {
                    const user = presence.find((u) => u.userId === id)
                    if (!user) return null
                    return (
                      <div
                        key={id}
                        className="pointer-events-none absolute z-50 transition-all duration-75 ease-out"
                        style={{ left: pos.x, top: pos.y, color: user.color }}
                      >
                        <MousePointer2 className="h-4 w-4 fill-current" />
                      </div>
                    )
                  })}

                  <div className="group relative overflow-hidden rounded-[32px] border border-border bg-background p-12 shadow-2xl shadow-foreground/5">
                    <div className="absolute top-0 left-0 h-full w-2 bg-primary" />
                    <input
                      value={nameDraft}
                      onChange={(e) => setNameDraft(e.target.value)}
                      onBlur={saveMeta}
                      className="mb-4 w-full bg-transparent text-5xl font-black tracking-tighter outline-none placeholder:text-muted-foreground/10"
                      placeholder="Untitled Project"
                    />
                    <textarea
                      value={descriptionDraft}
                      onChange={(e) => setDescriptionDraft(e.target.value)}
                      onBlur={saveMeta}
                      className="h-auto w-full resize-none bg-transparent text-xl text-muted-foreground outline-none placeholder:text-muted-foreground/10"
                      placeholder="Briefly describe this form..."
                      rows={1}
                    />
                  </div>

                  <DroppableCanvas>
                    <SortableContext
                      items={blocks.map((b) => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {blocks.length === 0 ? (
                        <div className="flex flex-col items-center justify-center rounded-[40px] border-4 border-dashed border-border/50 bg-background/20 py-40 text-center backdrop-blur-sm">
                          <div className="mb-8 rounded-3xl bg-muted p-6">
                            <Plus className="h-12 w-12 text-muted-foreground/30" />
                          </div>
                          <p className="text-3xl font-black tracking-tight">
                            Empty Canvas
                          </p>
                          <p className="mx-auto mt-2 max-w-xs font-medium text-muted-foreground">
                            Drag components from the left or summon AI on the
                            right.
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {blocks.map((b) => (
                            <BlockItem
                              key={b.id}
                              block={b}
                              allBlocks={blocks}
                              isQuiz={isQuizDraft}
                              addBlockBase={addBlock}
                              onChange={onBlockChange}
                              onBlur={persistBlock}
                              onRemove={removeBlock}
                            />
                          ))}
                        </div>
                      )}
                    </SortableContext>
                  </DroppableCanvas>
                  <div className="flex justify-center pt-16">
                    <Button
                      onClick={() => addBlock()}
                      variant="outline"
                      className="group h-14 rounded-full border-2 border-dashed border-border px-12 text-xl font-black hover:bg-primary hover:text-primary-foreground"
                    >
                      <Plus className="mr-4 h-6 w-6 transition-transform group-hover:rotate-90" />{" "}
                      New Question
                    </Button>
                  </div>
                </div>
              </div>

              <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-card/30">
                <div className="m-5 flex rounded-2xl bg-muted/30 p-1.5 shadow-inner ring-1 ring-border">
                  <button
                    onClick={() => setSidebarTab("setup")}
                    className={cn(
                      "flex-1 rounded-xl px-2 py-2.5 text-[9px] font-black tracking-widest uppercase transition-all",
                      sidebarTab === "setup"
                        ? "scale-[1.02] bg-background text-primary shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Setup
                  </button>
                  <button
                    onClick={() => setSidebarTab("ai")}
                    className={cn(
                      "flex-1 rounded-xl px-2 py-2.5 text-[9px] font-black tracking-widest uppercase transition-all",
                      sidebarTab === "ai"
                        ? "scale-[1.02] bg-background text-primary shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    AI Gen
                  </button>
                  <button
                    onClick={() => setSidebarTab("theme")}
                    className={cn(
                      "flex-1 rounded-xl px-2 py-2.5 text-[9px] font-black tracking-widest uppercase transition-all",
                      sidebarTab === "theme"
                        ? "scale-[1.02] bg-background text-primary shadow-lg"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Style
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6">
                  {sidebarTab === "setup" && (
                    <div className="animate-in space-y-8 duration-300 fade-in slide-in-from-right-4">
                      <section className="space-y-5">
                        <div className="group flex items-center justify-between rounded-[24px] border border-border bg-background p-5 shadow-sm transition-all hover:border-primary/50">
                          <div className="space-y-1">
                            <span className="block text-xs font-black">
                              Live Status
                            </span>
                            <span className="text-[9px] font-bold tracking-widest text-muted-foreground uppercase">
                              Public availability
                            </span>
                          </div>
                          <input
                            type="checkbox"
                            className="h-7 w-7 cursor-pointer rounded-xl accent-primary ring-offset-background transition-all"
                            checked={publishedDraft}
                            onChange={(e) => {
                              setPublishedDraft(e.target.checked)
                              persistEvent({
                                event_type: "UPDATE_FORM_META",
                                payload: {
                                  name: nameDraft,
                                  description: descriptionDraft || null,
                                  is_published: e.target.checked,
                                  theme: themeDraft,
                                  slug: slugDraft,
                                  redirect_url: redirectUrlDraft || null,
                                  is_quiz: isQuizDraft,
                                  expires_at: expiresAtDraft
                                    ? new Date(expiresAtDraft).toISOString()
                                    : null,
                                },
                              })
                            }}
                          />
                        </div>
                        <div className="space-y-2.5">
                          <label className="ml-2 text-[9px] font-black tracking-[0.2em] text-muted-foreground uppercase">
                            Unique URL
                          </label>
                          <input
                            type="text"
                            className="w-full rounded-2xl border border-border bg-background px-5 py-4 text-sm font-bold ring-primary/10 transition-all outline-none focus:ring-4"
                            value={slugDraft}
                            onChange={(e) =>
                              setSlugDraft(
                                e.target.value
                                  .toLowerCase()
                                  .replace(/[^a-z0-9-]/g, "")
                              )
                            }
                            onBlur={saveMeta}
                            placeholder="e.g. feedback-2024"
                          />
                        </div>
                        <div className="space-y-2.5">
                          <label className="ml-2 text-[9px] font-black tracking-[0.2em] text-muted-foreground uppercase">
                            Visual Theme
                          </label>
                          <select
                            value={themeDraft}
                            onChange={(e) => setThemeDraft(e.target.value)}
                            onBlur={saveMeta}
                            className="w-full cursor-pointer appearance-none rounded-2xl border border-border bg-background px-5 py-4 text-sm font-bold outline-none"
                          >
                            <option value="minimal">Minimal White</option>
                            <option value="playful">Playful Peach</option>
                            <option value="corporate">Corporate Slate</option>
                          </select>
                        </div>
                      </section>
                      <section className="border-t border-border pt-10">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full rounded-2xl border-destructive/20 py-7 text-xs font-black tracking-widest text-destructive uppercase hover:bg-destructive/5"
                          onClick={deleteForm}
                        >
                          <Trash2 className="mr-3 size-4" /> Destroy Project
                        </Button>
                      </section>
                    </div>
                  )}

                  {sidebarTab === "ai" && (
                    <div className="flex h-full animate-in flex-col space-y-6 duration-300 fade-in slide-in-from-right-4">
                      <div className="rounded-2xl border-2 border-primary/20 bg-primary/10 p-5">
                        <div className="mb-2 flex items-center gap-2 text-primary">
                          <Sparkles className="size-5" />
                          <span className="text-[10px] font-black tracking-widest uppercase">
                            Neural Forge
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed font-bold text-primary/80">
                          Instantly generate complete form schemas using Gemini
                          AI. Describe your goals below.
                        </p>
                      </div>
                      <textarea
                        value={aiPrompt}
                        onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="e.g. Create a 5-question satisfaction survey for a coffee shop..."
                        className="w-full flex-1 resize-none rounded-3xl border-2 border-border bg-background p-6 text-sm font-bold shadow-inner transition-all outline-none focus:border-primary"
                      />
                      <Button
                        onClick={handleGenerateAi}
                        disabled={isGeneratingAi || !aiPrompt}
                        className="h-16 w-full rounded-3xl text-lg font-black tracking-tighter shadow-xl shadow-primary/20"
                      >
                        {isGeneratingAi ? (
                          <Loader2 className="mr-3 size-6 animate-spin" />
                        ) : (
                          <Sparkles className="mr-3 size-6" />
                        )}{" "}
                        Generate Structure
                      </Button>
                    </div>
                  )}

                  {sidebarTab === "theme" && (
                    <div className="flex h-full animate-in flex-col space-y-6 duration-300 fade-in slide-in-from-right-4">
                      <div className="rounded-2xl border-2 border-amber-500/20 bg-amber-500/10 p-5">
                        <div className="mb-2 flex items-center gap-2 text-amber-700">
                          <Palette className="size-5" />
                          <span className="text-[10px] font-black tracking-widest uppercase">
                            Custom Engine
                          </span>
                        </div>
                        <p className="text-[11px] leading-relaxed font-bold text-amber-700/80">
                          Inject raw CSS to customize the form experience.
                          Scoped to .form-root.
                        </p>
                      </div>
                      <textarea
                        value={customCss}
                        onChange={(e) => setCustomCss(e.target.value)}
                        placeholder=".form-root { --primary: #ff0000; }"
                        className="w-full flex-1 resize-none rounded-3xl border-2 border-border bg-background p-6 font-mono text-[11px] shadow-inner transition-all outline-none focus:border-amber-500"
                      />
                      <Button
                        onClick={saveMeta}
                        className="h-14 w-full rounded-3xl text-sm font-black tracking-widest uppercase"
                      >
                        Apply Aesthetics
                      </Button>
                    </div>
                  )}
                </div>
              </aside>
            </>
          )}

          {activeTab === "submissions" && (
            <div className="flex-1 overflow-y-auto bg-muted/5 p-12">
              <div className="mx-auto max-w-6xl">
                <div className="mb-16 flex items-center justify-between">
                  <div>
                    <h2 className="text-5xl font-black tracking-tighter">
                      Database
                    </h2>
                    <p className="mt-2 text-xl font-medium tracking-tight text-muted-foreground">
                      Review raw submission logs and generated analytics.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={exportCsv}
                    disabled={submissions.length === 0}
                    className="h-14 rounded-full border-2 px-10 text-lg font-black"
                  >
                    <FileSpreadsheet className="mr-3 h-5 w-5 text-emerald-600" />{" "}
                    Export CSV
                  </Button>
                </div>
                {subsLoading ? (
                  <div className="flex justify-center rounded-[40px] border border-border bg-background py-40 shadow-inner">
                    <Loader2 className="h-16 w-16 animate-spin text-primary" />
                  </div>
                ) : submissions.length === 0 ? (
                  <div className="rounded-[40px] border-4 border-dashed border-border bg-background py-40 text-center">
                    <p className="text-2xl font-black tracking-tighter text-muted-foreground uppercase opacity-30">
                      Zero Records Found
                    </p>
                  </div>
                ) : (
                  <div className="animate-in overflow-hidden rounded-[40px] border border-border bg-background shadow-2xl shadow-foreground/5 slide-in-from-bottom-4">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-border bg-muted/30">
                            <th className="px-8 py-6 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                              Timestamp
                            </th>
                            {isQuizDraft && (
                              <th className="px-8 py-6 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                                Score
                              </th>
                            )}
                            {blocks
                              .filter(
                                (b) =>
                                  !b.type.startsWith("h") &&
                                  b.type !== "paragraph"
                              )
                              .slice(0, 5)
                              .map((b) => (
                                <th
                                  key={b.id}
                                  className="max-w-[150px] truncate px-8 py-6 text-[10px] font-black tracking-widest text-muted-foreground uppercase"
                                >
                                  {b.label || b.type}
                                </th>
                              ))}
                            <th className="px-8 py-6 text-right text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                              Data
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {submissions.map((sub) => (
                            <tr
                              key={sub.id}
                              className="group transition-all hover:bg-primary/[0.02]"
                            >
                              <td className="px-8 py-5 font-mono text-xs font-black text-muted-foreground">
                                {new Date(sub.submitted_at).toLocaleString()}
                              </td>
                              {isQuizDraft && (
                                <td className="px-8 py-5">
                                  <span className="rounded-lg bg-emerald-500/10 px-3 py-1 text-[10px] font-black text-emerald-600 uppercase">
                                    {sub.score} Pts
                                  </span>
                                </td>
                              )}
                              {blocks
                                .filter(
                                  (b) =>
                                    !b.type.startsWith("h") &&
                                    b.type !== "paragraph"
                                )
                                .slice(0, 5)
                                .map((b) => (
                                  <td
                                    key={b.id}
                                    className="max-w-[150px] truncate px-8 py-5 font-bold text-muted-foreground/80"
                                  >
                                    {String(sub.answers?.[b.id] || "—")}
                                  </td>
                                ))}
                              <td className="px-8 py-5 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-9 rounded-full px-5 text-[10px] font-black tracking-widest text-primary uppercase opacity-0 transition-all group-hover:opacity-100 hover:bg-primary hover:text-primary-foreground"
                                  onClick={() =>
                                    alert(JSON.stringify(sub.answers, null, 2))
                                  }
                                >
                                  Inspect
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div
              className={cn(
                "flex-1 overflow-y-auto bg-muted/5 p-16",
                isPresentation &&
                  "fixed inset-0 z-[200] flex flex-col overflow-hidden bg-background p-24"
              )}
            >
              <div className="mx-auto mb-16 flex w-full max-w-6xl items-center justify-between">
                <div className="flex items-center gap-6">
                  <div className="flex size-20 animate-bounce items-center justify-center rounded-[32px] bg-amber-500 shadow-2xl shadow-amber-500/40 duration-1000">
                    <Sparkles className="size-10 text-amber-950" />
                  </div>
                  <h3
                    className={cn(
                      "text-6xl font-black tracking-tighter",
                      isPresentation && "text-9xl"
                    )}
                  >
                    Hall of Fame
                  </h3>
                </div>
                <Button
                  variant="outline"
                  className="h-16 rounded-3xl border-4 px-10 text-lg font-black tracking-tighter uppercase transition-all hover:border-primary hover:bg-primary hover:text-primary-foreground"
                  onClick={() => setIsPresentation(!isPresentation)}
                >
                  {isPresentation ? "Close View" : "Project to Screen"}
                </Button>
              </div>
              {leaderboard.length === 0 ? (
                <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center justify-center rounded-[60px] border-8 border-dashed border-border bg-background/50 py-40">
                  <Users className="mb-10 size-24 text-muted-foreground/10" />
                  <p className="text-4xl font-black tracking-tighter text-muted-foreground/30 uppercase">
                    No Legends Yet
                  </p>
                </div>
              ) : (
                <div
                  className={cn(
                    "mx-auto grid w-full max-w-6xl gap-8",
                    isPresentation
                      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1"
                  )}
                >
                  {leaderboard.map((sub, i) => (
                    <div
                      key={sub.id}
                      className={cn(
                        "flex animate-in items-center justify-between rounded-[40px] border-4 p-8 transition-all duration-500 zoom-in-95",
                        i === 0
                          ? "scale-110 border-amber-500 bg-amber-500/10 shadow-[0_0_80px_-20px_rgba(245,158,11,0.4)] ring-8 ring-amber-500/5"
                          : "border-border/50 bg-background shadow-2xl shadow-foreground/5",
                        isPresentation ? "p-16" : "p-8"
                      )}
                    >
                      <div className="flex items-center gap-8">
                        <div
                          className={cn(
                            "flex items-center justify-center rounded-[24px] font-black",
                            i === 0
                              ? "size-20 bg-amber-500 text-4xl text-amber-950 shadow-lg"
                              : "size-16 bg-muted text-2xl text-muted-foreground",
                            isPresentation && i === 0
                              ? "size-32 rounded-[40px] text-6xl"
                              : isPresentation
                                ? "size-24 rounded-[32px] text-5xl"
                                : ""
                          )}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <p
                            className={cn(
                              "font-black tracking-tighter uppercase",
                              isPresentation ? "text-5xl" : "text-3xl"
                            )}
                          >
                            {sub.answers?.[
                              blocks.find((b) => b.type === "short_text")?.id ||
                                ""
                            ] || "Anonymous"}
                          </p>
                          <p className="mt-2 text-[10px] font-black tracking-[0.3em] text-muted-foreground uppercase opacity-50">
                            Log ID: {sub.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={cn(
                            "leading-none font-black tracking-tighter text-emerald-600",
                            isPresentation ? "text-9xl" : "text-6xl"
                          )}
                        >
                          {sub.score}
                        </div>
                        <p className="mt-2 text-[12px] font-black tracking-[0.4em] text-muted-foreground uppercase">
                          Points
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <DragOverlay>
            {activeId ? (
              <div className="flex scale-110 animate-pulse items-center gap-4 rounded-3xl border-4 border-primary bg-background p-8 shadow-[0_0_100px_-20px_rgba(var(--primary),0.5)] ring-8 ring-primary/5 transition-transform">
                <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <span className="text-2xl font-black tracking-tighter text-primary uppercase">
                  Placing Block
                </span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>

      <Dialog
        open={!!inspectSubmission}
        onOpenChange={(open) => !open && setInspectSubmission(null)}
      >
        <DialogContent className="max-h-[85vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Submission Details</DialogTitle>
            <DialogDescription>
              {inspectSubmission
                ? `Submitted at ${new Date(inspectSubmission.submitted_at).toLocaleString()} (Log ID: ${inspectSubmission.id})`
                : ""}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4">
            {inspectSubmission &&
              blocks
                .filter(
                  (b) => !b.type.startsWith("h") && b.type !== "paragraph"
                )
                .map((b) => (
                  <div key={b.id} className="space-y-1">
                    <p className="text-sm font-bold text-muted-foreground">
                      {b.label || b.type}
                    </p>
                    <div className="rounded-xl bg-muted/50 p-4 font-mono text-sm whitespace-pre-wrap">
                      {typeof inspectSubmission.answers?.[b.id] === "object" &&
                      inspectSubmission.answers?.[b.id] !== null
                        ? JSON.stringify(
                            inspectSubmission.answers[b.id],
                            null,
                            2
                          )
                        : String(inspectSubmission.answers?.[b.id] || "—")}
                    </div>
                  </div>
                ))}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
