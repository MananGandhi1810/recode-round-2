"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Loader2, Send } from "lucide-react"
import { apiFetch } from "@/lib/api"
import { toast } from "sonner"

interface SendWhatsappFormModalProps {
  formId: string
  children: React.ReactNode
}

export function SendWhatsappFormModal({ formId, children }: SendWhatsappFormModalProps) {
  const [phoneNumbers, setPhoneNumbers] = React.useState("")
  const [isLoading, setIsLoading] = React.useState(false)
  const [isOpen, setIsOpen] = React.useState(false)

  const handleSend = async () => {
    setIsLoading(true)
    const numbersArray = phoneNumbers
      .split("\n")
      .map((num) => num.trim())
      .filter(Boolean)

    if (numbersArray.length === 0) {
      toast.error("Please enter at least one phone number.")
      setIsLoading(false)
      return
    }

    try {
      await apiFetch(`/forms/${formId}/send-whatsapp`, {
        method: "POST",
        body: JSON.stringify({ phone_numbers: numbersArray }),
      })
      toast.success("Form sent via WhatsApp successfully!")
      setPhoneNumbers("")
      setIsOpen(false)
    } catch (error) {
      console.error("Failed to send form via WhatsApp:", error)
      toast.error("Failed to send form via WhatsApp. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Send Form via WhatsApp</DialogTitle>
          <DialogDescription>
            Enter phone numbers (one per line) to send this form via WhatsApp.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="phone-numbers">Phone Numbers</Label>
            <Textarea
              id="phone-numbers"
              placeholder="e.g.,
+1234567890
+1987654321"
              value={phoneNumbers}
              onChange={(e) => setPhoneNumbers(e.target.value)}
              rows={8}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="mr-2 h-4 w-4" />
            )}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
