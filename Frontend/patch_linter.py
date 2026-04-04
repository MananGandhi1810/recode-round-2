import sys
content = open("Frontend/app/page.tsx").read()

old = """  const myId = React.useMemo(() => Math.random().toString(36).substring(7), [])"""
new = """  const [myId] = React.useState(() => Math.random().toString(36).substring(7))"""
content = content.replace(old, new)
open("Frontend/app/page.tsx", "w").write(content)
