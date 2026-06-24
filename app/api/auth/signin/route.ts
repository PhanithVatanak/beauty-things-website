import { NextRequest, NextResponse } from 'next/server';
import { db, hashPassword } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { emailOrUsername, password } = await req.json();
    if (!emailOrUsername || !password) {
      return NextResponse.json({ error: 'Email/Username and password are required' }, { status: 400 });
    }

    const users = db.getUsers();
    const user = users.find(u => 
      u.email.toLowerCase() === emailOrUsername.toLowerCase() || 
      u.firstName.toLowerCase() === emailOrUsername.toLowerCase() ||
      u.email.toLowerCase().split('@')[0] === emailOrUsername.toLowerCase()
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (!user.password) {
      return NextResponse.json({ error: 'User does not have credentials. Try Google Sign-In.' }, { status: 400 });
    }

    const hashedInput = hashPassword(password);
    // Allow both plain text and hashed matching
    if (user.password !== hashedInput && user.password !== password) {
      return NextResponse.json({ error: 'Incorrect password' }, { status: 401 });
    }

    // Return user without password field
    const { password: _, ...safeUser } = user;
    return NextResponse.json(safeUser);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
