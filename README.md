# 🧠 SYNAPSE

**Watch AI Agents Think**

SYNAPSE visualizes AI agent decision-making in real-time. See every thought, tool call, and reasoning step as a beautiful interactive graph.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AndriGitDev/synapse)

## ✨ Features

- **🎬 Demo Mode** — Pre-loaded sessions showing AI agents in action
- **📤 Upload Mode** — Drag & drop your Clawdbot session files
- **⚡ Live Mode** — Real-time WebSocket streaming (coming soon)
- **🎨 Beautiful Graph** — React Flow-powered interactive visualization
- **▶️ Playback Controls** — Play, pause, step through at 1-8x speed
- **🔍 Event Details** — Click any node for full context

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/AndriGitDev/synapse.git
cd synapse

# Install
npm install

# Run
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and hit play!

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Step backward |
| `→` | Step forward |
| `R` | Reset to start |

## 📊 Demo Sessions

1. **Building a Landing Page** — Watch an AI create a website from scratch
2. **Debugging a 500 Error** — Follow along as bugs get squashed
3. **Security Vulnerability Scan** — See an AI audit code for security issues

## 🤖 The Story

> This entire project was coded by an AI agent (Claude/Data) working autonomously. The human provided the goal and deadline — the AI made all technical and design decisions independently.

**Built for:** [naglasupan.is](https://naglasupan.is) programming competition  
**Development time:** 10 days  
**Lines written by AI:** All of them

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 |
| Visualization | React Flow |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| State | Zustand |
| Deployment | Vercel |

## 📁 Project Structure

```
synapse/
├── src/
│   ├── app/                 # Next.js app router
│   ├── components/
│   │   ├── graph/           # React Flow visualization
│   │   ├── controls/        # Playback UI
│   │   └── ui/              # Shared components
│   ├── lib/
│   │   ├── types.ts         # TypeScript definitions
│   │   ├── store.ts         # Zustand state
│   │   └── parsers/         # Session format parsers
│   └── data/
│       └── demo-sessions/   # Pre-loaded demos
└── public/
```

## 📤 Supported Formats

| Format | Status |
|--------|--------|
| Clawdbot Sessions | ✅ Full support |
| LangChain Traces | 🚧 Coming soon |
| CrewAI Logs | 🚧 Planned |
| Generic JSONL | 🚧 Planned |

## 🔗 Links

- **Live Demo:** [synapse.andri.is](https://synapse.andri.is)
- **Author:** [Data](https://blog.andri.is) 🤖 & [Andri](https://andri.is)
- **Competition:** [naglasupan.is](https://naglasupan.is)

## 📜 License

MIT — Use it, fork it, learn from it.

---

*Built with 🧠 by an AI, for understanding AI*
