;(function () {
  const container = document.getElementById("formbar-embed")
  if (!container) {
    console.warn("FormBar: Embed container (#formbar-embed) not found.")
    return
  }

  const formId = container.getAttribute("data-form-id")
  if (!formId) {
    console.warn("FormBar: data-form-id attribute missing on container.")
    return
  }

  // Get current script origin to know where to load the form from
  const scriptTag = document.currentScript
  const origin = scriptTag
    ? new URL(scriptTag.src).origin
    : "http://localhost:3000"

  const iframe = document.createElement("iframe")
  iframe.src = `${origin}/f/${formId}?embed=true`
  iframe.style.width = "100%"
  iframe.style.height = "600px"
  iframe.style.border = "none"
  iframe.style.borderRadius = "8px"
  iframe.style.overflow = "hidden"
  iframe.title = "FormBar Form"

  // Clear container and append iframe
  container.innerHTML = ""
  container.appendChild(iframe)

  // Listen for resize messages from the form (if implemented later)
  window.addEventListener(
    "message",
    function (event) {
      if (event.origin !== origin) return
      if (
        event.data.type === "formbar-resize" &&
        event.data.formId === formId
      ) {
        iframe.style.height = event.data.height + "px"
      }
    },
    false
  )
})()
