'use client';

import { Brain, Github, ArrowRight, Eye, Terminal, Cpu, Network, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState, useRef } from 'react';

/* ───────── Typing animation for the terminal ───────── */
function useTyping(lines: string[], speed = 40, lineDelay = 800) {
  const [displayed, setDisplayed] = useState<string[]>([]);
  const [currentLine, setCurrentLine] = useState(0);
  const [currentChar, setCurrentChar] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (currentLine >= lines.length) { setDone(true); return; }
    if (currentChar <= lines[currentLine].length) {
      const timeout = setTimeout(() => {
        setDisplayed(prev => {
          const next = [...prev];
          next[currentLine] = lines[currentLine].slice(0, currentChar);
          return next;
        });
        setCurrentChar(c => c + 1);
      }, speed + Math.random() * 20);
      return () => clearTimeout(timeout);
    } else {
      const timeout = setTimeout(() => {
        setCurrentLine(l => l + 1);
        setCurrentChar(0);
      }, lineDelay);
      return () => clearTimeout(timeout);
    }
  }, [currentLine, currentChar, lines, speed, lineDelay]);

  return { displayed, done };
}

/* ───────── Live Graph Hero — the centerpiece ───────── */
function HeroGraph() {
  const [activeNode, setActiveNode] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const nodes = [
    { id: 'user', x: 40, y: 140, w: 130, label: 'User prompt', sub: '"Find today\'s news"', color: '#64748b', ring: '#475569' },
    { id: 'think1', x: 220, y: 60, w: 140, label: '💭 Reasoning', sub: 'Planning approach...', color: '#a78bfa', ring: '#7c3aed' },
    { id: 'search', x: 220, y: 220, w: 140, label: '🔍 web_search', sub: 'cybersecurity news', color: '#60a5fa', ring: '#2563eb' },
    { id: 'result', x: 430, y: 140, w: 140, label: '✓ tool_result', sub: '43 results found', color: '#34d399', ring: '#059669' },
    { id: 'think2', x: 430, y: 280, w: 140, label: '💭 Analyzing', sub: 'Evaluating sources...', color: '#a78bfa', ring: '#7c3aed' },
    { id: 'fetch', x: 640, y: 60, w: 140, label: '📄 web_fetch', sub: 'reading article...', color: '#60a5fa', ring: '#2563eb' },
    { id: 'write', x: 640, y: 200, w: 140, label: '✍️ file_write', sub: 'summary.md', color: '#fb923c', ring: '#ea580c' },
    { id: 'response', x: 830, y: 140, w: 140, label: '💬 Response', sub: 'Here\'s what I found...', color: '#34d399', ring: '#059669' },
  ];
  
  const edges = [
    [0, 1], [0, 2], [1, 3], [2, 3], [3, 4], [3, 5], [4, 6], [5, 7], [6, 7],
  ];

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setActiveNode(n => (n + 1) % nodes.length);
    }, 1200);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [nodes.length]);

  return (
    <div className="relative w-full overflow-hidden">
      {/* Ambient glow behind graph */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-violet-600/[0.07] rounded-full blur-[100px] pointer-events-none" />
      
      <svg viewBox="0 0 1010 340" className="w-full h-auto relative z-10" aria-label="Live AI reasoning graph">
        <defs>
          <filter id="nodeGlow">
            <feGaussianBlur stdDeviation="12" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          <linearGradient id="edgeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#334155" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#6366f1" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#334155" stopOpacity="0.3" />
          </linearGradient>
        </defs>

        {/* Grid dots */}
        {Array.from({ length: 50 }).map((_, i) =>
          Array.from({ length: 17 }).map((_, j) => (
            <circle key={`${i}-${j}`} cx={i * 20 + 10} cy={j * 20 + 10} r="0.5" fill="#1e293b" />
          ))
        )}

        {/* Edges */}
        {edges.map(([from, to], i) => {
          const a = nodes[from], b = nodes[to];
          const ax = a.x + a.w / 2, ay = a.y + 22;
          const bx = b.x + b.w / 2, by = b.y + 22;
          const isActive = activeNode === to || activeNode === from;
          return (
            <g key={`e${i}`}>
              <line x1={ax} y1={ay} x2={bx} y2={by}
                stroke={isActive ? '#6366f1' : '#1e293b'}
                strokeWidth={isActive ? 2 : 1}
                opacity={isActive ? 0.8 : 0.4}
                className="transition-all duration-500"
              />
              {isActive && (
                <circle r="3" fill="#a78bfa" opacity="0.9">
                  <animateMotion dur="0.8s" repeatCount="1" fill="freeze"
                    path={`M${ax},${ay} L${bx},${by}`} />
                </circle>
              )}
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((n, i) => {
          const isActive = activeNode === i;
          return (
            <g key={n.id} className="transition-all duration-300" style={{ opacity: i <= activeNode ? 1 : 0.15 }}>
              {/* Active glow */}
              {isActive && (
                <rect x={n.x - 4} y={n.y - 4} width={n.w + 8} height={52} rx={14}
                  fill={n.ring} opacity="0.15" filter="url(#nodeGlow)" />
              )}
              {/* Card */}
              <rect x={n.x} y={n.y} width={n.w} height={44} rx={10}
                fill={isActive ? '#0f172a' : '#0a0f1a'}
                stroke={isActive ? n.ring : '#1e293b'}
                strokeWidth={isActive ? 2 : 1}
              />
              {/* Label */}
              <text x={n.x + 10} y={n.y + 18} fill={isActive ? n.color : '#64748b'}
                fontSize="11" fontFamily="var(--font-mono), monospace" fontWeight="600">
                {n.label}
              </text>
              {/* Sublabel */}
              <text x={n.x + 10} y={n.y + 34} fill="#475569"
                fontSize="9" fontFamily="var(--font-mono), monospace">
                {n.sub}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ───────── Terminal component — shows raw → visual transformation ───────── */
function TerminalBlock() {
  const lines = [
    '$ openclaw agent --stream',
    '{"type":"thought","content":"Planning search strategy..."}',
    '{"type":"tool_call","name":"web_search","args":{"q":"CVE-2026"}}',
    '{"type":"tool_result","content":"Found 12 results"}',
    '{"type":"thought","content":"Analyzing severity..."}',
    '{"type":"file_write","path":"report.md"}',
  ];
  
  const { displayed, done } = useTyping(lines, 25, 400);
  
  return (
    <div className="relative rounded-xl border border-slate-800/80 bg-[#0a0f1a] overflow-hidden font-mono text-[11px] sm:text-xs">
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-slate-800/50 bg-slate-900/50">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
        <span className="ml-2 text-slate-600 text-[10px]">terminal — agent session</span>
      </div>
      <div className="p-4 space-y-1 min-h-[180px]">
        {displayed.map((line, i) => (
          <div key={i} className={`${i === 0 ? 'text-emerald-400' : 'text-slate-500'} ${line?.includes('thought') ? 'text-violet-400/70' : ''} ${line?.includes('tool_call') ? 'text-blue-400/70' : ''} ${line?.includes('tool_result') ? 'text-green-400/70' : ''} ${line?.includes('file_write') ? 'text-orange-400/70' : ''}`}>
            {line}
            {i === displayed.length - 1 && !done && (
              <span className="inline-block w-2 h-4 bg-slate-400 ml-0.5 animate-pulse" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ───────── Bento Feature Card ───────── */
function BentoCard({ children, className = '', href }: { children: React.ReactNode; className?: string; href?: string }) {
  const inner = (
    <div className={`group relative rounded-2xl border border-slate-800/60 bg-gradient-to-b from-slate-900/80 to-slate-950/80 overflow-hidden transition-all duration-500 hover:border-slate-700/60 hover:shadow-xl hover:shadow-violet-500/5 ${className}`}>
      {children}
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

/* ───────── Stats counter ───────── */
function AnimatedStat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-3xl sm:text-4xl font-bold font-mono bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
        {value}
      </div>
      <div className="text-xs text-slate-500 mt-1 uppercase tracking-wider">{label}</div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════ */
/* ═══              LANDING PAGE                  ═══ */
/* ═══════════════════════════════════════════════════ */

export default function LandingPage() {
  const [scrollY, setScrollY] = useState(0);
  
  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden noise-bg">
      
      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-slate-800/40 bg-slate-950/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-6 py-3 max-w-7xl mx-auto">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-lg">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold tracking-tight font-mono">SYNAPSE</span>
          </div>
          <div className="flex items-center gap-2">
            <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-white transition-colors text-xs font-mono">
              OpenClaw
            </a>
            <a href="https://github.com/AndriGitDev/synapse" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-white transition-colors text-sm">
              <Github className="w-4 h-4" />
            </a>
            <Link href="/app"
              className="flex items-center gap-1.5 px-4 py-2 bg-white/[0.08] hover:bg-white/[0.12] border border-white/[0.06] rounded-lg text-sm font-medium transition-all">
              Launch
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="relative pt-24 pb-4">
        {/* Ambient gradients */}
        <div className="absolute top-0 left-0 right-0 h-[600px] overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-violet-600/[0.08] rounded-full blur-[120px]"
            style={{ transform: `translateY(${scrollY * 0.1}px)` }} />
          <div className="absolute top-40 right-1/4 w-[400px] h-[400px] bg-indigo-600/[0.06] rounded-full blur-[100px]"
            style={{ transform: `translateY(${scrollY * 0.05}px)` }} />
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          {/* Eyebrow */}
          <div className="flex items-center gap-3 mb-8">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/20 bg-emerald-500/[0.05]">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-[11px] font-mono font-medium">LIVE</span>
            </div>
            <span className="text-slate-600 text-xs font-mono">Built for OpenClaw agents</span>
          </div>
          
          {/* Headline — left aligned, massive */}
          <h1 className="text-5xl sm:text-7xl lg:text-8xl font-bold tracking-tighter leading-[0.95] mb-6 max-w-4xl">
            <span className="block text-white">Watch AI agents</span>
            <span className="block bg-gradient-to-r from-violet-400 via-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              think in real-time
            </span>
          </h1>

          {/* Subhead */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-xl mb-8 leading-relaxed">
            Every reasoning step, tool call, and decision — visualized as a live interactive graph. 
            See what&apos;s really happening inside the black box.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap items-center gap-3 mb-12">
            <Link href="/app?mode=watch"
              className="group flex items-center gap-2 px-6 py-3.5 bg-white text-slate-950 rounded-xl font-semibold text-sm hover:bg-slate-100 transition-all shadow-lg shadow-white/10">
              <Eye className="w-4 h-4" />
              Watch Bubbi Think
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link href="/app"
              className="flex items-center gap-2 px-6 py-3.5 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-xl font-medium text-sm transition-all">
              Explore Demos
            </Link>
            <a href="https://github.com/AndriGitDev/synapse" target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3.5 text-slate-500 hover:text-white text-sm transition-colors">
              <Github className="w-4 h-4" />
              View Source
            </a>
          </div>
        </div>

        {/* ── Hero Graph — full width, the centerpiece ── */}
        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="relative rounded-2xl border border-slate-800/50 bg-[#060a14] overflow-hidden">
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800/40">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <span className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="text-[11px] text-slate-600 font-mono ml-2">synapse — bubbi session 3a995d</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                <span className="text-[11px] text-emerald-400/80 font-mono">streaming 8 events</span>
              </div>
            </div>
            {/* Graph */}
            <div className="p-2 sm:p-4">
              <HeroGraph />
            </div>
          </div>
        </div>
      </header>

      {/* ── Before/After — the transformation ── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 max-w-xl">
            <p className="text-xs font-mono text-violet-400 uppercase tracking-widest mb-3">The Problem</p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight mb-4">
              AI agents are <span className="text-slate-500">black boxes</span>
            </h2>
            <p className="text-slate-400 text-lg leading-relaxed">
              They read files, search the web, execute code, make decisions — but you only see the final answer. 
              SYNAPSE cracks open the box.
            </p>
          </div>

          {/* Before / After grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
            {/* Before: Terminal */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Terminal className="w-4 h-4 text-slate-600" />
                <span className="text-xs font-mono text-slate-600 uppercase tracking-widest">Raw agent output</span>
              </div>
              <TerminalBlock />
            </div>
            
            {/* After: Graph mini */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Network className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-mono text-violet-400 uppercase tracking-widest">SYNAPSE visualization</span>
              </div>
              <div className="relative rounded-xl border border-violet-500/20 bg-[#0a0f1a] overflow-hidden min-h-[180px]">
                <div className="p-6 flex flex-wrap gap-3 items-start">
                  {[
                    { label: '💭 Planning', color: 'violet' },
                    { label: '🔍 web_search', color: 'blue' },
                    { label: '✓ 12 results', color: 'emerald' },
                    { label: '💭 Analyzing', color: 'violet' },
                    { label: '✍️ report.md', color: 'orange' },
                  ].map((n, i) => (
                    <div key={i} className={`px-3 py-2 rounded-lg border text-xs font-mono
                      ${n.color === 'violet' ? 'border-violet-500/30 text-violet-400 bg-violet-500/[0.05]' : ''}
                      ${n.color === 'blue' ? 'border-blue-500/30 text-blue-400 bg-blue-500/[0.05]' : ''}
                      ${n.color === 'emerald' ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/[0.05]' : ''}
                      ${n.color === 'orange' ? 'border-orange-500/30 text-orange-400 bg-orange-500/[0.05]' : ''}
                    `}
                      style={{ animationDelay: `${i * 0.3}s`, animation: 'graph-node-in 0.5s ease-out forwards', opacity: 0 }}
                    >
                      {n.label}
                    </div>
                  ))}
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#0a0f1a] to-transparent pointer-events-none" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bento Features ── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 max-w-xl">
            <p className="text-xs font-mono text-violet-400 uppercase tracking-widest mb-3">Features</p>
            <h2 className="text-3xl sm:text-5xl font-bold tracking-tight">
              Everything you need to<br />understand AI reasoning
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Large card — Watch Bubbi */}
            <BentoCard className="sm:col-span-2 lg:col-span-2" href="/app?mode=watch">
              <div className="p-8 sm:p-10">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-xs font-mono text-emerald-400">LIVE NOW</span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-bold mb-3">Watch Bubbi Think</h3>
                <p className="text-slate-400 mb-6 max-w-lg">
                  Pick a command — cybersecurity news, random country facts, space discoveries, haiku, or history — 
                  and watch every reasoning step unfold as a live graph.
                </p>
                <div className="flex flex-wrap gap-2">
                  {['🔍 Cyber News', '🌍 Random Facts', '🚀 Space', '🎲 Haiku', '📅 History'].map(cmd => (
                    <span key={cmd} className="px-3 py-1.5 rounded-lg bg-white/[0.03] border border-white/[0.06] text-xs font-mono text-slate-400">
                      {cmd}
                    </span>
                  ))}
                </div>
              </div>
            </BentoCard>

            {/* Stats card */}
            <BentoCard className="flex items-center justify-center">
              <div className="p-8 space-y-6 w-full">
                <AnimatedStat value="~12h" label="AI dev time" />
                <AnimatedStat value="100%" label="AI-written code" />
                <AnimatedStat value="0" label="Lines by human" />
              </div>
            </BentoCard>

            {/* Demo mode */}
            <BentoCard href="/app">
              <div className="p-8">
                <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/10 w-fit mb-4">
                  <Brain className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Demo Sessions</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  4 pre-loaded sessions: multi-agent orchestration, website building, debugging, security audits. 
                  Full playback controls at 0.25–8× speed.
                </p>
              </div>
            </BentoCard>

            {/* Upload */}
            <BentoCard href="/app">
              <div className="p-8">
                <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/10 w-fit mb-4">
                  <Terminal className="w-5 h-5 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Upload & Visualize</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Drag & drop any OpenClaw session file. Instant graph visualization with full event detail 
                  on click. LangChain support coming soon.
                </p>
              </div>
            </BentoCard>

            {/* Multi-agent */}
            <BentoCard>
              <div className="p-8">
                <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/10 w-fit mb-4">
                  <Cpu className="w-5 h-5 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Multi-Agent</h3>
                <p className="text-sm text-slate-500 leading-relaxed">
                  Visualize orchestrators spawning sub-agents. Color-coded paths show which agent handles 
                  what — from research to writing to review.
                </p>
              </div>
            </BentoCard>
          </div>
        </div>
      </section>

      {/* ── Built by AI section ── */}
      <section className="py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="relative rounded-3xl border border-slate-800/40 bg-gradient-to-br from-[#0a0f1a] to-slate-950 overflow-hidden">
            {/* Subtle gradient accent */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-violet-600/[0.03] to-transparent pointer-events-none" />
            
            <div className="relative z-10 p-10 sm:p-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                <div>
                  <p className="text-xs font-mono text-violet-400 uppercase tracking-widest mb-4">The Story</p>
                  <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-6">
                    This entire project was built by an AI agent
                  </h2>
                  <p className="text-slate-400 leading-relaxed mb-6">
                    Data (the AI) designed the architecture, chose the tech stack, wrote every line of code, 
                    and made all design decisions — autonomously. The human provided the vision and the 
                    deadline. The AI did the rest.
                  </p>
                  <p className="text-slate-500 leading-relaxed text-sm">
                    ~12 hours of actual AI development time across 6 working days. Built with Next.js, React Flow, 
                    Tailwind CSS, Framer Motion, Pusher, and OpenClaw. Deployed on Vercel. Search powered by 
                    self-hosted SearXNG.
                  </p>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-2xl">🤖</div>
                    <div>
                      <div className="font-semibold text-sm">Data</div>
                      <div className="text-xs text-slate-500">AI Agent — Architect, Developer, Designer</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-2xl">👨‍💻</div>
                    <div>
                      <div className="font-semibold text-sm">Andri</div>
                      <div className="text-xs text-slate-500">Human — Vision, Feedback, Coffee</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                    <div className="text-2xl">🖖</div>
                    <div>
                      <div className="font-semibold text-sm">OpenClaw</div>
                      <div className="text-xs text-slate-500">The platform that makes autonomous AI agents possible</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.05] mb-8">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-emerald-400 text-xs font-mono">Bubbi is online right now</span>
          </div>
          <h2 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6">
            See it to believe it
          </h2>
          <p className="text-slate-400 text-lg mb-10 max-w-md mx-auto">
            Pick a command. Watch the graph build in real-time. 
            This is what AI reasoning looks like.
          </p>
          <Link href="/app?mode=watch"
            className="group inline-flex items-center gap-3 px-8 py-4 bg-white text-slate-950 rounded-xl font-bold text-lg hover:bg-slate-100 transition-all shadow-lg shadow-white/10">
            <Eye className="w-5 h-5" />
            Start Watching
            <ChevronRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-slate-800/20">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600 font-mono">
          <div className="flex items-center gap-4">
            <span>SYNAPSE</span>
            <span className="text-slate-800">•</span>
            <span>Built by <a href="https://andri.is" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">Andri</a> & <a href="https://blog.andri.is" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-white transition-colors">Data</a></span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">OpenClaw</a>
            <a href="https://github.com/AndriGitDev/synapse" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">GitHub</a>
            <a href="https://naglasupan.is" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">naglasúpan.is</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
