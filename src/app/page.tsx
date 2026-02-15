'use client';

import { Brain, Github, ArrowRight, Eye, Zap, Activity, Users } from 'lucide-react';
import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white overflow-x-hidden">
      {/* Hero */}
      <header className="relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-gradient-to-b from-indigo-600/20 via-purple-600/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        
        <nav className="relative z-10 flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl blur-md opacity-50" />
              <div className="relative p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                <Brain className="w-5 h-5 text-white" />
              </div>
            </div>
            <span className="text-lg font-bold tracking-tight">SYNAPSE</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-medium">BETA</span>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="https://github.com/AndriGitDev/synapse"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-1.5 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-slate-800/50"
            >
              <Github className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">GitHub</span>
            </a>
            <Link
              href="/app"
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-lg text-sm font-medium transition-all shadow-lg shadow-indigo-500/20"
            >
              Open App
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </nav>

        <div className="relative z-10 max-w-4xl mx-auto px-6 pt-16 pb-24 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm mb-8">
            <Activity className="w-3.5 h-3.5" />
            Real-time AI visualization
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent">
            Watch AI agents<br />think in real-time
          </h1>
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Synapse visualizes AI agent decision-making as interactive node graphs.
            See every thought, tool call, file operation, and decision as it happens.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/app?mode=watch"
              className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-semibold transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 text-base"
            >
              <Eye className="w-5 h-5" />
              Watch Bubbi Live
            </Link>
            <Link
              href="/app"
              className="flex items-center gap-2 px-6 py-3.5 bg-slate-800 hover:bg-slate-700 rounded-xl font-medium transition-all border border-slate-700 text-base"
            >
              Explore Demos
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </header>

      {/* How it works */}
      <section className="py-20 px-6 border-t border-slate-800/50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4">How it works</h2>
          <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto">
            Synapse connects to your AI agent&apos;s event stream and renders its reasoning process as a beautiful interactive graph.
          </p>

          {/* Architecture diagram */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-20">
            {[
              { icon: Zap, label: 'AI Agent', desc: 'Runs tasks, emits events', color: 'from-blue-500 to-cyan-500' },
              { icon: Activity, label: 'Pusher', desc: 'WebSocket relay', color: 'from-amber-500 to-orange-500' },
              { icon: Brain, label: 'Synapse', desc: 'Renders the graph', color: 'from-indigo-500 to-purple-500' },
              { icon: Users, label: 'Viewers', desc: 'Watch in real-time', color: 'from-emerald-500 to-green-500' },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-4 sm:gap-6">
                <div className="flex flex-col items-center text-center w-28">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${step.color} mb-3 shadow-lg`}>
                    <step.icon className="w-6 h-6 text-white" />
                  </div>
                  <div className="text-sm font-semibold">{step.label}</div>
                  <div className="text-[11px] text-slate-500">{step.desc}</div>
                </div>
                {i < 3 && (
                  <ArrowRight className="w-5 h-5 text-slate-600 hidden sm:block flex-shrink-0" />
                )}
              </div>
            ))}
          </div>

          {/* Features grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { title: 'Live Streaming', desc: 'Watch agent reasoning unfold in real-time via WebSocket events', icon: Activity },
              { title: 'Interactive Graph', desc: 'Navigate through thoughts, tool calls, and decisions as node graphs', icon: Brain },
              { title: 'Multi-Agent', desc: 'Visualize multi-agent orchestration with color-coded agent paths', icon: Users },
            ].map((f) => (
              <div key={f.title} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors">
                <f.icon className="w-8 h-8 text-indigo-400 mb-4" />
                <h3 className="text-base font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Demo CTA */}
      <section className="py-20 px-6 border-t border-slate-800/50">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-purple-700 border border-violet-500/30 mb-6 shadow-xl shadow-violet-500/20">
            <Eye className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4">Watch Bubbi work live</h2>
          <p className="text-slate-400 mb-8 max-w-lg mx-auto">
            Bubbi is our demo AI agent. When active, you can watch its entire thought process unfold in real-time — every reasoning step, tool call, and decision.
          </p>
          <Link
            href="/app?mode=watch"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl font-semibold transition-all shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 text-lg"
          >
            <Eye className="w-5 h-5" />
            Watch Bubbi Think
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800/50 text-center text-sm text-slate-600">
        <div className="flex items-center justify-center gap-4">
          <a href="https://andri.is" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">
            Built by Andri
          </a>
          <span>·</span>
          <a href="https://github.com/AndriGitDev/synapse" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">
            GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
