import { db } from './db';

interface SendTelegramOptions {
  recipient: 'CUSTOMER' | 'SELLER';
  content: string;
}

/**
 * Sends a notification using the Telegram Bot API.
 * Always logs the transmission attempt in the database for tracking in the Admin Dashboard.
 */
export async function sendTelegramNotification(options: SendTelegramOptions): Promise<{ success: boolean; error?: string }> {
  const { recipient, content } = options;
  const settings = db.getSettings();
  const botToken = settings.telegramBotToken;
  
  // Decide which chat ID to use
  // Customers cannot be messaged directly without a chat_id. For safety and compliance,
  // we default to sending both notifications to the Store/Channel Chat ID so the seller sees everything in one place,
  // or we log it nicely. If there is a custom chat_id format, we handle it.
  const chatId = settings.telegramChannelId;

  console.log(`[Telegram Simulation] Sending to ${recipient}: \n${content}`);

  // If no credentials or config, log success in simulation mode so users can see the log records
  if (!botToken || !chatId) {
    const errorMsg = 'Telegram credentials not configured. Running in simulated preview mode.';
    db.addTelegramLog(
      recipient,
      content,
      'SUCCESS', // Marked as success in mock/demo mode to show how it looks
      `[SIMULATION] ${errorMsg}`
    );
    return { success: true, error: errorMsg };
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: content,
        parse_mode: 'HTML',
      }),
    });

    const data = await response.json();

    if (data.ok) {
      db.addTelegramLog(recipient, content, 'SUCCESS');
      return { success: true };
    } else {
      const apiError = data.description || 'Unknown Telegram API Error';
      db.addTelegramLog(recipient, content, 'FAILED', apiError);
      return { success: false, error: apiError };
    }
  } catch (err: any) {
    const systemError = err.message || 'System Fetch Connection Error';
    db.addTelegramLog(recipient, content, 'FAILED', systemError);
    return { success: false, error: systemError };
  }
}

export function interpolateTemplate(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{${key}}`, 'g'), value);
  }
  return result;
}

/**
 * Helper to generate order decision Telegram message
 */
export async function sendOrderDecisionNotification(
  orderId: string, 
  decision: 'ACCEPT' | 'ACCEPT_WITH_DELAY' | 'REJECT',
  reasonType: string,
  remark: string,
  estimatedTime: string
) {
  const order = db.getOrderById(orderId);
  if (!order) return;

  const settings = db.getSettings();
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const vars = {
    orderId: order.id,
    customerName: order.customerName,
    estimatedTime: estimatedTime,
    reasonType: reasonType,
    remark: remark || (decision === 'ACCEPT' ? 'We will start production soon!' : decision === 'ACCEPT_WITH_DELAY' ? 'High workload' : 'Material unavailable or fully booked.'),
    appUrl: appUrl
  };

  let customerMsg = '';
  if (decision === 'ACCEPT') {
    customerMsg = interpolateTemplate(settings.tgOrderAcceptedTemplate || '', vars);
  } else if (decision === 'ACCEPT_WITH_DELAY') {
    customerMsg = interpolateTemplate(settings.tgOrderDelayedTemplate || '', vars);
  } else {
    customerMsg = interpolateTemplate(settings.tgOrderRejectedTemplate || '', vars);
  }

  // STEP 1: Notify Customer (sends to the channel/chat)
  await sendTelegramNotification({
    recipient: 'CUSTOMER',
    content: customerMsg
  });

  // STEP 2: Notify Seller about the action
  const sellerMsg = `<b>💅 Order Action Logged</b>\n\nOrder ID: <code>#${order.id.slice(0, 8)}</code>\nCustomer: <b>${order.customerName}</b>\nAction: <b>${decision}</b>\nEst. Time: ${estimatedTime}\nNotes: ${remark}`;
  await sendTelegramNotification({
    recipient: 'SELLER',
    content: sellerMsg
  });
}

/**
 * Helper to notify seller of new incoming orders
 */
export async function sendNewOrderNotification(orderId: string) {
  const order = db.getOrderById(orderId);
  if (!order) return;

  const itemsList = order.items.map(item => `- ${item.name} (${item.shape}, ${item.length}) x${item.quantity}`).join('\n');
  const content = `<b>🔔 New Nail Order Received!</b>\n\n` +
    `Order ID: <code>#${order.id.slice(0, 8)}</code>\n` +
    `👤 Customer: <b>${order.customerName}</b>\n` +
    `📞 Phone: <code>${order.phone}</code>\n` +
    `✈️ Telegram: @${order.telegramUsername}\n` +
    `🚚 Delivery: <b>${order.deliveryOption}</b>\n` +
    `💰 Total: <b>$${order.totalPrice.toFixed(2)}</b>\n\n` +
    `<b>📦 Items:</b>\n${itemsList}\n\n` +
    `👉 <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin">Open Admin Dashboard</a>`;

  await sendTelegramNotification({
    recipient: 'SELLER',
    content
  });
}

/**
 * Helper to notify seller of new custom request
 */
export async function sendNewCustomRequestNotification(requestId: string) {
  const req = db.getCustomRequestById(requestId);
  if (!req) return;

  const content = `<b>✨ New Custom Handcrafted Request!</b>\n\n` +
    `Request ID: <code>#${req.id.slice(0, 8)}</code>\n` +
    `💅 Shape: <b>${req.nailShape}</b>\n` +
    `📏 Length: <b>${req.nailLength}</b>\n` +
    `🎨 Color Pref: ${req.colorPreference}\n` +
    `📝 Notes: ${req.notes || 'None'}\n\n` +
    `👉 <a href="${process.env.APP_URL || 'http://localhost:3000'}/admin">Quote and reply in Admin</a>`;

  await sendTelegramNotification({
    recipient: 'SELLER',
    content
  });
}

/**
 * Helper to notify customer of custom request reply
 */
export async function sendCustomRequestReplyNotification(requestId: string) {
  const req = db.getCustomRequestById(requestId);
  if (!req) return;

  const settings = db.getSettings();
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const vars = {
    requestId: req.id,
    price: req.price !== undefined ? `$${req.price.toFixed(2)}` : 'N/A',
    estimatedTime: req.estimatedTime || '5 days',
    reasonType: req.sellerReasonType || 'NORMAL',
    remark: req.sellerRemark || (req.status === 'ACCEPTED' ? 'Looking forward to creating this for you!' : 'Material shortage or design too complex'),
    appUrl: appUrl
  };

  let content = '';
  if (req.status === 'ACCEPTED') {
    content = interpolateTemplate(settings.tgCustomAcceptedTemplate || '', vars);
  } else {
    content = interpolateTemplate(settings.tgCustomRejectedTemplate || '', vars);
  }

  await sendTelegramNotification({
    recipient: 'CUSTOMER',
    content
  });
}

/**
 * Helper to notify seller of customer uploading payment proof
 */
export async function sendPaymentProofNotification(orderId: string) {
  const order = db.getOrderById(orderId);
  if (!order) return;

  const settings = db.getSettings();
  const appUrl = process.env.APP_URL || 'http://localhost:3000';

  const content = `<b>💳 Payment Screenshot Uploaded!</b>\n\n` +
    `Order ID: <code>#${order.id.slice(0, 8)}</code>\n` +
    `👤 Customer: <b>${order.customerName}</b>\n` +
    `🏦 Method: <b>${order.paymentMethod}</b>\n` +
    `🔑 Ref: <code>${order.transactionRef || 'N/A'}</code>\n\n` +
    `👉 <a href="${appUrl}/admin">Open Admin Dashboard</a>`;

  await sendTelegramNotification({
    recipient: 'SELLER',
    content
  });

  // Also send brief status confirmation to customer log channel
  const vars = {
    orderId: order.id,
    customerName: order.customerName,
    appUrl: appUrl
  };
  const customerNotify = interpolateTemplate(settings.tgPaymentUploadedTemplate || '', vars);

  await sendTelegramNotification({
    recipient: 'CUSTOMER',
    content: customerNotify
  });
}
