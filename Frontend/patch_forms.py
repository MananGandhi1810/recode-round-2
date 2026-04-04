import sys
content = open("Frontend/lib/forms.ts").read()

old = """  if (event.event_type === "ADD_BLOCK") {
    const block = event.payload.block as FormBlock | undefined
    if (block) {
      return { blocks: [...currentBlocks, block] }
    }
    return { blocks: currentBlocks }
  }"""
new = """  if (event.event_type === "ADD_BLOCK") {
    const block = event.payload.block as FormBlock | undefined
    const index = typeof event.payload.index === "number" ? event.payload.index : -1
    
    if (block) {
      if (index >= 0 && index <= currentBlocks.length) {
        const copy = [...currentBlocks]
        copy.splice(index, 0, block)
        return { blocks: copy }
      }
      return { blocks: [...currentBlocks, block] }
    }
    return { blocks: currentBlocks }
  }"""
content = content.replace(old, new)
open("Frontend/lib/forms.ts", "w").write(content)
