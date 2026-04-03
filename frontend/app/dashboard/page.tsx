"use client"

import * as React from "react"
import { Search, Plus, Blocks, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { apiFetch } from "@/lib/api"

type Organization = {
  id: string
  name: string
  slug: string
  created_by_id: string
}

export default function UserOrganizationsPage() {
  const router = useRouter()
  const [organizations, setOrganizations] = React.useState<Organization[]>([])
  const [loading, setLoading] = React.useState(true)

  const loadOrganizations = React.useCallback(async () => {
    try {
      const data = await apiFetch<Organization[]>("/organizations")
      setOrganizations(data)
    } catch {
      router.replace("/login")
    } finally {
      setLoading(false)
    }
  }, [router])

  React.useEffect(() => {
    void loadOrganizations()
  }, [loadOrganizations])

  return (
    <div className="flex w-full flex-col min-h-screen bg-[#111111] text-zinc-100 font-sans">
      <main className="flex-1 p-6 md:p-12 max-w-[1240px] mx-auto w-full mt-4">
        <h1 className="text-[32px] font-medium mb-12 tracking-tight">Your Organizations</h1>
        
        <div className="flex items-center justify-between mb-8">
          <div className="relative w-full max-w-[340px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <input 
              type="text" 
              placeholder="Search for an organization" 
              className="w-full pl-10 pr-4 py-2.5 bg-[#161616] border border-zinc-800 rounded-[8px] text-[15px] placeholder:text-zinc-600 focus:outline-none focus:border-zinc-700 transition-colors"
            />
          </div>
          <Button className="bg-[#128a5a] hover:bg-[#128a5a]/90 text-white border-0 shadow-none rounded-[6px] px-4 font-medium h-[36px] text-[14px]">
            <Plus className="mr-1.5 h-[18px] w-[18px]" />
            New organization
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {organizations.length === 0 ? (
              <div className="col-span-full text-center py-12 rounded-[10px] border border-zinc-800 bg-[#161616]">
                <p className="text-zinc-500">No organizations found. Create your first one!</p>
              </div>
            ) : (
              organizations.map((org) => (
                <Link key={org.id} href={`/dashboard/organizations/${org.id}`}>
                  <div className="flex items-center gap-4 p-[18px] rounded-[10px] border border-zinc-800/80 bg-[#161616] hover:bg-[#1f1f1f] transition-colors cursor-pointer group shadow-sm relative overflow-hidden">
                    <div className="flex items-center justify-center h-10 w-10 rounded-full bg-[#1c1c1c] border border-zinc-800 text-zinc-400 group-hover:text-zinc-300">
                      <Blocks size={20} strokeWidth={1.5} />
                    </div>
                    <div className="flex flex-col gap-0.5">
                      <h3 className="font-medium text-[15px] text-zinc-200">{org.name}</h3>
                      <p className="text-[13px] text-zinc-500">
                        Free Plan · /{org.slug}
                      </p>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  )
}

