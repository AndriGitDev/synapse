'use client';

import { Brain, Github, ArrowRight, Eye, Zap, Activity, Users, Sparkles } from 'lucide-react';
import Link from 'next/link';

/* ───────── Animated Graph Preview ───────── */
function GraphPreview() {
  const nodes = [
    { id: 'thought', x: 60, y: 100, label: 'Thinking…', color: '#8b5cf6', delay: '0s' },
    { id: 'tool', x: 250, y: 40, label: 'tool_call: search', color: '#3b82f6', delay: '0.8s' },
    { id: 'result', x: 250, y: 160, label: 'tool_result ✓', color: '#22c55e', delay: '1.6s' },
    { id: 'thought2', x: 440, y: 100, label: 'Reasoning…', color: '#8b5cf6', delay: '2.4s' },
    { id: 'write', x: 630, y: 40, label: 'file_write', color: '#f97316', delay: '3.2s' },
    { id: 'decision', x: 630, y: 160, label: 'Decision ✓', color: '#eab308', delay: '4s' },
  ];
  const edges = [
    { from: 0, to: 1 }, { from: 0, to: 2 }, { from: 1, to: 3 },
    { from: 2, to: 3 }, { from: 3, to: 4 }, { from: 3, to: 5 },
  ];

  return (
    <div className="relative w-full max-w-2xl mx-auto mt-12 mb-4">
      {/* Glow backdrop */}
      <div className="absolute -inset-4 bg-gradient-to-r from-indigo-600/8 via-purple-600/8 to-pink-600/8 rounded-3xl blur-3xl pointer-events-none" />
      <div className="relative rounded-2xl border border-slate-700/50 bg-slate-900/80 backdrop-blur-xl overflow-hidden">
        {/* Title bar */}
        <div className="flex items-center gap-1.5 px-4 py-3 border-b border-slate-800/50">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <span className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
          <span className="ml-3 text-[11px] text-slate-500 font-mono">synapse — live session</span>
          <div className="ml-auto flex items-center gap-1.5">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-[10px] text-green-400/70 font-mono">streaming</span>
          </div>
        </div>
        {/* Graph */}
        <div className="p-4 sm:p-6">
          <svg viewBox="0 0 750 200" className="w-full h-auto" aria-label="Animated graph showing AI reasoning flow">
            <defs>
              <pattern id="dots" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="0.6" fill="#1e293b" />
              </pattern>
              <filter id="glow"><feGaussianBlur stdDeviation="8" /></filter>
            </defs>
            <rect width="750" height="200" fill="url(#dots)" />

            {/* Edges */}
            {edges.map((e, i) => {
              const a = nodes[e.from], b = nodes[e.to];
              return (
                <line
                  key={i}
                  x1={a.x + 50} y1={a.y + 18} x2={b.x + 50} y2={b.y + 18}
                  stroke="#334155" strokeWidth="1.5" strokeDasharray="4 4"
                  className="graph-edge-anim"
                  style={{ animationDelay: nodes[e.to].delay }}
                />
              );
            })}

            {/* Nodes */}
            {nodes.map((n) => (
              <g key={n.id} className="graph-node-anim" style={{ animationDelay: n.delay }}>
                <rect x={n.x} y={n.y} width="100" height="36" rx="10"
                  fill={n.color} opacity="0.1" filter="url(#glow)" />
                <rect x={n.x} y={n.y} width="100" height="36" rx="10"
                  fill="#0f172a" stroke={n.color} strokeWidth="1.5" />
                <text x={n.x + 50} y={n.y + 22} textAnchor="middle"
                  fill={n.color} fontSize="10" fontFamily="ui-monospace, monospace" fontWeight="600">
                  {n.label}
                </text>
              </g>
            ))}
          </svg>
        </div>
        {/* Caption */}
        <div className="px-4 pb-4 text-center">
          <p className="text-[11px] text-slate-500">
            Every thought, tool call, and decision — visualized as an interactive graph
          </p>
        </div>
      </div>
    </div>
  );
}

/* ───────── Architecture Step ───────── */
function ArchStep({ icon: Icon, label, desc, color, last = false }: { 
  icon: typeof Zap; label: string; desc: string; color: string; last?: boolean 
}) {
  return (
    <>
      <div className="flex flex-col items-center text-center">
        <div className={`p-3 rounded-xl bg-gradient-to-br ${color} mb-3 shadow-lg`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-sm font-semibold">{label}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">{desc}</div>
      </div>
      {!last && (
        <>
          <ArrowRight className="w-4 h-4 text-slate-600 hidden sm:block flex-shrink-0 mx-2" />
          <div className="w-px h-6 bg-slate-700 sm:hidden" />
        </>
      )}
    </>
  );
}

/* ───────── Feature Card ───────── */
function FeatureCard({ icon: Icon, title, desc }: { icon: typeof Activity; title: string; desc: string }) {
  return (
    <div className="group p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/30 transition-all duration-300 hover:bg-slate-900/80">
      <div className="p-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/10 w-fit mb-4 group-hover:bg-indigo-500/15 transition-colors">
        <Icon className="w-5 h-5 text-indigo-400" />
      </div>
      <h3 className="text-base font-semibold mb-2">{title}</h3>
      <p className="text-sm text-slate-400 leading-relaxed">{desc}</p>
    </div>
  );
}

/* ───────── Landing Page ───────── */
export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* ── Navigation ── */}
      <nav className="relative z-20 flex items-center justify-between px-6 py-4 max-w-6xl mx-auto">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur-md opacity-40" />
            <div className="relative p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Brain className="w-4 h-4 text-white" />
            </div>
          </div>
          <span className="text-lg font-bold tracking-tight">SYNAPSE</span>
          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium uppercase tracking-wider">Beta</span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="https://github.com/AndriGitDev/synapse"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50 text-sm"
          >
            <Github className="w-4 h-4" />
            <span className="hidden sm:inline">GitHub</span>
          </a>
          <Link
            href="/app"
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm font-medium transition-all"
          >
            Open App
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </nav>

      {/* ── Hero ── */}
      <header className="relative">
        {/* Background effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[500px] bg-gradient-to-b from-indigo-600/15 via-purple-600/8 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 max-w-3xl mx-auto px-6 pt-20 pb-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs mb-8">
            <Sparkles className="w-3 h-3" />
            Real-time AI visualization
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            <span className="bg-gradient-to-b from-white via-white to-slate-400 bg-clip-text text-transparent">
              Watch AI agents
            </span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-violet-400 bg-clip-text text-transparent">
              think in real-time
            </span>
          </h1>
          
          <p className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed">
            Synapse visualizes AI agent decision-making as interactive node graphs. 
            See every thought, tool call, file operation, and decision as it happens.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/app?mode=watch"
              className="group flex items-center gap-3 px-7 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-semibold transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40"
            >
              <Eye className="w-5 h-5" />
              <div className="text-left">
                <div className="text-base">Watch Bubbi Think — Live</div>
                <div className="text-[11px] font-normal text-violet-200/60">Our demo AI agent, reasoning in real-time</div>
              </div>
              <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/app"
              className="flex items-center gap-2 px-6 py-4 bg-slate-800/80 hover:bg-slate-700/80 rounded-xl font-medium transition-all border border-slate-700/50 hover:border-slate-600/50"
            >
              Explore Demos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Graph preview */}
        <div className="relative z-10 max-w-4xl mx-auto px-6">
          <GraphPreview />
        </div>
      </header>

      {/* ── How it works ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">How it works</h2>
            <p className="text-slate-400 max-w-lg mx-auto">
              Synapse connects to your AI agent&apos;s event stream and renders its reasoning process as a beautiful interactive graph.
            </p>
          </div>

          {/* Architecture flow */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-2 mb-20">
            <ArchStep icon={Zap} label="AI Agent" desc="Runs tasks, emits events" color="from-blue-500 to-cyan-500" />
            <ArchStep icon={Activity} label="Pusher" desc="WebSocket relay" color="from-amber-500 to-orange-500" />
            <ArchStep icon={Brain} label="Synapse" desc="Renders the graph" color="from-indigo-500 to-purple-500" />
            <ArchStep icon={Users} label="Viewers" desc="Watch in real-time" color="from-emerald-500 to-green-500" last />
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FeatureCard icon={Activity} title="Live Streaming" desc="Watch agent reasoning unfold in real-time via WebSocket events" />
            <FeatureCard icon={Brain} title="Interactive Graph" desc="Navigate through thoughts, tool calls, and decisions as node graphs" />
            <FeatureCard icon={Users} title="Multi-Agent" desc="Visualize multi-agent orchestration with color-coded agent paths" />
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 px-6">
        <div className="max-w-lg mx-auto text-center">
          <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 mb-6">
            <Eye className="w-7 h-7 text-white" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-slate-950 animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Watch Bubbi Think — Live</h2>
          <p className="text-slate-400 mb-2 max-w-md mx-auto">
            Bubbi is our demo AI agent. Watch its entire thought process unfold in real-time — every reasoning step, tool call, and decision.
          </p>
          <p className="text-sm text-slate-500 mb-8 max-w-sm mx-auto">
            You&apos;ll see a live node graph stream in as Bubbi researches, analyzes, and reasons through problems.
          </p>
          <Link
            href="/app?mode=watch"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-semibold transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 text-lg"
          >
            <Eye className="w-5 h-5" />
            Start Watching
          </Link>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-8 px-6 border-t border-slate-800/30">
        <div className="max-w-4xl mx-auto flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-1.5">
            <Brain className="w-3.5 h-3.5" />
            <span>SYNAPSE</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="https://andri.is" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">
              Built by Andri
            </a>
            <a href="https://github.com/AndriGitDev/synapse" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
