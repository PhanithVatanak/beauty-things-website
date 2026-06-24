import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email).toLowerCase();
    const user = db.getUserById(decodedEmail);
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json(user);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email } = await params;
    const decodedEmail = decodeURIComponent(email).toLowerCase();

    const requesterEmail = req.headers.get('x-requester-email');
    if (!requesterEmail) {
      return NextResponse.json({ error: 'Unauthorized: Requester identity header is missing' }, { status: 401 });
    }
    const requester = db.getUserById(requesterEmail.toLowerCase());
    if (!requester || requester.role === 'support') {
      return NextResponse.json({ error: 'Forbidden: Support users cannot delete accounts' }, { status: 403 });
    }

    const success = db.deleteUser(decodedEmail);
    if (!success) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
