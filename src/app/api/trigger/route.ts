import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '2114713',
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
        { error: `Please wait ${retryAfter}s before triggering again` },
        { status: 429 }
      );
    }

    const { taskIndex } = await req.json();

    if (typeof taskIndex !== 'number' || taskIndex < 0 || taskIndex > 4) {
      return NextResponse.json({ error: 'Invalid task index' }, { status: 400 });
    }

    ipLastTrigger.set(ip, now);

    // Send trigger event to the control channel — the bridge will pick it up
    await pusher.trigger('synapse-control', 'trigger-task', { taskIndex });

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Trigger error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
