import Sidebar from '@/components/dashboard/Sidebar'
import TopBar  from '@/components/dashboard/TopBar'

export const metadata = {
  title: 'Dashboard — Agentic AI Career Coach',
}

export default function DashboardLayout({ children }) {
  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Persistent sidebar */}
      <Sidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
