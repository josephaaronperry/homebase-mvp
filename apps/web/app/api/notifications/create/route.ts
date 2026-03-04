import { NextRequest, NextResponse } from 'next/server';
import { createNotification } from '@/lib/notifications';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, title, body: message, link } = body as {
      userId: string;
      type: string;
      title: string;
      body: string;
      link?: string;
    };
    if (!userId || !type || !title || !message) {
      return NextResponse.json(
        { error: 'Missing userId, type, title, or body' },
        { status: 400 }
      );
    }
    const result = await createNotification(
      userId,
      type as Parameters<typeof createNotification>[1],
      title,
      message,
      link
    );
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }
    return NextResponse.json({ id: result.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create notification' },
      { status: 500 }
    );
  }
}
