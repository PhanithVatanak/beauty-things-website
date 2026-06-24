import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prod = db.getProductById(id);
    if (!prod) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json(prod);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const requesterEmail = req.headers.get('x-requester-email');
    if (!requesterEmail) {
      return NextResponse.json({ error: 'Unauthorized: Requester identity header is missing' }, { status: 401 });
    }
    const requester = db.getUserById(requesterEmail.toLowerCase());
    if (!requester || requester.role === 'support') {
      return NextResponse.json({ error: 'Forbidden: Support users cannot delete products' }, { status: 403 });
    }

    const success = db.deleteProduct(id);
    if (!success) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, message: 'Product deleted' });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// Handler for adding a review
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const prod = db.getProductById(id);
    if (!prod) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (!body.author || !body.rating) {
      return NextResponse.json({ error: 'Author and rating are required' }, { status: 400 });
    }

    const newReview = {
      id: 'rev-' + Math.random().toString(36).substr(2, 9),
      author: body.author,
      rating: parseInt(body.rating),
      comment: body.comment || '',
      createdAt: new Date().toISOString()
    };

    prod.reviews = prod.reviews || [];
    prod.reviews.push(newReview);
    
    // Recalculate average rating
    const totalRating = prod.reviews.reduce((sum, r) => sum + r.rating, 0);
    prod.rating = parseFloat((totalRating / prod.reviews.length).toFixed(1));

    db.saveProduct(prod);
    return NextResponse.json(prod);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
