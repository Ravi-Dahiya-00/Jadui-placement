import ChatInterface from '@/features/chat/ChatInterface'
import { MessageSquare } from 'lucide-react'

export default function ChatPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <MessageSquare className="w-6 h-6 text-secondary" />
          AI Mentor Chat
        </h1>
        <p className="text-muted text-sm mt-1">
          Your context-aware AI mentor — it knows your resume, progress, and goals.
        </p>
      </div>
      <ChatInterface />
    </div>
  )
}
