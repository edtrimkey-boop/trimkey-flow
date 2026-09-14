import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/dashboard/sidebar'
import { Header } from '@/components/dashboard/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return (
    <div className="flex h-screen w-screen bg-[#0B111E] text-[#F1F5F9] overflow-hidden">
      {/* Sidebar */}
      <Sidebar userEmail={user.email ?? ''} />

      {/* Main Column */}
      <div className="flex-1 flex flex-col h-full min-w-0 overflow-x-hidden overflow-y-auto">
        <Header userEmail={user.email ?? ''} />
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>
      </div>
    </div>
  )
}
