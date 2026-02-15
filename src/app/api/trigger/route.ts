import { NextRequest, NextResponse } from 'next/server';
import Pusher from 'pusher';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID || '2114713',
  key: process.env.PUSHER_KEY || '46eeba8ed3e2d7394c2a',
  secret: process.env.PUSHER_SECRET || '',
  cluster: process.env.PUSHER_CLUSTER || 'eu',
  useTLS: true,
});

// In-memory rate limiting (resets on cold start, fine for serverless)
const ipRequests = new Map<string, number[]>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const timestamps = ipRequests.get(ip) || [];

  // Clean old entries (>1 hour)
  const recent = timestamps.filter(t => now - t < 3600_000);
  ipRequests.set(ip, recent);

  // 10 per hour
  if (recent.length >= 10) {
    const retryAfter = Math.ceil((recent[0] + 3600_000 - now) / 1000);
    return { allowed: false, retryAfter };
  }

  // 1 per 2 minutes
  const lastTwo = recent.filter(t => now - t < 120_000);
  if (lastTwo.length >= 1) {
    const retryAfter = Math.ceil((lastTwo[0] + 120_000 - now) / 1000);
    return { allowed: false, retryAfter };
  }

  return { allowed: true };
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    || request.headers.get('x-real-ip')
    || 'unknown';

  const rateCheck = checkRateLimit(ip);
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { ok: false, error: 'rate_limited', retryAfter: rateCheck.retryAfter },
      { status: 429 }
    );
  }

  try {
    // Record this request
    const timestamps = ipRequests.get(ip) || [];
    timestamps.push(Date.now());
    ipRequests.set(ip, timestamps);

    // Publish trigger event to control channel
    await pusher.trigger('synapse-control', 'trigger-task', {
      timestamp: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Trigger error:', error);
    return NextResponse.json(
      { ok: false, error: 'internal_error' },
      { status: 500 }
    );
  }
}
