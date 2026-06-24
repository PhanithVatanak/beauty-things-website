import { NextRequest, NextResponse } from 'next/server';
import { db, OrderStatus, SellerReasonType } from '@/lib/db';
import { 
  sendOrderDecisionNotification, 
  sendPaymentProofNotification,
  interpolateTemplate,
  sendTelegramNotification
} from '@/lib/telegram';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const order = db.getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const history = db.getOrderHistory(id);
    const settings = db.getSettings();

    return NextResponse.json({
      order,
      history,
      settings
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const order = db.getOrderById(id);
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // --- Action 1: Seller Decision (Accept, Delay, Reject) ---
    if (action === 'seller-decision') {
      const { decision, reasonType, remark, estimatedCompletionDate } = body;

      if (!decision) {
        return NextResponse.json({ error: 'Decision parameter is required' }, { status: 400 });
      }

      // STEP 1: Update local database fields
      order.sellerDecision = decision as 'ACCEPT' | 'ACCEPT_WITH_DELAY' | 'REJECT';
      order.sellerReasonType = (reasonType || 'NORMAL') as SellerReasonType;
      order.sellerRemark = remark || '';
      order.estimatedCompletionDate = estimatedCompletionDate || '7 days';

      let nextStatus: OrderStatus = 'PENDING_REVIEW';
      let historyRemark = '';

      if (decision === 'ACCEPT') {
        nextStatus = 'WAITING_PAYMENT';
        historyRemark = `Order APPROVED by designer. Estimated timeline is ${order.estimatedCompletionDate}. Ready for payment transaction.`;
      } else if (decision === 'ACCEPT_WITH_DELAY') {
        nextStatus = 'ACCEPTED_WITH_DELAY';
        historyRemark = `Proposed with dynamic schedule adjustment: ${order.estimatedCompletionDate}. Reason: ${order.sellerReasonType}. Waiting for customer acknowledgment.`;
      } else if (decision === 'REJECT') {
        nextStatus = 'REJECTED';
        historyRemark = `Order request declined. Reason: ${order.sellerReasonType}. Seller Notes: ${order.sellerRemark}`;
      }

      order.status = nextStatus;
      order.updatedAt = new Date().toISOString();

      // Commit transaction to disk
      const updatedOrder = db.saveOrder(order);
      db.addOrderHistory(order.id, nextStatus, historyRemark);

      // STEP 2: Trigger Outbound Telegram Notification
      try {
        await sendOrderDecisionNotification(
          order.id,
          (order.sellerDecision || 'ACCEPT') as 'ACCEPT' | 'ACCEPT_WITH_DELAY' | 'REJECT',
          order.sellerReasonType || '',
          order.sellerRemark || '',
          order.estimatedCompletionDate || ''
        );
      } catch (telegramErr) {
        console.error("Telegram notification dispatcher error", telegramErr);
      }

      return NextResponse.json({ success: true, order: updatedOrder });
    }

    // --- Action 2: Customer Confirm Decision (for delayed orders) ---
    if (action === 'customer-confirm') {
      const { confirmStatus } = body; // 'ACCEPTED' | 'CANCELLED'

      if (order.status !== 'ACCEPTED_WITH_DELAY') {
        return NextResponse.json({ error: 'Order is not in dynamic schedule evaluation status' }, { status: 400 });
      }

      if (confirmStatus === 'ACCEPTED') {
        order.status = 'WAITING_PAYMENT';
        order.userConfirmedDecision = 'ACCEPTED';
        db.saveOrder(order);
        db.addOrderHistory(order.id, 'WAITING_PAYMENT', 'Customer accepted the adjusted handcrafted timeline. Order unlocked for payment.');
        
        // Notify seller customer accepted delay
        try {
          const settings = db.getSettings();
          const p = `<b>✅ Delay Acknowledged</b>\n\nOrder #${order.id.slice(0, 8)}: Customer accepted the delivery schedule of ${order.estimatedCompletionDate || '14 days'}. Ready for payment proof.`;
          const fetch = require('node-fetch'); // fallback if needed, but fetch is global in node 18/nextjs 15
          // We can just use our sendTelegramNotification
          const { sendTelegramNotification } = require('@/lib/telegram');
          await sendTelegramNotification({ recipient: 'SELLER', content: p });
        } catch(e){}
      } else {
        order.status = 'CANCELLED';
        order.userConfirmedDecision = 'CANCELLED';
        db.saveOrder(order);
        db.addOrderHistory(order.id, 'CANCELLED', 'Order cancelled by customer due to delivery schedule preference.');
      }

      return NextResponse.json({ success: true, order });
    }

    // --- Action 3: Customer Upload Payment Screen + Ref ---
    if (action === 'customer-payment') {
      const { paymentScreenshot, transactionRef, paymentMethod } = body;

      if (!paymentScreenshot || !paymentMethod) {
        return NextResponse.json({ error: 'Screenshot and selected bank gateway are mandatory' }, { status: 400 });
      }

      order.paymentScreenshot = paymentScreenshot;
      order.transactionRef = transactionRef || '';
      order.paymentMethod = paymentMethod as 'ABA' | 'ACLEDA' | 'WING';
      order.status = 'PAYMENT_UPLOADED';
      order.updatedAt = new Date().toISOString();

      const updated = db.saveOrder(order);
      db.addOrderHistory(order.id, 'PAYMENT_UPLOADED', `Payment screenshot submitted via ${paymentMethod}. Transaction reference: ${transactionRef || 'None'}. Verification in progress.`);

      // Notify seller
      try {
        await sendPaymentProofNotification(order.id);
      } catch (err) {
        console.error("Payment notification dispatcher error", err);
      }

      return NextResponse.json({ success: true, order: updated });
    }

    // --- Action 4: Seller Verify Payment (Approve transaction -> IN_PRODUCTION) ---
    if (action === 'verify-payment') {
      const { approved, sellerComment } = body;

      if (order.status !== 'PAYMENT_UPLOADED') {
        return NextResponse.json({ error: 'Payment has not been uploaded for evaluation' }, { status: 400 });
      }

      if (approved) {
        order.status = 'IN_PRODUCTION';
        db.saveOrder(order);
        db.addOrderHistory(order.id, 'IN_PRODUCTION', `Payment verified successfully! Handcraft nail production initiated. ${sellerComment || ''}`);
        
        // Notify Customer of Verified production release
        try {
          const settings = db.getSettings();
          const appUrl = process.env.APP_URL || 'http://localhost:3000';
          const vars = {
            orderId: order.id,
            customerName: order.customerName,
            remark: sellerComment || '',
            appUrl: appUrl
          };
          const notifyClient = interpolateTemplate(settings.tgPaymentVerifiedTemplate || '', vars);
          await sendTelegramNotification({ recipient: 'CUSTOMER', content: notifyClient });
        } catch(e){}
      } else {
        // Declined payment proof, revert to WAITING_PAYMENT
        order.status = 'WAITING_PAYMENT';
        db.saveOrder(order);
        db.addOrderHistory(order.id, 'WAITING_PAYMENT', `Payment screenshot declined. Please double check details or upload genuine proof. Remarks: ${sellerComment || 'No remarks provided.'}`);
        
        try {
          const settings = db.getSettings();
          const appUrl = process.env.APP_URL || 'http://localhost:3000';
          const vars = {
            orderId: order.id,
            customerName: order.customerName,
            remark: sellerComment || 'Could not verify transaction',
            appUrl: appUrl
          };
          const notifyClient = interpolateTemplate(settings.tgPaymentDeclinedTemplate || '', vars);
          await sendTelegramNotification({ recipient: 'CUSTOMER', content: notifyClient });
        } catch(e){}
      }

      return NextResponse.json({ success: true, order });
    }

    // --- Action 5: Seller Complete Order (Fulfill/Ships) ---
    if (action === 'complete-order') {
      order.status = 'COMPLETED';
      db.saveOrder(order);
      db.addOrderHistory(order.id, 'COMPLETED', 'Handmade nail set completely finished, packed luxury-grade, and released for Courier Dispatch!');

      try {
        const settings = db.getSettings();
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const vars = {
          orderId: order.id,
          customerName: order.customerName,
          appUrl: appUrl
        };
        const notifyClient = interpolateTemplate(settings.tgOrderCompletedTemplate || '', vars);
        await sendTelegramNotification({ recipient: 'CUSTOMER', content: notifyClient });
      } catch(e){}

      return NextResponse.json({ success: true, order });
    }

    // --- Action 6: Seller or Customer Mark Order as Picked/Collected ---
    if (action === 'picked') {
      order.status = 'PICKED';
      order.updatedAt = new Date().toISOString();
      db.saveOrder(order);
      db.addOrderHistory(order.id, 'PICKED', 'Order marked as Picked Up / Received. Bespoke press-on nails collected successfully!');

      try {
        const { sendTelegramNotification } = require('@/lib/telegram');
        const notifyMsg = `<b>✅ Order Collected / Picked Up!</b>\n\nOrder <code>#${order.id.slice(0, 8)}</code> has been successfully marked as **Collected/Received**. Transaction complete! 💅🌸`;
        await sendTelegramNotification({ recipient: 'CUSTOMER', content: notifyMsg });
        await sendTelegramNotification({ recipient: 'SELLER', content: notifyMsg });
      } catch(e){}

      return NextResponse.json({ success: true, order });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
