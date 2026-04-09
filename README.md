# ✨ Jadui Placement: The Agentic Career Powerhouse

![Banner](https://img.shields.io/badge/Status-Elite-amber?style=for-the-badge)
![Tech](https://img.shields.io/badge/Stack-Next.js%20|%20FastAPI%20|%20Supabase-blue?style=for-the-badge)
![AI](https://img.shields.io/badge/Engine-Gemini%20|%20Groq%20|%20Vapi-emerald?style=for-the-badge)

**Jadui Placement** is a high-fidelity, agentic Training & Placement (TPO) ecosystem designed to bridge the gap between student preparation and elite corporate standards. It’s not just a dashboard; it’s an AI-driven recruitment pipeline.

---

## 🚀 Key Ecosystem Modules

### 👑 The TPO Command Center (Admin)
A unified interface for Placement Officers to monitor the entire cohort's readiness.
*   **AI Batch Briefing**: Instantly identify top performers and critical skill gaps across the batch.
*   **Hiring Simulation**: Predict student-to-job matches based on tech-stack similarity.
*   **Private Administrative Vetting**: Leave internal notes and shortlist candidates for upcoming drives.
*   **Automated Workshop Agent**: AI clusters students with similar gaps and proposes targeted training sessions.

### 🎓 The Student Dashboard
An "Iron Man suit" for career growth.
*   **Master Readiness Radar**: Real-time sync of Resume, Technical (GitHub), Interview, and Consistency scores.
*   **AI Resume Intelligence**: Deep-parse resumes via Groq to identify strengths and high-impact boosters.
*   **Interactive Voice Interviews**: AI-driven mock interviews with real-time feedback using Vapi.
*   **GitHub Action Agent**: Automated PR reviews and technical bio generation based on commit history.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js 14, Tailwind CSS, Lucide Icons, Recharts |
| **Backend** | FastAPI (Python 3.14), Pydantic |
| **Database** | Supabase (PostgreSQL + Realtime) |
| **AI Intelligence** | Google Gemini (Batch Analytics), Groq (Resume Parsing) |
| **Voice / Comm** | Vapi (Interactive Voice Agent) |
| **Dev Tools** | GitHub API, Git Integration |

---

## 📦 Getting Started

### Prerequisites
- Node.js 18+
- Python 3.14+
- Supabase Project & URL
- API Keys: `GEMINI_API_KEY`, `GROQ_API_KEY`, `VAPI_API_KEY`, `GITHUB_TOKEN`

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Ravi-Dahiya-00/Jadui-placement.git
   cd agentic-ai-career-coach
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python -m venv .venv
   source .venv/bin/activate  # or .venv\Scripts\activate on Windows
   pip install -r requirements.txt
   uvicorn app.main:app --reload
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   npm run dev
   ```

---

## 🎨 Design Philosophy
The system follows a **"Deep Slate & Amber"** aesthetic—utilizing glass-morphism, subtle micro-animations, and a premium dark mode to ensure a state-of-the-art user experience for both students and administrators.

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
*Built with ❤️ by the Jadui Intelligence Team.*
