# 🧠 SYNAPSE

**Watch AI Agents Think — In Real-Time**

SYNAPSE visualizes AI agent decision-making as interactive node graphs. See every thought, tool call, file operation, and decision as it happens.

**🏆 Built for the [naglasupan.is](https://naglasupan.is) programming competition**

[![Live Demo](https://img.shields.io/badge/Live_Demo-synapse.andri.is-violet?style=for-the-badge)](https://synapse.andri.is)

---

## ✨ Features

- **👁️ Watch Bubbi** — Watch our demo AI agent (Bubbi) think in real-time. Pick from 5 commands and see the entire reasoning process unfold as an interactive graph
- **🎬 Demo Mode** — Pre-loaded sessions showing AI agents solving real problems
- **📤 Upload Mode** — Drag & drop your own OpenClaw/Clawdbot session files
- **⚡ Live Mode** — Connect to any AI agent via WebSocket for real-time streaming
- **🎨 Interactive Graph** — React Flow-powered node visualization with color-coded event types
- **▶️ Playback Controls** — Play, pause, step through at 1–8× speed
- **🔍 Event Details** — Click any node to see full context
- **🤖 Multi-Agent** — Visualize orchestrators spawning sub-agents

## 🤖 The Story

> This entire project was designed, architected, and coded by an AI agent (Data) working autonomously. The human (Andri) provided the goal and deadline — the AI made all technical and design decisions independently.

**Development time:** 10 days  
**Lines written by AI:** All of them  
**Human contribution:** Vision, feedback, and coffee ☕

## 🚀 Quick Start

```bash
git clone https://github.com/AndriGitDev/synapse.git
cd synapse
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and explore!

## 🎮 Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Step backward |
| `→` | Step forward |
| `R` | Reset to start |

## 📊 Demo Sessions

1. **Multi-Agent Orchestration** — Watch an orchestrator delegate to specialized sub-agents
2. **Building a Landing Page** — See an AI create a website from scratch
3. **Debugging a 500 Error** — Follow along as bugs get squashed
4. **Security Vulnerability Scan** — Watch an AI audit code for security issues

## 👁️ Watch Bubbi Live

The "Watch Bubbi" mode lets visitors trigger an AI agent and watch it think in real-time. Bubbi can:

- 🔍 Search for today's cybersecurity news
- 🌍 Pick a random country and find obscure facts
- 🚀 Find the latest space/astronomy news
- 🎲 Compose a haiku about the current moment
- 📅 Discover what happened on this day in history

### How It Works

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  User picks  │     │   Pusher    │     │   SYNAPSE   │
│  a command   │ ──▶ │   (Cloud)   │ ──▶ │  (Frontend) │
└──────┬───────┘     └──────┬──────┘     └─────────────┘
       │                    │
       ▼                    ▼
┌─────────────┐     ┌─────────────┐
│  Cloud       │ ◀── │   OpenClaw  │
│  Bridge      │     │   (Agent)   │
└─────────────┘     └─────────────┘
       │
       └── Polls session JSONL files
           and pushes events to Pusher
```

### Setup (Self-Hosting)

1. Create a free [Pusher](https://pusher.com) account
2. Copy `.env.example` to `.env.local` and fill in credentials
3. Run the cloud bridge on the same machine as your OpenClaw agent:

```bash
node scripts/cloud-bridge.js
```

4. Deploy the Next.js app (Vercel, etc.) with the same env vars
5. Visitors can now watch your agent think in real-time!

## 🔌 Connecting Any Agent (Live Mode)

### Option 1: OpenClaw/Clawdbot Bridge

```bash
# Start the bridge (watches session files automatically)
node scripts/clawdbot-bridge.js

# Start SYNAPSE
npm run dev

# Connect in SYNAPSE → Live Mode → ws://localhost:8080/synapse
```

### Option 2: Universal Pipe

Stream any agent's output to SYNAPSE:

```bash
your-agent --stream | node scripts/synapse-pipe.js
your-agent 2>&1 | node scripts/synapse-pipe.js --text
```

### Option 3: Direct WebSocket

```javascript
const ws = new WebSocket('ws://localhost:8080/synapse');

ws.send(JSON.stringify({
  type: 'session_start',
  session: { id: 'my-session', name: 'My Agent', agent: 'generic' }
}));

ws.send(JSON.stringify({
  type: 'event',
  event: {
    id: 'e1',
    type: 'thought',
    content: 'Analyzing the problem...',
    parentId: null,
    timestamp: new Date().toISOString(),
  }
}));
```

### Event Types

| Type | Color | Use For |
|------|-------|---------|
| `thought` | 💜 Purple | Reasoning, analysis, planning |
| `tool_call` | 💙 Blue | Calling tools, running commands |
| `tool_result` | 💚 Green | Tool outputs, success |
| `file_read` | 🩵 Cyan | Reading files |
| `file_write` | 🧡 Orange | Writing/editing files |
| `decision` | 💛 Yellow | Decisions, branching points |
| `error` | ❤️ Red | Errors, failures |
| `user_message` | 🩶 Gray | User input |
| `assistant_message` | 💙 Indigo | Agent responses |

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 15 |
| Visualization | React Flow |
| Styling | Tailwind CSS |
| Animation | Framer Motion |
| State | Zustand |
| Real-time | Pusher |
| Search | SearXNG (self-hosted) |
| Agent | OpenClaw |
| Deployment | Vercel |

## 📁 Project Structure

```
synapse/
├── src/
│   ├── app/                 # Next.js app router
│   │   ├── api/trigger/     # Trigger endpoint for Bubbi
│   │   └── app/             # Main app page
│   ├── components/
│   │   ├── graph/           # React Flow visualization
│   │   ├── controls/        # Playback UI
│   │   ├── live/            # Live connection components
│   │   └── ui/              # Shared components (TriggerButton, etc.)
│   ├── lib/
│   │   ├── types.ts         # TypeScript definitions
│   │   ├── store.ts         # Zustand state
│   │   ├── pusher-client.ts # Pusher connection
│   │   ├── usePusherWatch.ts # React hook for live watching
│   │   └── parsers/         # Session format parsers
│   └── data/
│       └── demo-sessions/   # Pre-loaded demos
├── scripts/
│   ├── cloud-bridge.js      # Pusher bridge (polls JSONL → Pusher)
│   ├── clawdbot-bridge.js   # WebSocket bridge for local dev
│   ├── synapse-pipe.js      # Universal stdin pipe
│   └── demo-server.js       # Demo WebSocket server
└── public/
```

## 🔗 Links

- **Live Demo:** [synapse.andri.is](https://synapse.andri.is)
- **Author:** [Data](https://blog.andri.is) 🤖 & [Andri](https://andri.is)
- **Competition:** [naglasupan.is](https://naglasupan.is)
- **OpenClaw:** [openclaw.ai](https://openclaw.ai)

## 📜 License

MIT — Use it, fork it, learn from it.

---

*Built with 🧠 by an AI, for understanding AI* 🖖
