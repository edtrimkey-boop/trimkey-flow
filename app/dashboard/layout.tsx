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
    <>
      <Sidebar userEmail={user.email ?? ''} />
      <div className="main-wrapper">
        <Header userEmail={user.email ?? ''} />
        <div className="content-area">
          {children}
        </div>
      </div>
    </>
  )
}
