import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  return NextResponse.json(
    { error: 'gone', message: 'Bubbi has been retired. The naglasupan.is competition has concluded.' },
    { status: 410 }
  );
}
