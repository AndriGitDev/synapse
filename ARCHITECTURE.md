# 🧠 SYNAPSE — Architecture Document

**Project:** AI Agent Thought Visualizer  
**Author:** Data (AI Agent)  
**Created:** 2026-02-07  
**Deadline:** 2026-02-17  

---

## 🎯 Vision

SYNAPSE lets you watch AI agents think. Every decision, tool call, file operation, and reasoning step visualized as a beautiful interactive graph.

---

## 🏗️ Core Features (MVP)

### 1. **Demo Mode** (Day 1-3)
- Pre-loaded sessions showing interesting agent runs
- Playback controls (play, pause, speed, step)
- Beautiful node graph visualization

### 2. **Upload Mode** (Day 4-5)
- Drag & drop agent logs
- Support formats:
  - Clawdbot session JSON
  - LangChain traces
  - Generic JSONL tool-call format

### 3. **Live Mode** (Day 6-7)
- WebSocket connection to running agent
- Real-time graph updates
- "Currently thinking..." indicators

### 4. **Polish** (Day 8-10)
- Animations, transitions
- Mobile responsive
- Demo video
- Deploy & submit

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|------------|-----|
| Framework | Next.js 15 (App Router) | Fast, modern, Vercel-native |
| Visualization | React Flow | Best graph library, maintained |
| Styling | Tailwind CSS | Rapid styling |
| Animation | Framer Motion | Smooth transitions |
| State | Zustand | Simple, performant |
| WebSocket | Native WS / Socket.io | Live streaming |
| Deployment | Vercel | Free tier, instant deploys |

---

## 📊 Data Model

```typescript
interface AgentSession {
  id: string;
  name: string;
  agent: string; // "clawdbot" | "langchain" | "crewai" | "generic"
  startedAt: Date;
  events: AgentEvent[];
}

interface AgentEvent {
  id: string;
  timestamp: Date;
  type: "thought" | "tool_call" | "tool_result" | "file_read" | "file_write" | "decision" | "error";
  content: string;
  metadata?: Record<string, any>;
  parentId?: string; // For tree structure
}
```

---

## 🎨 UI Concept

```
┌─────────────────────────────────────────────────────────────┐
│  SYNAPSE                              [Demo] [Upload] [Live]│
├─────────────────────────────────────────────────────────────┤
│                                                             │
│     ┌─────────┐                                             │
│     │ THOUGHT │                                             │
│     │ "User   │                                             │
│     │ wants.."│                                             │
│     └────┬────┘                                             │
│          │                                                  │
│          ▼                                                  │
│     ┌─────────┐      ┌─────────┐                           │
│     │TOOL CALL│──────│ RESULT  │                           │
│     │ web_    │      │ Found 5 │                           │
│     │ search  │      │ results │                           │
│     └────┬────┘      └─────────┘                           │
│          │                                                  │
│          ▼                                                  │
│     ┌─────────┐                                             │
│     │DECISION │                                             │
│     │ "Best   │                                             │
│     │ result.."│                                            │
│     └─────────┘                                             │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  ▶ Playing  ━━━━━━━━━━━●━━━━━━━━━━━━  Event 12/47   [1x]   │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
synapse/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Landing/Demo mode
│   │   ├── upload/page.tsx    # Upload mode
│   │   ├── live/page.tsx      # Live connection mode
│   │   └── layout.tsx
│   ├── components/
│   │   ├── graph/
│   │   │   ├── SynapseGraph.tsx
│   │   │   ├── nodes/
│   │   │   │   ├── ThoughtNode.tsx
│   │   │   │   ├── ToolCallNode.tsx
│   │   │   │   └── ResultNode.tsx
│   │   │   └── edges/
│   │   ├── controls/
│   │   │   ├── PlaybackControls.tsx
│   │   │   └── SpeedControl.tsx
│   │   └── ui/
│   ├── lib/
│   │   ├── parsers/
│   │   │   ├── clawdbot.ts
│   │   │   ├── langchain.ts
│   │   │   └── generic.ts
│   │   ├── store.ts
│   │   └── types.ts
│   └── data/
│       └── demo-sessions/
├── public/
├── package.json
└── README.md
```

---

## 📅 Sprint Plan

### Day 1-2: Foundation ✨
- [x] Architecture document
- [x] Next.js project setup
- [x] React Flow basic integration
- [x] Core data types
- [x] Basic node components
- [x] Playback controls
- [x] Demo session data
- [x] GitHub repo created

### Day 3: Demo Mode 🎬
- [ ] Demo session data (record real Clawdbot session)
- [ ] Playback engine
- [ ] Timeline controls

### Day 4-5: Upload Mode 📤
- [ ] File upload UI
- [ ] Clawdbot parser
- [ ] LangChain parser
- [ ] Generic format support

### Day 6-7: Live Mode ⚡
- [ ] WebSocket server
- [ ] Real-time graph updates
- [ ] Connection UI

### Day 8: Polish 💅
- [ ] Animations
- [ ] Loading states
- [ ] Error handling
- [ ] Mobile responsive

### Day 9: Documentation 📝
- [ ] README
- [ ] Demo video
- [ ] Submission text

### Day 10: Ship 🚀
- [ ] Final testing
- [ ] Deploy to Vercel
- [ ] Submit to naglasupan.is

---

## 🔗 Resources

- React Flow: https://reactflow.dev
- Framer Motion: https://www.framer.com/motion/
- Zustand: https://zustand-demo.pmnd.rs/

---

*Let's build something beautiful.* 🖖
