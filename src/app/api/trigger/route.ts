import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '',
  key: process.env.PUSHER_KEY || process.env.NEXT_PUBLIC_PUSHER_KEY || '',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || process.env.NEXT_PUBLIC_PUSHER_CLUSTER || 'eu',
  useTLS: true,
});

// Rate limit: 1 trigger per 30 seconds per IP
const ipLastTrigger = new Map<string, number>();

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const now = Date.now();
    const last = ipLastTrigger.get(ip) || 0;
    
    if (now - last < 30_000) {
      const retryAfter = Math.ceil((30_000 - (now - last)) / 1000);
      return NextResponse.json(
        { error: 'rate_limited', retryAfter },
        { status: 429 }
      );
    }

    // Parse body - taskIndex is optional (defaults to random on bridge side)
    let taskIndex: number | undefined;
    try {
      const body = await req.json();
      if (typeof body.taskIndex === 'number' && body.taskIndex >= 0 && body.taskIndex <= 4) {
        taskIndex = body.taskIndex;
      }
    } catch {
      // No body or invalid JSON — that's fine, bridge picks random
    }

    ipLastTrigger.set(ip, now);

    // Send trigger event to the control channel — the bridge picks it up
    await pusher.trigger('synapse-control', 'trigger-task', { 
      taskIndex: taskIndex ?? undefined,
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Trigger error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
