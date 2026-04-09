import GitHubProfileAnalyzer from '@/features/github/GitHubProfileAnalyzer'
import PRReviewSection from '@/features/github/PRReviewSection'
import { Github } from 'lucide-react'

export default function GitHubProfilePage() {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Github className="w-6 h-6 text-primary" />
            GitHub profile analytics
          </h1>
          <p className="text-muted text-sm mt-1">
            Explore public contribution patterns and language mix — same analytics model as the classic profile-summary app,
            integrated with your stack.
          </p>
        </div>
        <GitHubProfileAnalyzer />
      </div>

      <div className="border-t border-border pt-12">
        <PRReviewSection />
      </div>
    </div>
  )
}
