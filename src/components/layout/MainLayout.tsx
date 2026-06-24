import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { BottomTabBar } from './BottomTabBar'
import { useState } from 'react'
import { usePrimaryColor } from '@/hooks/usePrimaryColor'

export default function MainLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  usePrimaryColor()

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      <div className="pt-14">
        <main className="py-6 pb-24 md:pb-6">
          <div className="mx-auto px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      <BottomTabBar />
    </div>
  )
}
