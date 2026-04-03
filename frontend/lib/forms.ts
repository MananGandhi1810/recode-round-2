export type LogicCondition = {
  blockId: string
  operator: "equals" | "not_equals" | "contains" | "is_empty" | "is_not_empty"
  value: string
}

export type LogicRule = {
  id: string
  action: "show" | "hide"
  conditionMatch: "all" | "any"
  conditions: LogicCondition[]
}

export type FormBlockConfig = {
  required?: boolean
  placeholder?: string | null
  helperText?: string | null
  minLength?: number | null
  maxLength?: number | null
  min?: number | null
  max?: number | null
  options?: Array<{ label: string; value: string }> | null
  maxFileSizeStr?: string | null
  allowedFileTypes?: string[] | null
  logic?: LogicRule[] | null
}

export type FormBlock = {
  id: string
  type: string
  label: string
  config: FormBlockConfig
}

export type FormSchemaSnapshot = {
  blocks: FormBlock[]
}

export type FormRecord = {
  id: string
  organization_id: string
  name: string
  description: string | null
  is_published: boolean
  schema_snapshot: FormSchemaSnapshot
  created_at: string
  updated_at: string
}

export type FormEventPayload = {
  event_type: string
  payload: Record<string, unknown>
}

function asBlocks(value: unknown): FormBlock[] {
  if (!Array.isArray(value)) {
    return []
  }
  return value.filter(Boolean) as FormBlock[]
}

export function applyFormEvent(snapshot: FormSchemaSnapshot, event: FormEventPayload): FormSchemaSnapshot {
  const currentBlocks = [...asBlocks(snapshot.blocks)]

  if (event.event_type === "ADD_BLOCK") {
    const block = event.payload.block as FormBlock | undefined
    if (block) {
      return { blocks: [...currentBlocks, block] }
    }
    return { blocks: currentBlocks }
  }

  if (event.event_type === "UPDATE_BLOCK") {
    const id = String(event.payload.id ?? "")
    const nextBlock = event.payload.block as FormBlock | undefined
    if (!id || !nextBlock) {
      return { blocks: currentBlocks }
    }
    return {
      blocks: currentBlocks.map((block) => (block.id === id ? nextBlock : block)),
    }
  }

  if (event.event_type === "REMOVE_BLOCK") {
    const id = String(event.payload.id ?? "")
    return { blocks: currentBlocks.filter((block) => block.id !== id) }
  }

  if (event.event_type === "REORDER_BLOCKS") {
    const order = Array.isArray(event.payload.order) ? (event.payload.order as string[]) : []
    const orderMap = new Map(order.map((id, index) => [id, index]))
    return {
      blocks: [...currentBlocks].sort((a, b) => {
        const ai = orderMap.get(a.id) ?? Number.MAX_SAFE_INTEGER
        const bi = orderMap.get(b.id) ?? Number.MAX_SAFE_INTEGER
        return ai - bi
      }),
    }
  }

  return { blocks: currentBlocks }
}

export function getWsBaseUrl() {
  const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000"
  if (apiBase.startsWith("https://")) {
    return apiBase.replace("https://", "wss://")
  }
  return apiBase.replace("http://", "ws://")
}
