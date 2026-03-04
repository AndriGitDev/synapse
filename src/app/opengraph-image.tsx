import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'SYNAPSE - Watch AI Agents Think';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OGImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          fontFamily: 'system-ui, sans-serif',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        {/* Background grid dots */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.15,
            backgroundImage: 'radial-gradient(circle, #6366f1 1px, transparent 1px)',
            backgroundSize: '30px 30px',
          }}
        />

        {/* Glow effects */}
        <div
          style={{
            position: 'absolute',
            top: '20%',
            left: '30%',
            width: 400,
            height: 400,
            borderRadius: '50%',
            background: 'rgba(139, 92, 246, 0.15)',
            filter: 'blur(80px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '20%',
            right: '25%',
            width: 300,
            height: 300,
            borderRadius: '50%',
            background: 'rgba(99, 102, 241, 0.1)',
            filter: 'blur(60px)',
          }}
        />

        {/* Brain icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 80,
            height: 80,
            borderRadius: 20,
            background: 'linear-gradient(135deg, #8b5cf6, #6366f1)',
            marginBottom: 32,
            boxShadow: '0 0 60px rgba(139, 92, 246, 0.4)',
          }}
        >
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
            <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
            <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
            <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
            <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
            <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
            <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
            <path d="M6 18a4 4 0 0 1-1.967-.516" />
            <path d="M19.967 17.484A4 4 0 0 1 18 18" />
          </svg>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 800,
            letterSpacing: '-0.04em',
            color: 'white',
            marginBottom: 16,
            display: 'flex',
          }}
        >
          SYNAPSE
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 28,
            color: '#a5b4fc',
            fontWeight: 500,
            marginBottom: 40,
            display: 'flex',
          }}
        >
          Watch AI Agents Think in Real-Time
        </div>

        {/* Node pills */}
        <div style={{ display: 'flex', gap: 12 }}>
          {[
            { label: '💭 Reasoning', color: '#8b5cf6' },
            { label: '🔍 Tool Call', color: '#3b82f6' },
            { label: '✓ Result', color: '#22c55e' },
            { label: '✍️ File Write', color: '#f97316' },
          ].map((n) => (
            <div
              key={n.label}
              style={{
                padding: '10px 20px',
                borderRadius: 12,
                border: `1px solid ${n.color}40`,
                background: `${n.color}15`,
                color: n.color,
                fontSize: 16,
                fontWeight: 600,
                fontFamily: 'monospace',
                display: 'flex',
              }}
            >
              {n.label}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            position: 'absolute',
            bottom: 32,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            color: '#64748b',
            fontSize: 16,
          }}
        >
          synapse.andri.is
        </div>
      </div>
    ),
    { ...size }
  );
}
