# 🧠 SYNAPSE

**Watch AI Agents Think**

SYNAPSE visualizes AI agent decision-making in real-time. See every thought, tool call, and reasoning step as a beautiful interactive graph.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/AndriGitDev/synapse)

## ✨ Features

- **🎬 Demo Mode** — Pre-loaded sessions showing AI agents in action
- **📤 Upload Mode** — Drag & drop your Clawdbot session files
- **⚡ Live Mode** — Real-time WebSocket streaming from any agent
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

## 🔌 Connecting Agents (Live Mode)

SYNAPSE can visualize **any AI agent** in real-time via WebSocket.

### Option 1: Clawdbot Bridge (Recommended)

Automatically watches your Clawdbot sessions and streams to SYNAPSE:

```bash
# Terminal 1: Start the bridge
node scripts/clawdbot-bridge.js

# Terminal 2: Start SYNAPSE
npm run dev

# Then:
# 1. Open SYNAPSE → Live Mode
# 2. Connect to: ws://localhost:8080/synapse
# 3. Chat with Clawdbot — watch it think!
```

### Option 2: Universal Pipe

Stream **any agent's output** to SYNAPSE:

```bash
# Pipe JSON output
your-agent --stream | node scripts/synapse-pipe.js

# Pipe plain text
your-agent 2>&1 | node scripts/synapse-pipe.js --text

# Named session
your-agent | node scripts/synapse-pipe.js --name "My Agent"
```

### Option 3: Direct WebSocket Integration

Send events directly from your code:

```javascript
const ws = new WebSocket('ws://localhost:8080/synapse');

// Start session
ws.send(JSON.stringify({
  type: 'session_start',
  session: { id: 'my-session', name: 'My Agent', agent: 'generic' }
}));

// Send events
ws.send(JSON.stringify({
  type: 'event',
  event: {
    id: 'e1',
    type: 'thought',      // thought|tool_call|tool_result|file_read|file_write|error|user_message|assistant_message
    content: 'Analyzing the problem...',
    parentId: null,       // Chain events together
    timestamp: new Date().toISOString(),
    metadata: {}          // Optional: { tool: 'exec', file: 'app.ts', ... }
  }
}));

// End session
ws.send(JSON.stringify({ type: 'session_end' }));
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

## 📤 Supported Formats

| Format | Status |
|--------|--------|
| Clawdbot Sessions | ✅ Full support |
| WebSocket Live | ✅ Full support |
| Universal Pipe | ✅ Full support |
| LangChain Traces | 🚧 Coming soon |
| CrewAI Logs | 🚧 Planned |

## 🔗 Links

- **Live Demo:** [synapse.andri.is](https://synapse.andri.is)
- **Author:** [Data](https://blog.andri.is) 🤖 & [Andri](https://andri.is)
- **Competition:** [naglasupan.is](https://naglasupan.is)

## 📜 License

MIT — Use it, fork it, learn from it.

---

*Built with 🧠 by an AI, for understanding AI*
