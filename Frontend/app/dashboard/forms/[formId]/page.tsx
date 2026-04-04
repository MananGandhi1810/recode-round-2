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
  Send,
} from "lucide-react"

import { SendWhatsappFormModal } from "@/components/SendWhatsappFormModal"

import {
  DndContext,
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

type SubmissionScoreUpdate = {
  id: string;
  score: number;
  answers: Record<string, string | string[]>;
  submitted_at: string; // ISO format string
}

type SubmissionScoreUpdate = {
  id: string;
  score: number;
  answers: Record<string, string | string[]>;
  submitted_at: string; // ISO format string
}

type WsIncoming =
  | { type: "PRESENCE_SNAPSHOT"; users: PresenceUser[] }
  | { type: "CURSOR_JOIN"; user: PresenceUser }
  | { type: "CURSOR_LEAVE"; userId: string }
  | { type: "CURSOR_MOVE"; userId: string; x: number; y: number }
  | { type: "FORM_EVENT"; payload: FormEventPayload }
  | { type: "SCORE_UPDATE"; submission: SubmissionScoreUpdate }
  | { type: "ERROR"; message: string }

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
        "flex cursor-grab items-center gap-3 rounded-[8px] border border-border bg-card p-3 text-sm font-medium transition-all hover:border-primary/50 hover:bg-muted/50",
        isDragging && "opacity-50 shadow-sm"
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
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
      className="group relative z-10 flex items-start bg-background py-1"
    >
      <div className="absolute -left-12 hidden w-12 items-center justify-end pt-1 pr-2 opacity-0 transition-opacity group-hover:opacity-100 md:flex">
        <button
          type="button"
          onClick={() =>
            addBlockBase(allBlocks.findIndex((b) => b.id === block.id) + 1)
          }
          className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <Plus className="h-4 w-4" />
        </button>
        <div
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <GripVertical className="h-4 w-4" />
        </div>
      </div>

      <div className="w-full rounded-[10px] border border-transparent p-3 transition-colors group-hover:border-border group-hover:bg-muted/30">
        <div className="mb-2 flex items-center gap-2">
          <select
            value={block.type}
            onChange={(e) =>
              onChange(block.id, (b) => ({ ...b, type: e.target.value }))
            }
            onBlur={() => onBlur(block.id)}
            className="rounded border-0 bg-muted/50 px-1.5 py-0.5 text-[10px] font-bold tracking-wider text-muted-foreground uppercase outline-none focus:ring-0"
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
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="rounded-md p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => setShowLogic(!showLogic)}
            className="rounded-md p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground"
          >
            <Route className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => onRemove(block.id)}
            className="rounded-md p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-1">
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
            className={`w-full border-0 bg-transparent px-0 py-1 outline-none placeholder:text-muted-foreground/50 focus:ring-0 ${
              block.type === "h1"
                ? "text-3xl font-bold"
                : block.type === "h2"
                  ? "text-xl font-bold"
                  : "text-base"
            }`}
          />
        </div>

        {/* Render interactive parts if input */}
        {(block.type === "short_text" || block.type === "long_text") && (
          <div className="mt-2">
            {block.type === "short_text" ? (
              <input
                disabled
                className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground opacity-50"
                placeholder={
                  block.config.placeholder || "Type your answer here..."
                }
              />
            ) : (
              <textarea
                disabled
                rows={3}
                className="w-full resize-none rounded-md border border-input bg-transparent px-3 py-2 text-sm text-muted-foreground opacity-50"
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
          <div className="mt-2 space-y-2">
            {(
              block.config.options || [{ label: "Option 1", value: "opt1" }]
            ).map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <div
                  className={`h-4 w-4 border border-input opacity-50 ${block.type === "checkbox" ? "rounded-sm" : "rounded-full"}`}
                ></div>
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
                  className="w-full border-0 bg-transparent text-sm opacity-80 outline-none"
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
              className="ml-6 text-xs text-primary hover:underline"
            >
              + Add option
            </button>
          </div>
        )}

        {block.type === "upi_payment" && (
          <div className="mt-2 space-y-3 rounded-md border border-border bg-muted/20 p-3">
            <input
              type="text"
              placeholder="UPI ID (e.g. user@bank)"
              value={block.config.upiId || ""}
              onChange={(e) =>
                onChange(block.id, (b) => ({
                  ...b,
                  config: { ...b.config, upiId: e.target.value },
                }))
              }
              onBlur={() => onBlur(block.id)}
              className="w-full border-b bg-transparent pb-1 text-sm opacity-80 outline-none focus:border-primary"
            />
            <input
              type="text"
              placeholder="Amount (fixed or {{block_id}})"
              value={block.config.upiAmount || ""}
              onChange={(e) =>
                onChange(block.id, (b) => ({
                  ...b,
                  config: { ...b.config, upiAmount: e.target.value },
                }))
              }
              onBlur={() => onBlur(block.id)}
              className="w-full border-b bg-transparent pb-1 text-sm opacity-80 outline-none focus:border-primary"
            />
          </div>
        )}

        {showConfig && (
          <div className="mt-4 space-y-4 rounded-md border border-border bg-muted/20 p-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border pb-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Block Settings
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="flex items-center gap-3 text-sm">
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
                />
                Required field
              </label>

              {(block.type === "short_text" || block.type === "long_text") && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
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
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                  >
                    <option value="">None</option>
                    <option value="email">Email</option>
                    <option value="number">Number</option>
                    <option value="url">URL</option>
                  </select>
                </div>
              )}

              {(block.type === "short_text" || block.type === "long_text") && (
                <div>
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
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
                    className="w-full rounded-md border border-input bg-background px-2 py-1 text-sm"
                    placeholder="None"
                  />
                </div>
              )}

              {block.type === "dropdown" && (
                <label className="flex items-center gap-3 text-sm">
                  <input
                    type="checkbox"
                    checked={block.config.allowMultiple}
                    onChange={(e) =>
                      onChange(block.id, (b) => ({
                        ...b,
                        config: {
                          ...b.config,
                          allowMultiple: e.target.checked,
                        },
                      }))
                    }
                    onBlur={() => onBlur(block.id)}
                  />
                  Allow multiple selection
                </label>
              )}

              {!block.type.startsWith("h") && block.type !== "paragraph" && (
                <div className="md:col-span-2">
                  <label className="mb-1 block text-xs font-medium text-muted-foreground">
                    Placeholder text
                  </label>
                  <input
                    type="text"
                    value={block.config.placeholder || ""}
                    onChange={(e) =>
                      onChange(block.id, (b) => ({
                        ...b,
                        config: { ...b.config, placeholder: e.target.value },
                      }))
                    }
                    onBlur={() => onBlur(block.id)}
                    className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                    placeholder="Type your answer here..."
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {isQuiz &&
          !block.type.startsWith("h") &&
          block.type !== "paragraph" && (
            <div className="mt-4 flex flex-wrap items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
              <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-background px-2 py-1">
                <Sparkles className="size-3 text-emerald-500" />
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
                  className="w-10 bg-transparent text-xs font-bold text-emerald-700 outline-none"
                  title="Points"
                />
                <span className="text-[10px] font-bold text-emerald-500 uppercase">
                  pts
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-md border border-emerald-500/20 bg-background px-2 py-1">
                <Timer className="size-3 text-emerald-500" />
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
                  className="w-10 bg-transparent text-xs font-bold text-emerald-700 outline-none"
                  title="Timer (seconds)"
                />
                <span className="text-[10px] font-bold text-emerald-500 uppercase">
                  sec
                </span>
              </div>

              <div className="flex flex-1 items-center gap-2 rounded-md border border-emerald-500/20 bg-background px-2 py-1">
                <CheckCircle2 className="size-3 text-emerald-500" />
                <input
                  type="text"
                  placeholder="Correct answer..."
                  value={block.config.correctAnswer || ""}
                  onChange={(e) =>
                    onChange(block.id, (b) => ({
                      ...b,
                      config: { ...b.config, correctAnswer: e.target.value },
                    }))
                  }
                  onBlur={() => onBlur(block.id)}
                  className="flex-1 bg-transparent text-xs font-medium text-emerald-900 outline-none placeholder:text-emerald-900/30"
                />
              </div>
            </div>
          )}

        {showLogic && (
          <div className="mt-4 rounded-md border border-border bg-card p-3 shadow-sm">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase">
                Logic & conditions
              </span>
              <button
                type="button"
                onClick={addLogicRule}
                className="text-xs text-primary hover:underline"
              >
                + Add rule
              </button>
            </div>
            <div className="space-y-4">
              {(block.config.logic || []).map((rule: LogicRule, ruleIdx: number) => (
                <div
                  key={rule.id}
                  className="rounded border border-border/50 bg-muted/20 p-3"
                >
                  <div className="mb-3 flex flex-wrap items-center gap-2 text-sm">
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
                      className="h-7 rounded border border-input bg-background px-2 text-xs"
                    >
                      <option value="show">Show</option>
                      <option value="hide">Hide</option>
                    </select>
                    <span>this block if</span>
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
                      className="h-7 rounded border border-input bg-background px-2 text-xs"
                    >
                      <option value="all">all</option>
                      <option value="any">any</option>
                    </select>
                    <span>of these conditions match:</span>
                    <div className="flex-1" />
                    <button
                      onClick={() =>
                        onChange(block.id, (b) => {
                          const next = (b.config.logic || []).filter(
                            (r: LogicRule) => r.id !== rule.id
                          )
                          return { ...b, config: { ...b.config, logic: next } }
                        })
                      }
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {rule.conditions.map((cond: LogicCondition, condIdx: number) => (
                      <div
                        key={condIdx}
                        className="flex flex-wrap items-center gap-2"
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
                          className="h-7 rounded border border-input bg-background px-2 text-xs"
                        >
                          <option value="">Select block...</option>
                          {allBlocks
                            .filter((cand) => cand.id !== block.id)
                            .map((cand) => (
                              <option key={cand.id} value={cand.id}>
                                {cand.label || cand.type}
                              </option>
                            ))}
                        </select>
                        <select
                          value={cond.operator}
                          onChange={(e) =>
                            onChange(block.id, (b) => {
                              const next = [...(b.config.logic || [])]
                              const nextConds = [...next[ruleIdx].conditions]
                              nextConds[condIdx] = {
                                ...nextConds[condIdx],
                                operator: e.target.value as LogicCondition['operator'],
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
                          className="h-7 rounded border border-input bg-background px-2 text-xs"
                        >
                          <option value="equals">equals</option>
                          <option value="not_equals">not equals</option>
                          <option value="contains">contains</option>
                          <option value="is_empty">is empty</option>
                          <option value="is_not_empty">is not empty</option>
                        </select>
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
                              placeholder="Value..."
                              className="h-7 rounded border border-input bg-background px-2 text-xs"
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
                            className="text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3" />
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
                      className="text-xs text-primary hover:underline"
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
    "editor" | "settings" | "leaderboard" | "submissions"
  >("editor")
  const [isPreview, setIsPreview] = React.useState(false)
  const [isPresentation, setIsPresentation] = React.useState(false)
  const [submissions, setSubmissions] = React.useState<any[]>([])
  const [subsLoading, setSubsLoading] = React.useState(false)
  const [isCopied, setIsCopied] = React.useState(false)
  const [socketConnected, setSocketConnected] = React.useState(false)
  const socketRef = React.useRef<WebSocket | null>(null)
  const reconnectTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Auto-switch away from leaderboard if quiz mode disabled
  React.useEffect(() => {
    if (!isQuizDraft && activeTab === "leaderboard") {
      setActiveTab("editor")
    }
  }, [isQuizDraft, activeTab])

  const copyPublicUrl = () => {
    const baseUrl = window.location.origin
    const url = form?.slug
      ? `${baseUrl}/${form.organization_slug}/${form.slug}`
      : `${baseUrl}/f/${form?.id}`

    navigator.clipboard.writeText(url)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const [savingMeta, setSavingMeta] = React.useState(false)

  const blocks = form?.schema_snapshot.blocks ?? []

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
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

  const deleteForm = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this form? This will remove all submissions and events permanently."
      )
    ) {
      return
    }
    try {
      await apiFetch(`/forms/${formId}`, { method: "DELETE" })
      router.push("/dashboard")
    } catch (e) {
      alert("Failed to delete form")
    }
  }

  const exportCsv = () => {
    const API_BASE =
      process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"
    window.open(`${API_BASE}/forms/${formId}/export/csv`, "_blank")
  }

  React.useEffect(() => {
    if (activeTab === "submissions") {
      loadSubmissions()
    }
  }, [activeTab, loadSubmissions])

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

    if (socketRef.current) {
      socketRef.current.close()
    }

    const ws = new WebSocket(`${getWsBaseUrl()}/forms/${formId}/ws`)
    socketRef.current = ws

    ws.onopen = () => {
      setSocketConnected(true)
      setError(null)
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }
    }

    ws.onclose = () => {
      setSocketConnected(false)
      reconnectTimeoutRef.current = setTimeout(() => {
        connectWebSocket()
      }, 3000)
    }

    ws.onerror = () => {
      ws.close()
    }

    ws.onmessage = (event) => {
      const incoming = JSON.parse(event.data) as WsIncoming

      if (incoming.type === "PRESENCE_SNAPSHOT") {
        setPresence(incoming.users)
        return
      }

      if (incoming.type === "CURSOR_JOIN") {
        setPresence((current) => {
          const withoutUser = current.filter(
            (item) => item.userId !== incoming.user.userId
          )
          return [...withoutUser, incoming.user]
        })
        return
      }

      if (incoming.type === "CURSOR_LEAVE") {
        setPresence((current) =>
          current.filter((item) => item.userId !== incoming.userId)
        )
        return
      }

      if (incoming.type === "CURSOR_MOVE") {
        setCursors((current) => ({
          ...current,
          [incoming.userId]: { x: incoming.x, y: incoming.y },
        }))
        return
      }

      if (incoming.type === "FORM_EVENT") {
        setForm((current) => {
          if (!current) return current
          return {
            ...current,
            schema_snapshot: applyFormEvent(
              current.schema_snapshot,
              incoming.payload
            ),
          }
        })
      }

      if (incoming.type === "SCORE_UPDATE") {
        setLeaderboard((current) => {
          const withoutSub = current.filter(
            (s) => s.id !== incoming.submission.id
          )
          return [...withoutSub, incoming.submission].sort(
            (a, b) => b.score - a.score
          )
        })
      }
    }
  }, [formId])

  React.useEffect(() => {
    connectWebSocket()
    return () => {
      if (socketRef.current) socketRef.current.close()
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current)
    }
  }, [connectWebSocket])

  const persistEvent = async (event: FormEventPayload) => {
    try {
      await apiFetch(`/forms/${formId}/events`, {
        method: "POST",
        body: JSON.stringify(event),
      })
    } catch (e) {
      console.error("Event failed", e)
    }
  }

  const onBlockChange = React.useCallback(
    (id: string, updater: (b: FormBlock) => FormBlock) => {
      setForm((current) => {
        if (!current) return current
        return {
          ...current,
          schema_snapshot: {
            blocks: current.schema_snapshot.blocks.map((block) =>
              block.id === id ? updater(block) : block
            ),
          },
        }
      })
    },
    []
  )

  const persistBlock = React.useCallback(
    async (id: string) => {
      const block = form?.schema_snapshot.blocks.find(
        (candidate) => candidate.id === id
      )
      if (!block) {
        return
      }

      await persistEvent({
        event_type: "UPDATE_BLOCK",
        payload: { id, block },
      })
    },
    [form, persistEvent]
  )

  const saveMeta = React.useCallback(async () => {
    setSavingMeta(true)
    setError(null)

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
        expires_at: expiresAtDraft
          ? new Date(expiresAtDraft).toISOString()
          : null,
      },
    }

    try {
      await persistEvent(eventPayload)
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Failed to save form metadata"
      )
    } finally {
      setSavingMeta(false)
    }
  }, [
    descriptionDraft,
    nameDraft,
    persistEvent,
    publishedDraft,
    themeDraft,
    slugDraft,
    redirectUrlDraft,
    isQuizDraft,
    expiresAtDraft,
  ])

  const pushCursor = React.useCallback(
    (e: React.MouseEvent) => {
      if (!canvasRef.current || !socketRef.current || !socketConnected) return
      const rect = canvasRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      socketRef.current.send(JSON.stringify({ type: "CURSOR_MOVE", x, y }))
    },
    [socketConnected]
  )

  const addBlock = async (index?: number) => {
    const newBlock: FormBlock = {
      id: crypto.randomUUID(),
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
    await persistEvent({
      event_type: "REMOVE_BLOCK",
      payload: { id },
    })
  }

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex((b) => b.id === active.id)
      const newIndex = blocks.findIndex((b) => b.id === over.id)
      const newOrder = arrayMove(blocks, oldIndex, newIndex).map((b) => b.id)

      await persistEvent({
        event_type: "REORDER_BLOCKS",
        payload: { order: newOrder },
      })
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error && !form) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background p-6 text-center">
        <div className="mb-4 rounded-full bg-destructive/10 p-3 text-destructive">
          <Trash2 className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold">Form error</h1>
        <p className="mt-2 text-muted-foreground">{error}</p>
        <Button
          onClick={() => router.push("/dashboard")}
          variant="outline"
          className="mt-6"
        >
          Back to dashboard
        </Button>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Button asChild variant="ghost" className="mb-2 rounded-[8px] px-2">
              <Link href="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to dashboard
              </Link>
            </Button>
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-semibold tracking-tight">
                Edit Form
              </h1>
              <div className="flex rounded-lg bg-muted p-1">
                <button
                  onClick={() => setActiveTab("editor")}
                  className={`rounded-md px-3 py-1 text-sm font-medium ${activeTab === "editor" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Editor
                </button>
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`rounded-md px-3 py-1 text-sm font-medium ${activeTab === "settings" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Settings
                </button>
                {isQuizDraft && (
                  <button
                    onClick={() => setActiveTab("leaderboard")}
                    className={`rounded-md px-3 py-1 text-sm font-medium ${activeTab === "leaderboard" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    Leaderboard
                  </button>
                )}
                <button
                  onClick={() => setActiveTab("submissions")}
                  className={`rounded-md px-3 py-1 text-sm font-medium ${activeTab === "submissions" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Submissions
                </button>
              </div>
            </div>
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
        </header>

        {error ? (
          <div className="mb-4 rounded-[10px] border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {isPreview && (
          <FormPreview
            form={{
              ...form!,
              name: nameDraft,
              description: descriptionDraft,
              theme: themeDraft,
              schema_snapshot: { blocks },
              is_quiz: isQuizDraft,
              redirect_url: redirectUrlDraft || null,
            }}
            onClose={() => setIsPreview(false)}
          />
        )}

        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          {activeTab === "editor" && (
            <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
              <div
                ref={canvasRef}
                onMouseMove={pushCursor}
                className="relative rounded-[12px] border border-border bg-card p-5 shadow-sm"
              >
                {Object.entries(cursors).map(([id, pos]) => {
                  const user = presence.find((u) => u.userId === id)
                  if (!user) return null
                  return (
                    <div
                      key={id}
                      className="pointer-events-none absolute z-50 transition-all duration-75 ease-out"
                      style={{
                        left: pos.x,
                        top: pos.y,
                        color: user.color,
                      }}
                    >
                      <MousePointer2 className="h-4 w-4 fill-current" />
                      <div className="mt-1 rounded-sm bg-current px-1 py-0.5 text-[8px] font-bold text-white uppercase">
                        {user.initials}
                      </div>
                    </div>
                  )
                })}

                <div className="mb-8 flex items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <p className="text-xs font-bold tracking-[0.2em] text-muted-foreground uppercase">
                      Form metadata
                    </p>
                    <h2 className="mt-1 text-xl font-semibold">{nameDraft}</h2>
                  </div>
                  <Button
                    onClick={saveMeta}
                    disabled={savingMeta}
                    size="sm"
                    className="rounded-[8px]"
                  >
                    {savingMeta ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="mr-2 h-4 w-4" />
                    )}
                    Save details
                  </Button>
                </div>

                <div className="mb-8 grid gap-4 sm:grid-cols-[1fr_auto]">
                  <input
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onBlur={saveMeta}
                    placeholder="Untitled form"
                    className="h-10 rounded-[8px] border border-input bg-background px-3 text-sm transition outline-none focus:border-ring"
                  />
                  <label className="flex h-10 items-center gap-2 rounded-[8px] border border-input bg-background px-3 text-sm">
                    <input
                      type="checkbox"
                      checked={publishedDraft}
                      onChange={(e) => {
                        setPublishedDraft(e.target.checked)
                        // Trigger immediate save for publish status
                        const eventPayload: FormEventPayload = {
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
                        }
                        persistEvent(eventPayload)
                      }}
                    />
                    Published
                  </label>
                </div>

                <textarea
                  value={descriptionDraft}
                  onChange={(e) => setDescriptionDraft(e.target.value)}
                  onBlur={saveMeta}
                  placeholder="Description..."
                  rows={2}
                  className="mb-8 w-full resize-none rounded-[8px] border border-input bg-background p-3 text-sm transition outline-none focus:border-ring"
                />

                <div className="flex items-center justify-between border-t border-border pt-6">
                  <h3 className="text-lg font-semibold tracking-tight">
                    Blocks
                  </h3>
                  <Button
                    onClick={() => addBlock()}
                    variant="outline"
                    size="sm"
                    className="rounded-[8px]"
                  >
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Add block
                  </Button>
                </div>

                <div className="mt-4 space-y-3 pb-8 md:pl-12" id="canvas">
                  <SortableContext
                    items={blocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {blocks.length === 0 ? (
                      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-12 text-center">
                        <div className="rounded-full bg-muted p-3">
                          <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="mt-4 text-sm font-medium text-muted-foreground">
                          No blocks yet. Drag from the right or click "Add
                          block"
                        </p>
                      </div>
                    ) : (
                      blocks.map((b) => (
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
                      ))
                    )}
                  </SortableContext>
                </div>
              </div>

              <aside className="space-y-6">
                <div className="rounded-[12px] border border-border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
                    <Users className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold tracking-wider uppercase">
                      Live collaborators
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {presence.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No other active editors.
                      </p>
                    ) : (
                      presence.map((u) => (
                        <div
                          key={u.userId}
                          className="flex items-center justify-between rounded-md border border-border/50 bg-muted/20 px-3 py-2"
                        >
                          <div className="flex items-center gap-2">
                            <div
                              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white uppercase"
                              style={{ backgroundColor: u.color }}
                            >
                              {u.initials}
                            </div>
                            <span className="text-xs font-medium">
                              {u.userId.slice(0, 8)}
                            </span>
                          </div>
                          <span className="flex items-center gap-1 text-[10px] text-emerald-500">
                            <span className="h-1.5 w-1.5 rounded-full bg-current"></span>
                            online
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                <div className="rounded-[12px] border border-border bg-card p-5 shadow-sm">
                  <div className="mb-4 flex items-center gap-2 border-b border-border pb-3">
                    <Component className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-semibold tracking-wider uppercase">
                      Form Elements
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    <DraggableSidebarItem
                      type="short_text"
                      label="Text Question"
                      icon={X}
                    />
                    <DraggableSidebarItem
                      type="checkbox"
                      label="Checkbox Question"
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
                      label="Date Picker"
                      icon={Check}
                    />
                    <DraggableSidebarItem
                      type="rating"
                      label="Rating"
                      icon={Check}
                    />
                    <DraggableSidebarItem
                      type="file_upload"
                      label="File Upload"
                      icon={Component}
                    />
                    <DraggableSidebarItem
                      type="upi_payment"
                      label="UPI Payment"
                      icon={Component}
                    />
                  </div>
                </div>
              </aside>
            </section>
          )}

          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-6 rounded-[12px] border border-border bg-card p-6 shadow-sm">
              <div className="border-b border-border pb-4">
                <h3 className="text-lg font-semibold">Form Link & Access</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Public URL
                  </label>
                  <div className="mt-1 flex gap-2">
                    <input
                      readOnly
                      value={
                        form?.slug
                          ? `${window.location.origin}/${form.organization_slug}/${form.slug}`
                          : `${window.location.origin}/f/${form?.id}`
                      }
                      className="flex-1 rounded-md border border-input bg-muted px-3 py-2 text-sm"
                    />
                    <Button onClick={copyPublicUrl} variant="outline">
                      Copy
                    </Button>
                  </div>
                  {!publishedDraft && (
                    <p className="mt-1 text-[10px] text-amber-600">
                      Note: Form must be published for the link to work.
                    </p>
                  )}
                </div>

                <div className="grid gap-6 rounded-lg border border-border bg-muted/10 p-4">
                  <div className="pt-2">
                    <label className="text-sm font-medium">Custom Slug</label>
                    <input
                      type="text"
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                      value={slugDraft}
                      onChange={(e) =>
                        setSlugDraft(
                          e.target.value
                            .toLowerCase()
                            .replace(/[^a-z0-9-]/g, "")
                        )
                      }
                    />
                  </div>
                  <div className="pt-2">
                    <label className="text-sm font-medium">
                      Redirect URL on Submit
                    </label>
                    <input
                      type="url"
                      placeholder="https://example.com/thanks"
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                      value={redirectUrlDraft}
                      onChange={(e) => setRedirectUrlDraft(e.target.value)}
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground">
                      Users will be automatically redirected to this URL after
                      submission.
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Theme</label>
                    <select
                      value={themeDraft}
                      onChange={(e) => setThemeDraft(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                    >
                      <option value="minimal">Minimal</option>
                      <option value="playful">Playful</option>
                      <option value="corporate">Corporate</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="space-y-0.5">
                      <label className="text-sm font-medium">Quiz Mode</label>
                      <p className="text-[10px] text-muted-foreground">
                        Type is immutable once created
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="h-5 w-5 disabled:opacity-50"
                      checked={isQuizDraft}
                      disabled={true}
                    />
                  </div>
                  {isQuizDraft && (
                    <div className="border-t border-border pt-2">
                      <label className="text-sm font-medium">
                        Expiry Date & Time
                      </label>
                      <input
                        type="datetime-local"
                        className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                        value={expiresAtDraft}
                        onChange={(e) => setExpiresAtDraft(e.target.value)}
                      />
                    </div>
                  )}
                </div>

                <div className="space-y-4 pt-6">
                  <div className="border-b border-border pb-2">
                    <h3 className="text-sm font-bold tracking-widest text-primary uppercase">
                      Advanced Features
                    </h3>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-sm font-semibold">
                        <Component className="size-4" /> Embed in your website
                      </h4>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="h-7 text-[10px]"
                        onClick={() => {
                          const code = `<div id="formbar-embed" data-form-id="${formId}"></div>\n<script src="${window.location.origin}/embed.js" async></script>`
                          navigator.clipboard.writeText(code)
                          alert("Embed code copied!")
                        }}
                      >
                        Copy Code
                      </Button>
                    </div>
                    <p className="mb-4 text-xs text-muted-foreground">
                      Paste this code where you want the form to appear.
                    </p>
                    <pre className="overflow-x-auto rounded-md border border-border bg-muted p-3 text-[10px]">
                      {`<div id="formbar-embed" data-form-id="${formId}"></div>
<script src="${window.location.origin}/embed.js" async></script>`}
                    </pre>
                  </div>

                  <div className="rounded-lg border border-border bg-card p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between">
                      <h4 className="flex items-center gap-2 text-sm font-semibold">
                        <Route className="size-4" /> API Submission
                      </h4>
                      <Button
                        size="xs"
                        variant="ghost"
                        className="h-7 text-[10px]"
                        onClick={() => {
                          const url = `${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/f/${formId}/submit`
                          navigator.clipboard.writeText(url)
                          alert("API URL copied!")
                        }}
                      >
                        Copy URL
                      </Button>
                    </div>
                    <p className="mb-4 text-xs text-muted-foreground">
                      Submit form data directly from your server.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-600">
                          POST
                        </span>
                        <code className="truncate text-[10px]">{`${process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}/f/${formId}/submit`}</code>
                      </div>
                      <pre className="overflow-x-auto rounded-md border border-border bg-muted p-3 text-[10px]">
                        {`{
  "answers": {
    "block_id_1": "answer text",
    "block_id_2": ["choice1", "choice2"]
  }
}`}
                      </pre>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div className="mr-4 flex-1 rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                    <h4 className="mb-1 text-sm font-bold tracking-widest text-destructive uppercase">
                      Danger Zone
                    </h4>
                    <p className="mb-3 text-xs text-muted-foreground">
                      Once deleted, this form and all its data cannot be
                      recovered.
                    </p>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteForm}
                    >
                      Delete Form
                    </Button>
                  </div>
                  <Button onClick={saveMeta} disabled={savingMeta}>
                    {savingMeta && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save All Settings
                  </Button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "submissions" && (
            <div className="rounded-[12px] border border-border bg-card p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between border-b border-border pb-4">
                <h3 className="text-lg font-semibold">Form Submissions</h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportCsv}
                  disabled={submissions.length === 0}
                >
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-emerald-600" />
                  Export CSV
                </Button>
              </div>

              {subsLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : submissions.length === 0 ? (
                <p className="py-12 text-center text-sm text-muted-foreground">
                  No submissions yet.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-border font-medium text-muted-foreground">
                        <th className="px-4 py-3">Date</th>
                        {isQuizDraft && <th className="px-4 py-3">Score</th>}
                        {blocks
                          .filter(
                            (b) =>
                              !b.type.startsWith("h") && b.type !== "paragraph"
                          )
                          .slice(0, 3)
                          .map((b) => (
                            <th key={b.id} className="px-4 py-3">
                              {b.label || b.type}
                            </th>
                          ))}
                        <th className="px-4 py-3">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissions.map((sub) => (
                        <tr
                          key={sub.id}
                          className="border-b border-border/50 transition-colors hover:bg-muted/30"
                        >
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(sub.submitted_at).toLocaleString()}
                          </td>
                          {isQuizDraft && (
                            <td className="px-4 py-3">
                              <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 font-bold text-emerald-600">
                                {sub.score}
                              </span>
                            </td>
                          )}
                          {blocks
                            .filter(
                              (b) =>
                                !b.type.startsWith("h") &&
                                b.type !== "paragraph"
                            )
                            .slice(0, 3)
                            .map((b) => (
                              <td
                                key={b.id}
                                className="max-w-[150px] truncate px-4 py-3"
                              >
                                {String(sub.answers?.[b.id] || "—")}
                              </td>
                            ))}
                          <td className="px-4 py-3">
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => {
                                alert(JSON.stringify(sub.answers, null, 2))
                              }}
                            >
                              View JSON
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div
              className={cn(
                "rounded-[12px] border border-border bg-card p-6 shadow-sm",
                isPresentation &&
                  "rounded-0 fixed inset-0 z-[200] flex flex-col bg-background p-12"
              )}
            >
              <div className="mb-8 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Sparkles className="h-6 w-6 text-amber-500" />
                  <h3
                    className={cn(
                      "text-lg font-semibold",
                      isPresentation && "text-4xl"
                    )}
                  >
                    Quiz Leaderboard
                  </h3>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPresentation(!isPresentation)}
                  >
                    <Maximize2 className="mr-2 h-4 w-4" />
                    {isPresentation ? "Exit Presentation" : "Presentation Mode"}
                  </Button>
                  {isPresentation && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsPresentation(false)}
                    >
                      <X className="size-6" />
                    </Button>
                  )}
                </div>
              </div>

              {leaderboard.length === 0 ? (
                <div className="flex flex-1 flex-col items-center justify-center py-20">
                  <Users className="mb-4 size-12 text-muted-foreground/30" />
                  <p className="text-lg text-muted-foreground">
                    Waiting for participants...
                  </p>
                </div>
              ) : (
                <div
                  className={cn(
                    "grid gap-4",
                    isPresentation
                      ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3"
                      : "grid-cols-1"
                  )}
                >
                  {leaderboard.map((sub, i) => (
                    <div
                      key={sub.id}
                      className={cn(
                        "flex items-center justify-between rounded-xl border p-4 transition-all",
                        i === 0
                          ? "scale-105 border-amber-500/30 bg-amber-500/10 shadow-lg shadow-amber-500/10"
                          : "border-border/50 bg-muted/20",
                        isPresentation ? "p-8" : "p-4"
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={cn(
                            "flex items-center justify-center rounded-full font-bold",
                            i === 0
                              ? "size-10 bg-amber-500 text-amber-950"
                              : "size-8 bg-muted text-muted-foreground",
                            isPresentation && i === 0
                              ? "size-16 text-2xl"
                              : isPresentation
                                ? "size-12 text-xl"
                                : ""
                          )}
                        >
                          {i + 1}
                        </div>
                        <div>
                          <p
                            className={cn(
                              "font-bold",
                              isPresentation ? "text-2xl" : "text-lg"
                            )}
                          >
                            {sub.answers?.[
                              blocks.find((b) => b.type === "short_text")?.id ||
                                ""
                            ] || "Anonymous User"}
                          </p>
                          <p className="font-mono text-xs text-muted-foreground">
                            {sub.id.slice(0, 8)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div
                          className={cn(
                            "font-black text-emerald-600",
                            isPresentation ? "text-5xl" : "text-2xl"
                          )}
                        >
                          {sub.score}
                        </div>
                        <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                          points
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
              <div className="flex items-center gap-2 rounded-md border border-border bg-card p-3 opacity-80 shadow-sm">
                <span className="text-sm font-medium">New Block</span>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </main>
  )
}
