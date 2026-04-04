import sys
content = open("Frontend/app/dashboard/forms/[formId]/page.tsx").read()

old = """  const handleDragEnd = async (event: DragEndEvent) => {
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
  }"""
new = """  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveId(null)

    if (over && active.id !== over.id) {
      if (active.data?.current?.isNew) {
        const newBlock = {
          id: crypto.randomUUID(),
          type: active.data.current.type as string,
          label: "",
          config: { required: false },
        }
        
        const overIndex = blocks.findIndex((b) => b.id === over.id)
        const insertIndex = overIndex !== -1 ? overIndex : blocks.length

        await persistEvent({
          event_type: "ADD_BLOCK",
          payload: { block: newBlock, index: insertIndex },
        })
      } else {
        const oldIndex = blocks.findIndex((b) => b.id === active.id)
        const newIndex = blocks.findIndex((b) => b.id === over.id)
        if (oldIndex !== -1 && newIndex !== -1) {
          const newOrder = arrayMove(blocks, oldIndex, newIndex).map((b) => b.id)
          await persistEvent({
            event_type: "REORDER_BLOCKS",
            payload: { order: newOrder },
          })
        }
      }
    }
  }"""
content = content.replace(old, new)
open("Frontend/app/dashboard/forms/[formId]/page.tsx", "w").write(content)
