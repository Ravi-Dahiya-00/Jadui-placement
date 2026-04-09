import Link from 'next/link'
import { Zap, Github, Twitter, Linkedin, Mail } from 'lucide-react'

const LINKS = {
  Product: ['Features', 'How It Works', 'Pricing', 'Changelog'],
  Company: ['About', 'Blog', 'Careers', 'Press'],
  Legal:   ['Privacy Policy', 'Terms of Service', 'Cookie Policy'],
}

const SOCIALS = [
  { icon: Github,   href: '#', label: 'GitHub'   },
  { icon: Twitter,  href: '#', label: 'Twitter'  },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
  { icon: Mail,     href: '#', label: 'Email'    },
]

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface/50 relative z-10">
      {/* Main footer content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12">
          {/* Brand column */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow-sm">
                <Zap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">
                <span className="gradient-text-primary">Agentic</span>
                <span className="text-white"> AI</span>
              </span>
            </Link>
            <p className="text-muted text-sm leading-relaxed max-w-xs mb-6">
              The only AI career coach that truly knows you — your skills, your gaps, and your goals. 
              Built for students who want results, not just resources.
            </p>
            {/* Socials */}
            <div className="flex items-center gap-3">
              {SOCIALS.map((s) => {
                const Icon = s.icon
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="w-9 h-9 rounded-lg bg-card border border-border flex items-center justify-center text-muted hover:text-white hover:border-primary/30 hover:bg-primary/10 transition-all duration-200"
                  >
                    <Icon className="w-4 h-4" />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([category, links]) => (
            <div key={category}>
              <h4 className="text-white font-semibold text-sm mb-4">{category}</h4>
              <ul className="flex flex-col gap-3">
                {links.map((link) => (
                  <li key={link}>
                    <a href="#" className="text-muted text-sm hover:text-white transition-colors duration-200">
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-muted text-xs">
            © {new Date().getFullYear()} Agentic AI Career Coach. All rights reserved.
          </p>
          <p className="text-muted text-xs">
            Built with ❤️ using&nbsp;
            <span className="text-primary font-medium">Next.js</span>,&nbsp;
            <span className="text-secondary font-medium">LangGraph</span>&nbsp;&amp;&nbsp;
            <span className="text-accent font-medium">FastAPI</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
