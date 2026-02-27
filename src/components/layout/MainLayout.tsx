import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { useState } from 'react'
import { usePrimaryColor } from '@/hooks/usePrimaryColor'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  usePrimaryColor()

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="lg:pl-64 pt-16">
        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
