import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendNewCustomRequestNotification } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  try {
    const list = db.getCustomRequests();
    return NextResponse.json(list);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      nailShape,
      nailLength,
      colorPreference,
      notes,
      referenceImage
    } = body;

    if (!nailShape || !nailLength || !colorPreference || !referenceImage) {
      return NextResponse.json({ error: 'Nail specifications (shape, length, colors) and reference photo are mandatory.' }, { status: 400 });
    }

    const requestId = 'bt-crq-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const newRequest = {
      id: requestId,
      nailShape,
      nailLength,
      colorPreference,
      notes: notes || '',
      referenceImage,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const saved = db.saveCustomRequest(newRequest);

    // Notify Seller
    try {
      await sendNewCustomRequestNotification(saved.id);
    } catch (e) {
      console.error("Custom request Telegram notifier error", e);
    }

    return NextResponse.json(saved);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
