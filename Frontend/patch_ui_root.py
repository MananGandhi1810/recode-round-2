import sys
content = open("Frontend/app/dashboard/forms/[formId]/page.tsx").read()

old = """        const oldIndex = blocks.findIndex((b) => b.id === active.id)
        const newIndex = blocks.findIndex((b) => b.id === over.id)
        if (oldIndex !== -1 && newIndex !== -1) {"""
new = """        const oldIndex = blocks.findIndex((b) => b.id === active.id)
        let newIndex = blocks.findIndex((b) => b.id === over.id)
        if (over.id === "canvas-root") newIndex = blocks.length - 1

        if (oldIndex !== -1 && newIndex !== -1) {"""
content = content.replace(old, new)
open("Frontend/app/dashboard/forms/[formId]/page.tsx", "w").write(content)
