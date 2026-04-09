import { Inter } from 'next/font/google'
import './globals.css'
import { AppProvider } from '@/context/AppContext'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata = {
  title: 'Agentic AI Career Coach — Your Personal Placement Mentor',
  description:
    'AI-powered career coaching platform that analyzes your resume, generates personalized roadmaps, conducts mock interviews, and tracks your placement readiness in real time.',
  keywords: ['AI career coach', 'placement preparation', 'resume analysis', 'mock interview', 'skill gap analysis'],
  authors: [{ name: 'Agentic AI' }],
  openGraph: {
    title: 'Agentic AI Career Coach',
    description: 'Personalized placement guidance powered by Agentic AI',
    type: 'website',
  },
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className="bg-background text-white antialiased">
        <AppProvider>
          {children}
        </AppProvider>
      </body>
    </html>
  )
}
