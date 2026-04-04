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
} from "lucide-react"

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragStartEvent,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from "@dnd-kit/core"
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"
import {
  applyFormEvent,
  type FormBlock,
  type FormEventPayload,
  type FormRecord,
  getWsBaseUrl,
  type LogicRule,
  type LogicCondition,
} from "@/lib/forms"

type PresenceUser = {
  userId: string
  label: string
}

type CursorPoint = {
  x: number
  y: number
  userId: string
  label: string
}

type WsIncoming =
  | { type: "PRESENCE_SNAPSHOT"; users: PresenceUser[] }
  | { type: "CURSOR_JOIN"; user: PresenceUser }
  | { type: "CURSOR_LEAVE"; userId: string }
  | { type: "CURSOR_UPDATE"; cursor: CursorPoint }
  | { type: "EVENT_APPLIED"; formEvent: FormEventPayload }
  | { type: "SCORE_UPDATE"; submission: any }
  | { type: "ERROR"; message: string }

function defaultBlock(): FormBlock {
  return {
    id: crypto.randomUUID(),
    type: "short_text",
    label: "",
    config: {
      required: false,
      placeholder: "Type your answer",
      helperText: null,
      minLength: null,
      maxLength: null,
      min: null,
      max: null,
      options: null,
      maxFileSizeStr: null,
      allowedFileTypes: null,
      logic: [],
    },
  }
}

function DraggableSidebarItem({
  type,
  label,
  icon: Icon,
}: {
  type: string
  label: string
  icon: any
}) {
  const { attributes, listeners, setNodeRef } = useSortable({
    id: `new-${type}`,
    data: { isNew: true, type, label },
  })
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className="flex cursor-grab items-center gap-2 rounded-md border border-border bg-card p-3 shadow-sm hover:border-primary"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span className="text-sm font-medium">{label}</span>
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

  const handleLabelKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      const index = allBlocks.findIndex((b) => b.id === block.id)
      addBlockBase(index + 1)
    }
  }

  const addLogicRule = () => {
    onChange(block.id, (b) => {
      const newRule: LogicRule = {
        id: crypto.randomUUID(),
        action: "show",
        conditionMatch: "all",
        conditions: [{ blockId: "", operator: "equals", value: "" }],
      }
      return {
        ...b,
        config: { ...b.config, logic: [...(b.config.logic || []), newRule] },
      }
    })
    onBlur(block.id)
  }

  const updateLogicRule = (
    index: number,
    updater: (r: LogicRule) => LogicRule
  ) => {
    onChange(block.id, (b) => {
      const currentLogic = b.config.logic || []
      const newLogic = [...currentLogic]
      if (newLogic[index]) {
        newLogic[index] = updater(newLogic[index])
      }
      return { ...b, config: { ...b.config, logic: newLogic } }
    })
    onBlur(block.id)
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative z-10 -ml-12 flex items-start bg-background py-1"
    >
      <div className="flex w-12 items-center justify-end pt-1 pr-2 opacity-0 transition-opacity group-hover:opacity-100">
        <button
          type="button"
          onClick={() =>
            addBlockBase(allBlocks.findIndex((b) => b.id === block.id) + 1)
          }
          className="rounded-sm p-1 text-muted-foreground hover:bg-muted"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          {...attributes}
          {...listeners}
          className="cursor-grab rounded-sm p-1 text-muted-foreground hover:bg-muted"
        >
          <GripVertical className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col rounded-[8px] border border-transparent p-2 transition-colors focus-within:bg-muted/10 hover:border-border/50">
        <div className="flex items-center gap-2">
          <select
            value={block.type}
            onChange={(e) => {
              onChange(block.id, (b) => ({ ...b, type: e.target.value }))
              onBlur(block.id)
            }}
            className="h-7 w-auto cursor-pointer appearance-none rounded-md border-0 bg-transparent px-2 py-1 text-xs font-semibold text-muted-foreground uppercase outline-none hover:bg-muted focus:ring-0"
          >
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="paragraph">Paragraph</option>
            <option value="short_text">Short Text</option>
            <option value="long_text">Long Text</option>
            <option value="checkbox">Checkbox Question</option>
            <option value="multiple_choice">Multiple Choice</option>
            <option value="dropdown">Dropdown</option>
            <option value="date_picker">Date Picker</option>
            <option value="rating">Rating</option>
            <option value="file_upload">File Upload</option>
            <option value="upi_payment">UPI Payment</option>
          </select>
          <div className="flex-1" />
          <button
            type="button"
            onClick={() => setShowLogic(!showLogic)}
            className="rounded-md p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-muted hover:text-foreground"
          >
            <Settings2 className="h-4 w-4" />
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

        {isQuiz &&
          !block.type.startsWith("h") &&
          block.type !== "paragraph" && (
            <div className="mt-4 flex items-center justify-between gap-4 rounded-[8px] border border-emerald-500/20 bg-emerald-500/10 p-3">
              <label className="text-xs font-bold tracking-wide text-emerald-700 uppercase">
                Quiz Settings
              </label>
              <div className="flex flex-wrap gap-4">
                <input
                  type="number"
                  placeholder="Pts"
                  value={block.config.points || ""}
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
                  className="h-8 w-16 rounded border border-emerald-500/30 bg-background px-2 py-1 text-sm text-emerald-800"
                />
                <input
                  type="number"
                  placeholder="Secs"
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
                  className="h-8 w-16 rounded border border-emerald-500/30 bg-background px-2 py-1 text-sm text-emerald-800"
                />
                <input
                  type="text"
                  placeholder="Correct Answer"
                  value={(block.config.correctAnswer as string) || ""}
                  onChange={(e) =>
                    onChange(block.id, (b) => ({
                      ...b,
                      config: { ...b.config, correctAnswer: e.target.value },
                    }))
                  }
                  onBlur={() => onBlur(block.id)}
                  className="h-8 w-40 rounded border border-emerald-500/30 bg-background px-2 py-1 text-sm text-emerald-800"
                />
              </div>
            </div>
          )}

        {block.type === "upi_payment" && (
          <div className="mt-2 space-y-2 rounded-[8px] border border-dashed bg-muted/20 p-3">
            <input
              type="text"
              placeholder="UPI ID (e.g. handle@bank)"
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
              placeholder="Amount (Fixed or @ mention variable)"
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

            {(block.config.logic || []).length === 0 ? (
              <p className="text-xs text-muted-foreground">
                No logic applied to this block.
              </p>
            ) : (
              <div className="space-y-2">
                {(block.config.logic || []).map((rule, idx) => (
                  <div
                    key={rule.id}
                    className="flex flex-col gap-2 rounded border-l-2 border-primary bg-muted/30 p-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <select
                        value={rule.action}
                        onChange={(e) =>
                          updateLogicRule(idx, (r) => ({
                            ...r,
                            action: e.target.value as "show" | "hide",
                          }))
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
                          updateLogicRule(idx, (r) => ({
                            ...r,
                            conditionMatch: e.target.value as "all" | "any",
                          }))
                        }
                        className="h-7 rounded border border-input bg-background px-2 text-xs"
                      >
                        <option value="all">all</option>
                        <option value="any">any</option>
                      </select>
                      <span>of the following match:</span>
                      <button
                        type="button"
                        onClick={() => {
                          const newLogic = [...(block.config.logic || [])]
                          newLogic.splice(idx, 1)
                          onChange(block.id, (b) => ({
                            ...b,
                            config: { ...b.config, logic: newLogic },
                          }))
                          onBlur(block.id)
                        }}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {rule.conditions.map((cond, cIdx) => (
                      <div
                        key={cIdx}
                        className="ml-4 flex flex-wrap items-center gap-2"
                      >
                        <select
                          value={cond.blockId}
                          onChange={(e) => {
                            updateLogicRule(idx, (r) => {
                              const newConds = [...r.conditions]
                              newConds[cIdx].blockId = e.target.value
                              return { ...r, conditions: newConds }
                            })
                          }}
                          className="h-7 max-w-[150px] truncate rounded border border-input bg-background px-2 text-xs"
                        >
                          <option value="">Select block...</option>
                          {allBlocks
                            .filter(
                              (b) =>
                                b.id !== block.id &&
                                (b.type === "short_text" ||
                                  b.type === "long_text")
                            )
                            .map((b) => (
                              <option key={b.id} value={b.id}>
                                {b.label || "Untitled"}
                              </option>
                            ))}
                        </select>

                        <select
                          value={cond.operator}
                          onChange={(e) => {
                            updateLogicRule(idx, (r) => {
                              const newConds = [...r.conditions]
                              newConds[cIdx].operator = e.target.value as any
                              return { ...r, conditions: newConds }
                            })
                          }}
                          className="h-7 rounded border border-input bg-background px-2 text-xs"
                        >
                          <option value="equals">Equals</option>
                          <option value="not_equals">Not equals</option>
                          <option value="contains">Contains</option>
                          <option value="is_empty">Is empty</option>
                          <option value="is_not_empty">Is not empty</option>
                        </select>

                        {!["is_empty", "is_not_empty"].includes(
                          cond.operator
                        ) && (
                          <input
                            value={cond.value}
                            onChange={(e) => {
                              updateLogicRule(idx, (r) => {
                                const newConds = [...r.conditions]
                                newConds[cIdx].value = e.target.value
                                return { ...r, conditions: newConds }
                              })
                            }}
                            className="h-7 w-32 rounded border border-input bg-background px-2 text-xs"
                            placeholder="Value..."
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            updateLogicRule(idx, (r) => {
                              const newConds = [...r.conditions]
                              if (newConds.length > 1) {
                                newConds.splice(cIdx, 1)
                                return { ...r, conditions: newConds }
                              }
                              return r
                            })
                          }}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        updateLogicRule(idx, (r) => {
                          return {
                            ...r,
                            conditions: [
                              ...r.conditions,
                              { blockId: "", operator: "equals", value: "" },
                            ],
                          }
                        })
                      }}
                      className="mt-1 ml-4 self-start text-xs text-muted-foreground hover:text-foreground"
                    >
                      + Add condition
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default function FormEditorPage() {
  const params = useParams<{ formId: string }>()
  const router = useRouter()
  const formId = params.formId

  const [form, setForm] = React.useState<FormRecord | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const [presence, setPresence] = React.useState<PresenceUser[]>([])
  const [cursors, setCursors] = React.useState<Record<string, CursorPoint>>({})
  const [socketConnected, setSocketConnected] = React.useState(false)
  const socketRef = React.useRef<WebSocket | null>(null)
  const canvasRef = React.useRef<HTMLDivElement | null>(null)

  const [nameDraft, setNameDraft] = React.useState("")
  const [descriptionDraft, setDescriptionDraft] = React.useState("")
  const [publishedDraft, setPublishedDraft] = React.useState(false)
  const [themeDraft, setThemeDraft] = React.useState("minimal")
  const [slugDraft, setSlugDraft] = React.useState("")
  const [isQuizDraft, setIsQuizDraft] = React.useState(false)
  const [leaderboard, setLeaderboard] = React.useState<any[]>([])
  const [expiresAtDraft, setExpiresAtDraft] = React.useState("")
  const [activeTab, setActiveTab] = React.useState<
    "editor" | "settings" | "leaderboard"
  >("editor")
  const [savingMeta, setSavingMeta] = React.useState(false)

  const blocks = form?.schema_snapshot.blocks ?? []

  const sensors = useSensors(useSensor(PointerSensor))
  const [activeId, setActiveId] = React.useState<string | null>(null)

  const hydrateForm = React.useCallback((nextForm: FormRecord) => {
    setForm(nextForm)
    setNameDraft(nextForm.name)
    setDescriptionDraft(nextForm.description ?? "")
    setPublishedDraft(nextForm.is_published)
    setThemeDraft(nextForm.theme || "minimal")
    setSlugDraft(nextForm.slug || "")
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

  React.useEffect(() => {
    if (!formId) {
      return
    }

    const ws = new WebSocket(`${getWsBaseUrl()}/forms/${formId}/ws`)
    socketRef.current = ws

    ws.onopen = () => {
      setSocketConnected(true)
      setError(null)
    }

    ws.onclose = () => {
      setSocketConnected(false)
    }

    ws.onerror = () => {
      setSocketConnected(false)
      setError("Realtime connection failed")
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
        setCursors((current) => {
          const next = { ...current }
          delete next[incoming.userId]
          return next
        })
        return
      }

      if (incoming.type === "CURSOR_UPDATE") {
        setCursors((current) => ({
          ...current,
          [incoming.cursor.userId]: incoming.cursor,
        }))
        return
      }

      if (incoming.type === "EVENT_APPLIED") {
        setForm((current) => {
          if (!current) {
            return current
          }

          if (incoming.formEvent.event_type === "UPDATE_FORM_META") {
            const name = incoming.formEvent.payload.name
            const description = incoming.formEvent.payload.description
            const isPublished = incoming.formEvent.payload.is_published
            const evTheme = incoming.formEvent.payload.theme
            const evSlug = incoming.formEvent.payload.slug
            const evIsQuiz = incoming.formEvent.payload.is_quiz
            const evExpires = incoming.formEvent.payload.expires_at

            const next = {
              ...current,
              name: typeof name === "string" ? name : current.name,
              description:
                description === null || typeof description === "string"
                  ? description
                  : current.description,
              is_published:
                typeof isPublished === "boolean"
                  ? isPublished
                  : current.is_published,
              theme: typeof evTheme === "string" ? evTheme : current.theme,
              slug: typeof evSlug === "string" ? evSlug : current.slug,
              is_quiz:
                typeof evIsQuiz === "boolean" ? evIsQuiz : current.is_quiz,
              expires_at:
                evExpires !== undefined
                  ? (evExpires as string)
                  : current.expires_at,
            }
            setNameDraft(next.name)
            setDescriptionDraft(next.description ?? "")
            setPublishedDraft(next.is_published)
            setThemeDraft(next.theme)
            setSlugDraft(next.slug || "")
            setIsQuizDraft(next.is_quiz || false)
            setExpiresAtDraft(
              next.expires_at
                ? new Date(next.expires_at as string).toISOString().slice(0, 16)
                : ""
            )
            return next
          }

          const nextSnapshot = applyFormEvent(
            current.schema_snapshot,
            incoming.formEvent
          )
          return {
            ...current,
            schema_snapshot: nextSnapshot,
          }
        })
        return
      }

      if (incoming.type === "SCORE_UPDATE") {
        setLeaderboard((current) => {
          const next = [...current]
          const existing = next.findIndex(
            (x) => x.id === incoming.submission.id
          )
          if (existing > -1) {
            next[existing] = incoming.submission
          } else {
            next.push(incoming.submission)
          }
          return next.sort((a, b) => b.score - a.score)
        })
        return
      }

      if (incoming.type === "ERROR") {
        setError(incoming.message)
      }
    }

    return () => {
      ws.close()
      socketRef.current = null
      setSocketConnected(false)
    }
  }, [formId])

  const sendWsMessage = React.useCallback((payload: object) => {
    const ws = socketRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      throw new Error("Realtime connection is not ready")
    }
    ws.send(JSON.stringify(payload))
  }, [])

  const applyLocalEvent = React.useCallback((event: FormEventPayload) => {
    setForm((current) => {
      if (!current) {
        return current
      }

      if (event.event_type === "UPDATE_FORM_META") {
        const name = event.payload.name
        const description = event.payload.description
        const isPublished = event.payload.is_published
        const evTheme = event.payload.theme
        const evSlug = event.payload.slug
        const evIsQuiz = event.payload.is_quiz
        const evExpires = event.payload.expires_at
        return {
          ...current,
          name: typeof name === "string" ? name : current.name,
          description:
            description === null || typeof description === "string"
              ? description
              : current.description,
          is_published:
            typeof isPublished === "boolean"
              ? isPublished
              : current.is_published,
          theme: typeof evTheme === "string" ? evTheme : current.theme,
          slug: typeof evSlug === "string" ? evSlug : current.slug,
          is_quiz: typeof evIsQuiz === "boolean" ? evIsQuiz : current.is_quiz,
          expires_at:
            evExpires !== undefined
              ? (evExpires as string)
              : current.expires_at,
        }
      }

      return {
        ...current,
        schema_snapshot: applyFormEvent(current.schema_snapshot, event),
      }
    })
  }, [])

  const persistEvent = React.useCallback(
    async (eventPayload: FormEventPayload) => {
      applyLocalEvent(eventPayload)

      try {
        sendWsMessage({
          type: "EVENT",
          formEvent: eventPayload,
        })
      } catch {
        const updated = await apiFetch<FormRecord>(`/forms/${formId}/events`, {
          method: "POST",
          body: JSON.stringify(eventPayload),
        })
        hydrateForm(updated)
      }
    },
    [applyLocalEvent, formId, hydrateForm, sendWsMessage]
  )

  const addBlock = React.useCallback(
    async (index?: number) => {
      const block = defaultBlock()
      await persistEvent({
        event_type: "ADD_BLOCK",
        payload: { block },
      })

      if (typeof index === "number" && form) {
        const currentBlocks = form.schema_snapshot.blocks
        const newOrder = currentBlocks.map((b) => b.id)
        newOrder.splice(index, 0, block.id)
        await persistEvent({
          event_type: "REORDER_BLOCKS",
          payload: { order: newOrder },
        })
      }
    },
    [form, persistEvent]
  )

  const removeBlock = React.useCallback(
    async (id: string) => {
      await persistEvent({
        event_type: "REMOVE_BLOCK",
        payload: { id },
      })
    },
    [persistEvent]
  )

  const updateBlockLocal = React.useCallback(
    (id: string, updater: (block: FormBlock) => FormBlock) => {
      setForm((current) => {
        if (!current) {
          return current
        }
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
    isQuizDraft,
    expiresAtDraft,
  ])

  const pushCursor = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      const canvas = canvasRef.current
      if (!canvas || !socketConnected) {
        return
      }

      const rect = canvas.getBoundingClientRect()
      const x = Math.max(0, Math.min(rect.width, event.clientX - rect.left))
      const y = Math.max(0, Math.min(rect.height, event.clientY - rect.top))

      try {
        sendWsMessage({
          type: "CURSOR",
          cursor: {
            x,
            y,
          },
        })
      } catch {
        setSocketConnected(false)
      }
    },
    [sendWsMessage, socketConnected]
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    if (String(active.id).startsWith("new-")) {
      const type = active.data.current?.type
      if (type) {
        const block = defaultBlock()
        block.type = type

        if (type === "checkbox" || type === "multiple_choice") {
          block.config.options = [{ label: "Option 1", value: "opt1" }]
        }

        await persistEvent({
          event_type: "ADD_BLOCK",
          payload: { block },
        })

        if (form && over.id !== "canvas") {
          const currentBlocks = [...form.schema_snapshot.blocks, block]
          const overIndex = currentBlocks.findIndex((b) => b.id === over.id)
          const newOrder = currentBlocks.map((b) => b.id)
          const moved = arrayMove(newOrder, newOrder.length - 1, overIndex)
          await persistEvent({
            event_type: "REORDER_BLOCKS",
            payload: { order: moved },
          })
        }
      }
      return
    }

    if (active.id !== over.id && form) {
      const currentBlocks = form.schema_snapshot.blocks
      const oldIndex = currentBlocks.findIndex((b) => b.id === active.id)
      const newIndex = currentBlocks.findIndex((b) => b.id === over.id)

      const newOrder = currentBlocks.map((b) => b.id)
      const moved = arrayMove(newOrder, oldIndex, newIndex)

      await persistEvent({
        event_type: "REORDER_BLOCKS",
        payload: { order: moved },
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

  if (!form) {
    return (
      <div className="mx-auto max-w-4xl p-10">
        <p className="text-sm text-destructive">{error ?? "Form not found"}</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/dashboard")}
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
                <button
                  onClick={() => setActiveTab("leaderboard")}
                  className={`rounded-md px-3 py-1 text-sm font-medium ${activeTab === "leaderboard" ? "bg-background shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                >
                  Leaderboard
                </button>
              </div>
            </div>
          </div>
          <div className="inline-flex items-center gap-2 rounded-[8px] border border-border bg-card px-3 py-2 text-sm">
            <MousePointer2 className="h-4 w-4 text-muted-foreground" />
            {socketConnected ? "Realtime connected" : "Realtime disconnected"}
          </div>
        </header>

        {error ? (
          <div className="mb-4 rounded-[10px] border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

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
                <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
                  <div>
                    <p className="text-xs tracking-[0.2em] text-muted-foreground uppercase">
                      Form metadata
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Changes sync to other editors in real time.
                    </p>
                  </div>
                  <Button
                    onClick={() => void saveMeta()}
                    disabled={savingMeta}
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

                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    value={nameDraft}
                    onChange={(event) => setNameDraft(event.target.value)}
                    className="h-11 rounded-[8px] border border-input bg-background px-3 text-sm transition outline-none focus:border-ring"
                    placeholder="Form name"
                  />
                  <label className="flex items-center gap-3 rounded-[8px] border border-input bg-background px-3 text-sm">
                    <input
                      type="checkbox"
                      checked={publishedDraft}
                      onChange={(event) =>
                        setPublishedDraft(event.target.checked)
                      }
                    />
                    Published
                  </label>
                </div>
                <textarea
                  value={descriptionDraft}
                  onChange={(event) => setDescriptionDraft(event.target.value)}
                  className="mt-3 min-h-24 w-full rounded-[8px] border border-input bg-background px-3 py-2 text-sm transition outline-none focus:border-ring"
                  placeholder="Description"
                />

                <div className="mt-8 flex items-center justify-between">
                  <h2 className="text-lg font-medium">Blocks</h2>
                  <Button
                    onClick={() => void addBlock()}
                    variant="outline"
                    className="rounded-[8px]"
                  >
                    <FilePlus2 className="mr-2 h-4 w-4" />
                    Add block
                  </Button>
                </div>

                <div className="mt-4 space-y-3 pb-8" id="canvas">
                  <SortableContext
                    items={blocks.map((b) => b.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {blocks.length === 0 ? (
                      <div className="rounded-[10px] border border-dashed border-border bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground">
                        Drag and drop blocks here.
                      </div>
                    ) : (
                      <div className="flex min-h-[100px] flex-col gap-1">
                        {blocks.map((block) => (
                          <BlockItem
                            key={block.id}
                            block={block}
                            allBlocks={blocks}
                            isQuiz={form.is_quiz || false}
                            addBlockBase={(idx) => void addBlock(idx)}
                            onChange={updateBlockLocal}
                            onBlur={(id) => void persistBlock(id)}
                            onRemove={(id) => void removeBlock(id)}
                          />
                        ))}
                      </div>
                    )}
                  </SortableContext>
                </div>

                {Object.values(cursors).map((cursor) => (
                  <div
                    key={cursor.userId}
                    className="pointer-events-none absolute"
                    style={{ left: `${cursor.x}px`, top: `${cursor.y}px` }}
                  >
                    <div className="-translate-x-1/2 -translate-y-full rounded-[6px] bg-primary px-2 py-1 text-xs text-primary-foreground shadow">
                      {cursor.label}
                    </div>
                  </div>
                ))}
              </div>

              <aside className="rounded-[12px] border border-border bg-card p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Live collaborators</h3>
                </div>
                <div className="space-y-2">
                  {presence.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                      No other active editors.
                    </p>
                  ) : (
                    presence.map((user) => (
                      <div
                        key={user.userId}
                        className="flex items-center justify-between rounded-[8px] border border-border bg-background px-3 py-2"
                      >
                        <span className="text-sm font-medium">
                          {user.label}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          online
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 mb-4 flex items-center gap-2">
                  <Component className="h-4 w-4 text-muted-foreground" />
                  <h3 className="font-medium">Form Elements</h3>
                </div>
                <div className="flex flex-col gap-2">
                  <DraggableSidebarItem
                    type="short_text"
                    label="Text Question"
                    icon={FilePlus2}
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
                    icon={FilePlus2}
                  />
                  <DraggableSidebarItem
                    type="upi_payment"
                    label="UPI Payment"
                    icon={Component}
                  />
                </div>

                <div className="mt-6 rounded-[10px] border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                  Changes are event-sourced. Block edits, metadata updates, and
                  cursor movement sync across users in the same form.
                </div>
              </aside>
            </section>
          )}

          {activeTab === "settings" && (
            <div className="max-w-2xl space-y-6 rounded-[12px] border border-border bg-card p-6 shadow-sm">
              <div>
                <h2 className="mb-1 text-lg font-semibold">
                  Form Link & Access
                </h2>
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="text-sm font-medium">Public URL</label>
                    <div className="mt-1 flex gap-2">
                      <input
                        readOnly
                        className="flex-1 rounded-md border border-input bg-muted/50 px-3 py-2 text-sm"
                        value={
                          typeof window !== "undefined"
                            ? form.organization_slug
                              ? `${window.location.origin}/${form.organization_slug}/${form.slug}`
                              : `${window.location.origin}/f/${form.id}`
                            : ""
                        }
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const url = form.organization_slug
                            ? `${window.location.origin}/${form.organization_slug}/${form.slug}`
                            : `${window.location.origin}/f/${form.id}`
                          navigator.clipboard.writeText(url)
                        }}
                      >
                        Copy
                      </Button>
                    </div>
                    {!form.is_published && (
                      <p className="mt-1.5 flex items-center gap-1 text-xs font-medium text-amber-600">
                        Note: Form must be published for the link to work.
                      </p>
                    )}
                  </div>
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
                  <div>
                    <label className="text-sm font-medium">
                      End Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={expiresAtDraft}
                      onChange={(e) => setExpiresAtDraft(e.target.value)}
                      className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2"
                    />
                  </div>
                  <label className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={publishedDraft}
                      onChange={(e) => setPublishedDraft(e.target.checked)}
                    />
                    Published
                  </label>
                </div>
              </div>
              <div className="border-t border-border pt-6">
                <h2 className="mb-1 text-lg font-semibold">Quizzes</h2>
                <label className="mt-4 flex items-center gap-3">
                  <input
                    type="checkbox"
                    checked={isQuizDraft}
                    onChange={(e) => setIsQuizDraft(e.target.checked)}
                    className="h-4 w-4"
                  />
                  <span className="font-medium">Enable Quiz Mode</span>
                </label>
              </div>
              <div className="flex justify-end border-t border-border pt-6">
                <Button onClick={() => void saveMeta()} disabled={savingMeta}>
                  Save Settings
                </Button>
              </div>
            </div>
          )}

          {activeTab === "leaderboard" && (
            <div className="min-h-[400px] rounded-[12px] border border-border bg-card p-6 shadow-sm">
              <h2 className="mb-4 text-2xl font-bold">Live Leaderboard</h2>
              <div id="leaderboard-container" className="space-y-4">
                {leaderboard.length === 0 ? (
                  <div className="flex flex-col items-center rounded-lg border border-dashed bg-muted/20 p-12 text-center text-muted-foreground">
                    <span className="mb-3 text-4xl">🏆</span>
                    <p>Waiting for submissions...</p>
                  </div>
                ) : (
                  leaderboard.map((sub, idx) => (
                    <div
                      key={sub.id}
                      className="flex animate-in items-center justify-between rounded-lg border bg-card p-4 shadow-sm slide-in-from-bottom-2"
                    >
                      <div className="flex items-center gap-4">
                        <span className="w-8 text-2xl font-bold text-muted-foreground">
                          {idx + 1}.
                        </span>
                        <div>
                          <p className="font-semibold">
                            {sub.id.split("-")[0]}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Submitted at{" "}
                            {new Date(sub.submitted_at).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-xl font-bold text-primary">
                        {sub.score}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          pts
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          <DragOverlay>
            {activeId && String(activeId).startsWith("new-") ? (
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
