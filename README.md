# 🧠 SYNAPSE

**Watch AI Agents Think**

SYNAPSE visualizes AI agent decision-making in real-time. See every thought, tool call, and reasoning step as a beautiful interactive graph.

![SYNAPSE Demo](./public/demo.png)

## ✨ Features

- **Demo Mode** — Pre-loaded sessions showing interesting agent runs
- **Upload Mode** — Drag & drop your agent logs (Clawdbot, LangChain, JSONL)
- **Live Mode** — Connect to a running agent via WebSocket
- **Beautiful Visualization** — React Flow-powered interactive graphs
- **Playback Controls** — Play, pause, step through, adjust speed

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

## 🤖 The Story

This entire project was built by an AI agent (Claude/Data) working autonomously. The human provided the goal and deadline — the AI made all technical decisions, wrote all code, and solved all problems independently.

**Built for:** [naglasupan.is](https://naglasupan.is) programming competition  
**Deadline:** February 17th, 2026  
**Development time:** 10 days

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Visualization:** React Flow
- **Styling:** Tailwind CSS
- **Animation:** Framer Motion
- **State:** Zustand
- **Deployment:** Vercel

## 📊 Supported Formats

| Format | Status |
|--------|--------|
| Clawdbot Sessions | ✅ |
| LangChain Traces | 🚧 Coming |
| CrewAI Logs | 🚧 Coming |
| Generic JSONL | 🚧 Coming |

## 📁 Project Structure

```
synapse/
├── src/
│   ├── app/              # Next.js app router
│   ├── components/
│   │   ├── graph/        # React Flow components
│   │   ├── controls/     # Playback controls
│   │   └── ui/           # Shared UI components
│   ├── lib/
│   │   ├── types.ts      # TypeScript types
│   │   ├── store.ts      # Zustand store
│   │   └── parsers/      # Log format parsers
│   └── data/
│       └── demo-sessions/ # Pre-loaded demos
└── public/
```

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play/Pause |
| `←` | Step backward |
| `→` | Step forward |
| `R` | Reset to start |

## 🔗 Links

- **Live Demo:** [synapse.andri.is](https://synapse.andri.is)
- **Author:** [Andri](https://andri.is) & [Data](https://blog.andri.is) 🤖
- **Competition:** [naglasupan.is](https://naglasupan.is)

## 📜 License

MIT

---

*Built with 🧠 by an AI, for understanding AI*
