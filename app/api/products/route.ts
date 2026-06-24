import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const products = db.getProducts();
    const url = new URL(req.url);
    const category = url.searchParams.get('category');
    const bsetSeller = url.searchParams.get('bestSeller');
    const search = url.searchParams.get('search');

    let filtered = [...products];

    if (category && category !== 'All') {
      filtered = filtered.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (bsetSeller === 'true') {
      filtered = filtered.filter(p => p.isBestSeller);
    }

    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.description.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      );
    }

    return NextResponse.json(filtered);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.name || !body.price || !body.category) {
      return NextResponse.json({ error: 'Missing required product fields' }, { status: 400 });
    }

    const newProduct = {
      id: body.id || 'prod-' + Math.random().toString(36).substr(2, 9),
      name: body.name,
      description: body.description || '',
      category: body.category,
      price: parseFloat(body.price),
      images: body.images || ['https://picsum.photos/seed/nail_gen/600/600'],
      shapes: body.shapes || ['Almond', 'Coffin', 'Square'],
      lengths: body.lengths || ['Short', 'Medium', 'Long'],
      tags: body.tags || [],
      productionTime: body.productionTime || '3-5 days',
      isBestSeller: !!body.isBestSeller,
      isNewArrival: !!body.isNewArrival,
      rating: body.rating || 5.0,
      reviews: body.reviews || []
    };

    const saved = db.saveProduct(newProduct);
    return NextResponse.json(saved);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
