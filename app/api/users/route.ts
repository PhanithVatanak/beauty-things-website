import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const users = db.getUsers();
    return NextResponse.json(users);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { hashPassword } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, email, firstName, lastName, phone, gender, role, avatar, telegramUsername, password } = body;

    if (!email || !firstName || !lastName || !phone || !gender || !role) {
      return NextResponse.json({ error: 'Missing required profile fields' }, { status: 400 });
    }

    const targetUser = db.getUserById(email.toLowerCase());

    // Role-based promotion / demotion authorization validation
    if (targetUser && targetUser.role !== role) {
      const requesterEmail = req.headers.get('x-requester-email');
      if (!requesterEmail) {
        return NextResponse.json({ error: 'Unauthorized: Requester identity header is missing' }, { status: 401 });
      }

      const requester = db.getUserById(requesterEmail.toLowerCase());
      if (!requester) {
        return NextResponse.json({ error: 'Unauthorized: Requester profile not found' }, { status: 401 });
      }

      if (requester.role === 'support') {
        return NextResponse.json({ error: 'Forbidden: Support users cannot modify roles' }, { status: 403 });
      }

      if (requester.role === 'manager') {
        // manager can promote customer to support, and demote support to customer.
        const isPromotion = targetUser.role === 'customer' && role === 'support';
        const isDemotion = targetUser.role === 'support' && role === 'customer';
        if (!isPromotion && !isDemotion) {
          return NextResponse.json({ error: 'Forbidden: Manager can only promote customer to support, or demote support to customer' }, { status: 403 });
        }
      }

      if (requester.role === 'admin') {
        // admin has full permissions to promote to support or manager
      }
    } else if (!targetUser) {
      // Check duplicate email
      const users = db.getUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        return NextResponse.json({ error: 'Email is already registered' }, { status: 400 });
      }

      // Check role assignment on new users
      if (role !== 'customer') {
        const requesterEmail = req.headers.get('x-requester-email');
        const requester = requesterEmail ? db.getUserById(requesterEmail.toLowerCase()) : null;
        if (!requester || requester.role !== 'admin') {
          return NextResponse.json({ error: 'Forbidden: Only administrators can create staff accounts' }, { status: 403 });
        }
      }
    }

    const newUser = {
      id: targetUser?.id || id || 'usr-' + Math.random().toString(36).substr(2, 9),
      email: email.toLowerCase(),
      firstName,
      lastName,
      phone,
      gender,
      role: role as any,
      avatar: avatar || targetUser?.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`,
      telegramUsername: telegramUsername || targetUser?.telegramUsername || '',
      createdAt: targetUser?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      password: targetUser?.password
    };

    if (password) {
      newUser.password = hashPassword(password);
    }

    const savedUser = db.saveUser(newUser);
    // Don't leak password hash to client
    const { password: _, ...safeUser } = savedUser as any;
    return NextResponse.json(safeUser);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
