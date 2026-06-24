import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { sendNewOrderNotification } from '@/lib/telegram';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');
    const customerName = searchParams.get('customerName');

    let orders = db.getOrders();

    if (phone || customerName) {
      orders = orders.filter((o: any) => 
        (phone && o.phone === phone) || 
        (customerName && o.customerName.toLowerCase() === customerName.toLowerCase())
      );
    }

    return NextResponse.json(orders);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      customerName,
      phone,
      telegramUsername,
      deliveryAddress,
      deliveryOption,
      deliveryPayPreference,
      items
    } = body;

    if (!customerName || !phone || !deliveryAddress || !items || !items.length) {
      return NextResponse.json({ error: 'Missing mandatory client contact and checkout fields' }, { status: 400 });
    }

    const settings = db.getSettings();
    const deliveryOptionVal = deliveryOption as 'SELF_PICKUP' | 'DELIVERY';
    const rawDeliveryFee = deliveryOptionVal === 'DELIVERY' ? settings.deliveryFee : 0;

    const deliveryPayMode = settings.deliveryPayMode || 'INCLUDE';
    let includeDeliveryFee = false;
    if (deliveryOptionVal === 'DELIVERY') {
      if (deliveryPayMode === 'INCLUDE') {
        includeDeliveryFee = true;
      } else if (deliveryPayMode === 'EXCLUDE') {
        includeDeliveryFee = false;
      } else if (deliveryPayMode === 'FLEXIBLE') {
        includeDeliveryFee = deliveryPayPreference !== 'EXCLUDE';
      }
    }

    // Calculate prices
    const subtotal = items.reduce((sum: number, item: any) => sum + (item.price * item.quantity), 0);
    const totalPrice = subtotal + (includeDeliveryFee ? rawDeliveryFee : 0);

    const newOrderId = 'bt-ord-' + Math.random().toString(36).substr(2, 9).toUpperCase();

    const orderItems = items.map((item: any) => ({
      id: 'item-' + Math.random().toString(36).substr(2, 9),
      productId: item.productId,
      name: item.name,
      price: item.price,
      image: item.image || 'https://picsum.photos/seed/nail/600/600',
      quantity: item.quantity,
      shape: item.shape || 'Almond',
      length: item.length || 'Medium',
      sizeNotes: item.sizeNotes || 'Standard M'
    }));

    const newOrder = {
      id: newOrderId,
      customerName,
      phone,
      telegramUsername: telegramUsername ? telegramUsername.replace('@', '') : '',
      deliveryAddress,
      deliveryOption: deliveryOptionVal,
      deliveryFee: rawDeliveryFee,
      deliveryPayOption: (includeDeliveryFee ? 'INCLUDE' : 'EXCLUDE') as 'INCLUDE' | 'EXCLUDE',
      subtotal,
      totalPrice,
      status: 'PENDING_REVIEW' as const,
      items: orderItems,
      isCustomRequestOrder: !!body.isCustomRequestOrder,
      customRequestId: body.customRequestId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Save order
    const savedOrder = db.saveOrder(newOrder);

    // Save history milestone (Timeline)
    db.addOrderHistory(savedOrder.id, 'PENDING_REVIEW', 'Request submitted. Waiting for designer approval review.');

    // Trigger Outbound Telegram Notification to Seller
    try {
      await sendNewOrderNotification(savedOrder.id);
    } catch (err) {
      console.error("Failed to dispatcher telegram startup alert", err);
    }

    return NextResponse.json(savedOrder);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
