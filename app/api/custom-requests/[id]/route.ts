import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendCustomRequestReplyNotification } from '@/lib/telegram';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const request = db.getCustomRequestById(id);
    if (!request) {
      return NextResponse.json({ error: 'Custom request not found' }, { status: 404 });
    }

    if (action === 'admin-reply') {
      const { status, price, estimatedTime, sellerReasonType, sellerRemark } = body;

      if (!status) {
        return NextResponse.json({ error: 'Status is required (ACCEPTED or REJECTED)' }, { status: 400 });
      }

      request.status = status as 'ACCEPTED' | 'REJECTED';
      request.price = price ? parseFloat(price) : undefined;
      request.estimatedTime = estimatedTime || '5 days';
      request.sellerReasonType = sellerReasonType || 'NORMAL';
      request.sellerRemark = sellerRemark || '';
      request.updatedAt = new Date().toISOString();

      const updated = db.saveCustomRequest(request);

      // Trigger Telegram notification
      try {
        await sendCustomRequestReplyNotification(updated.id);
      } catch (err) {
        console.error("Custom request reply Telegram notification error", err);
      }

      return NextResponse.json({ success: true, request: updated });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
