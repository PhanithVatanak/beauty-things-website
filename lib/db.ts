import fs from 'fs';
import path from 'path';

// Types definition
export interface Product {
  id: string;
  name: string;
  description: string;
  category: string; // "Classic" | "Luxury" | "Cute" | "Elegant" | "Minimalist"
  price: number;
  images: string[];
  shapes: string[]; // e.g. ["Almond", "Coffin", "Square", "Oval", "Round", "Stiletto"]
  lengths: string[]; // e.g. ["Short", "Medium", "Long", "Extra Long"]
  tags: string[];
  productionTime: string; // e.g. "3-5 days"
  isBestSeller: boolean;
  isNewArrival: boolean;
  rating: number;
  reviews: Review[];
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export type OrderStatus =
  | 'PENDING_REVIEW'
  | 'ACCEPTED'
  | 'ACCEPTED_WITH_DELAY'
  | 'REJECTED'
  | 'WAITING_PAYMENT'
  | 'PAYMENT_UPLOADED'
  | 'PAYMENT_VERIFIED'
  | 'IN_PRODUCTION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PICKED';

export type SellerReasonType =
  | 'NORMAL'
  | 'DELAY'
  | 'MATERIAL_SHORTAGE'
  | 'FULLY_BOOKED'
  | 'CUSTOM';

export interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  shape: string;
  length: string;
  sizeNotes?: string; // S, M, L, custom
}

export interface CustomNailRequest {
  id: string;
  nailShape: string;
  nailLength: string;
  colorPreference: string;
  notes: string;
  referenceImage: string; // base64 or URL
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  price?: number;
  estimatedTime?: string;
  sellerDecision?: string;
  sellerReasonType?: SellerReasonType;
  sellerRemark?: string;
  createdAt: string;
  updatedAt: string;
  // If converted to order
  orderId?: string;
}

export interface Order {
  id: string;
  customerName: string;
  phone: string;
  telegramUsername: string;
  deliveryAddress: string;
  deliveryOption: 'SELF_PICKUP' | 'DELIVERY';
  deliveryFee: number;
  deliveryPayOption?: 'INCLUDE' | 'EXCLUDE';
  subtotal: number;
  totalPrice: number;
  status: OrderStatus;
  
  // Seller decision fields
  sellerDecision?: 'ACCEPT' | 'ACCEPT_WITH_DELAY' | 'REJECT';
  sellerReasonType?: SellerReasonType;
  sellerRemark?: string;
  estimatedCompletionDate?: string; // 3 days, 7 days, 14 days, or custom date
  userConfirmedDecision?: 'ACCEPTED' | 'CANCELLED'; // User response to ACCEPTED_WITH_DELAY etc
  
  // Payment Proof
  paymentScreenshot?: string; // base64 or URL
  transactionRef?: string;
  paymentMethod?: 'ABA' | 'ACLEDA' | 'WING';
  
  items: OrderItem[];
  isCustomRequestOrder?: boolean;
  customRequestId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  remark: string;
  createdAt: string;
}

export interface TelegramLog {
  id: string;
  recipient: string; // "CUSTOMER" | "SELLER"
  content: string;
  status: 'SUCCESS' | 'FAILED';
  error?: string;
  createdAt: string;
}

export interface StoreSettings {
  deliveryFee: number;
  telegramBotToken: string;
  telegramChannelId: string; // Seller/Admin Telegram channel/chat ID
  abaQrText: string; // e.g. "aba-merchant-id-details"
  abaHolder: string;
  abaNumber: string;
  acledaQrText: string;
  acledaHolder: string;
  acledaNumber: string;
  wingQrText: string;
  wingHolder: string;
  wingNumber: string;
  khmerDefaultEnabled: boolean;
  invoicePrintWidth?: string;
  invoiceHeaderNote?: string;
  invoiceFooterNote?: string;
  deliveryPayMode?: 'INCLUDE' | 'EXCLUDE' | 'FLEXIBLE';
  tgOrderAcceptedTemplate?: string;
  tgOrderDelayedTemplate?: string;
  tgOrderRejectedTemplate?: string;
  tgPaymentUploadedTemplate?: string;
  tgPaymentVerifiedTemplate?: string;
  tgPaymentDeclinedTemplate?: string;
  tgOrderCompletedTemplate?: string;
  tgCustomAcceptedTemplate?: string;
  tgCustomRejectedTemplate?: string;
}

import crypto from 'crypto';

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  gender: string;
  role: 'admin' | 'manager' | 'support' | 'customer';
  avatar?: string;
  telegramUsername?: string;
  createdAt: string;
  updatedAt: string;
  password?: string;
}


export interface DatabaseState {
  products: Product[];
  orders: Order[];
  orderHistory: OrderHistory[];
  customRequests: CustomNailRequest[];
  storeSettings: StoreSettings;
  telegramLogs: TelegramLog[];
  users?: UserProfile[]; // Optional for backward compatibility with existing json file
}

const DB_FILE_PATH = path.join(process.cwd(), 'lib', 'beauty_things_db.json');

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'prod-1',
    name: 'Korean Glass Pastel Glaze',
    description: 'Beautiful iridescent glass nails with a custom translucent topcoat. Offers a pristine high-gloss finish typical of premium Seoul beauty studios. Perfect for minimalists looking for a touch of refined glamour.',
    category: 'Elegant',
    price: 25.00,
    images: ['https://picsum.photos/seed/nail1/600/600', 'https://picsum.photos/seed/nail1_2/600/600'],
    shapes: ['Almond', 'Oval', 'Round'],
    lengths: ['Short', 'Medium'],
    tags: ['Glass Nail', 'Korean Style', 'Pastel', 'Chic'],
    productionTime: '3-5 days',
    isBestSeller: true,
    isNewArrival: false,
    rating: 4.9,
    reviews: [
      { id: 'rev-1', author: 'Sokha R.', rating: 5, comment: 'Absolutely stunning! The glass shine is beautiful under Sunlight.', createdAt: '2026-06-10T14:32:00Z' },
      { id: 'rev-2', author: 'Neary L.', rating: 5, comment: 'Very high quality, gets me so many compliments.', createdAt: '2026-06-12T09:15:00Z' }
    ]
  },
  {
    id: 'prod-2',
    name: 'Blush Jelly Dream',
    description: 'Feminine gradient pink syrup nails featuring premium rhinestone bow accents and pearl micro-beads. Perfect for elegant celebrations, festivals, or everyday luxury.',
    category: 'Cute',
    price: 28.00,
    images: ['https://picsum.photos/seed/nail2/600/600', 'https://picsum.photos/seed/nail2_2/600/600'],
    shapes: ['Almond', 'Coffin', 'Stiletto'],
    lengths: ['Medium', 'Long'],
    tags: ['Coquette', 'Bows', 'Jelly Pink', 'Syrup Gradient'],
    productionTime: '3-5 days',
    isBestSeller: true,
    isNewArrival: false,
    rating: 4.8,
    reviews: [
      { id: 'rev-3', author: 'Voleak S.', rating: 4, comment: 'Gorgeous style. Extremely cute!', createdAt: '2026-06-08T05:22:00Z' }
    ]
  },
  {
    id: 'prod-3',
    name: 'Gold Leaf Aurora Chrome',
    description: 'High-end chrome nail set paired with genuine gold leaf inclusions, structured dimensional gel swirls, and iridescent shells. Represents the pinnacle of handcrafted wearable nail art.',
    category: 'Luxury',
    price: 32.00,
    images: ['https://picsum.photos/seed/nail3/600/600', 'https://picsum.photos/seed/nail3_2/600/600'],
    shapes: ['Coffin', 'Square', 'Almond'],
    lengths: ['Medium', 'Long', 'Extra Long'],
    tags: ['Gold Leaf', 'Aurora', 'Chrome', 'Luxury Art'],
    productionTime: '5-7 days',
    isBestSeller: false,
    isNewArrival: true,
    rating: 5.0,
    reviews: [
      { id: 'rev-4', author: 'Sophea T.', rating: 5, comment: 'Unbelievable craftsmanship. It looks like real jewellery on my fingertips.', createdAt: '2026-06-15T11:42:00Z' }
    ]
  },
  {
    id: 'prod-4',
    name: 'Matcha Latte Marble',
    description: 'Sage and matcha green tones blended seamlessly into customized jade quartz marble swirls, accented with delicate gold foil. Extremely chic, clean, and highly sought after.',
    category: 'Minimalist',
    price: 27.00,
    images: ['https://picsum.photos/seed/nail4/600/600'],
    shapes: ['Oval', 'Round', 'Almond'],
    lengths: ['Short', 'Medium'],
    tags: ['Matcha', 'Marble', 'Jade Quartz', 'Gold Foil'],
    productionTime: '3-5 days',
    isBestSeller: false,
    isNewArrival: true,
    rating: 4.7,
    reviews: []
  },
  {
    id: 'prod-5',
    name: 'Starlight Pearl Chrome',
    description: 'Premium oyster pearl finish using non-metallic safe cosmetic pigments. Gleams white, pink, and blue in different angles. A classic companion for weddings or high-ticket corporate events.',
    category: 'Classic',
    price: 30.00,
    images: ['https://picsum.photos/seed/nail5/600/600'],
    shapes: ['Almond', 'Oval', 'Square'],
    lengths: ['Short', 'Medium', 'Long'],
    tags: ['Pearl', 'Chrome', 'Saint-Tropez', 'Bridal'],
    productionTime: '3-5 days',
    isBestSeller: true,
    isNewArrival: false,
    rating: 5.0,
    reviews: []
  },
  {
    id: 'prod-6',
    name: 'Coquette Vintage Velour',
    description: 'Deep burgundy wine cat-eye velvet texture combined with hand-painted vintage French ribbons and tiny pearl drop details. Rich, mysterious, and exquisitely detailed.',
    category: 'Luxury',
    price: 34.00,
    images: ['https://picsum.photos/seed/nail6/600/600'],
    shapes: ['Almond', 'Coffin', 'Stiletto'],
    lengths: ['Medium', 'Long'],
    tags: ['Burgundy', 'Cat-Eye', 'Velvet', 'Coquette Ribbon'],
    productionTime: '5-7 days',
    isBestSeller: false,
    isNewArrival: true,
    rating: 4.9,
    reviews: []
  }
];

export const DEFAULT_TG_TEMPLATES = {
  tgOrderAcceptedTemplate: `<b>🌸 Beauty Things Studio - Order Update 🌸</b>\n\nYour order is accepted. Estimated time: {estimatedTime}.\n\n<b>Seller remark:</b> {remark}\n\nTrack your order timeline at: <code>{appUrl}/order-tracking/{orderId}</code>`,
  tgOrderDelayedTemplate: `<b>🌸 Beauty Things Studio - Order Update 🌸</b>\n\nYour order is accepted but delayed.\n<b>Reason:</b> {reasonType} ({remark}).\n<b>Estimated time:</b> {estimatedTime}\n\nTrack your order timeline at: <code>{appUrl}/order-tracking/{orderId}</code>`,
  tgOrderRejectedTemplate: `<b>🌸 Beauty Things Studio - Order Update 🌸</b>\n\nYour order is rejected.\n<b>Reason:</b> {reasonType}\n<b>Note:</b> {remark}`,
  tgPaymentUploadedTemplate: `<b>🌸 Beauty Things 🌸</b>\n\nYour payment proof for Order <code>#{orderId}</code> has been submitted successfully. We are verifying your transaction.`,
  tgPaymentVerifiedTemplate: `<b>🌸 Beauty Things Studio - Payment Match! 🌸</b>\n\nYour payment for order <code>#{orderId}</code> has been verified!\nYour bespoke press-on nails are now <b>IN PRODUCTION</b> 💅✨\nWe will notify you once completed!`,
  tgPaymentDeclinedTemplate: `<b>⚠️ Beauty Things Studio - Payment Declined</b>\n\nYour submitted payment screenshot or reference number for order <code>#{orderId}</code> was declined.\n\n<b>Reason:</b> {remark}\n\nPlease check your input receipt and retry uploading.`,
  tgOrderCompletedTemplate: `<b>🌸 Beauty Things Studio - Order Completed! 🎉</b>\n\nYour gorgeous handcrafted press-on nails for order <code>#{orderId}</code> are completely <b>FINISHED & SHIPPED</b>!\n\nThank you for choosing Beauty Things! Enjoy your luxury nails 💅🌸`,
  tgCustomAcceptedTemplate: `<b>🌸 Beauty Things Studio - Custom Nail Quote 🌸</b>\n\nYour custom nail request has been ACCEPTED with a price quote of <b>{price}</b>!\n<b>Estimated handmade time:</b> {estimatedTime}\n<b>Seller Remarks:</b> {remark}\n\nTrack your request and place order at: <code>{appUrl}/custom-nail</code>`,
  tgCustomRejectedTemplate: `<b>🌸 Beauty Things Studio - Custom Nail Quote 🌸</b>\n\nYour custom nail request could not be accepted.\n<b>Reason:</b> {reasonType} ({remark})\n\nTrack your request and place order at: <code>{appUrl}/custom-nail</code>`
};

const INITIAL_SETTINGS: StoreSettings = {
  deliveryFee: 2.00, // $2.00 delivery fee for Phnom Penh / provincial shipments
  deliveryPayMode: 'INCLUDE',
  telegramBotToken: '', // Empty by default so logs mode captures messages gracefully
  telegramChannelId: '', // Owner Telegram id or group/channel link
  abaQrText: 'https://pay.aba.com.kh/beautythings_sample',
  abaHolder: 'CHHIM BEAUTY THINGS Co.',
  abaNumber: '000 123 456',
  acledaQrText: 'https://pay.acledabank.com.kh/beautythings_sample',
  acledaHolder: 'CHHIM BEAUTY THINGS Co.',
  acledaNumber: '0123-45-678910-11',
  wingQrText: 'https://pay.wingmoney.com/beautythings_sample',
  wingHolder: 'CHHIM BEAUTY THINGS Co.',
  wingNumber: '098 765 432',
  khmerDefaultEnabled: true,
  invoicePrintWidth: '80mm',
  invoiceHeaderNote: 'Premium Handmade Press-on Nails\nPhnom Penh, Cambodia',
  invoiceFooterNote: 'Thank you for choosing Beauty Things! Please follow us on Telegram @beautythings_cambodia.',
  ...DEFAULT_TG_TEMPLATES
};

const INITIAL_STATE: DatabaseState = {
  products: INITIAL_PRODUCTS,
  orders: [],
  orderHistory: [],
  customRequests: [],
  storeSettings: INITIAL_SETTINGS,
  telegramLogs: [],
  users: []
};

// Singleton DB runner
class DatabaseManager {
  private cachedState: DatabaseState | null = null;

  constructor() {
    this.ensureDbExists();
  }

  private ensureDbExists() {
    const dir = path.dirname(DB_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE_PATH)) {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(INITIAL_STATE, null, 2), 'utf8');
    }
  }

  private load(): DatabaseState {
    this.ensureDbExists();
    try {
      const content = fs.readFileSync(DB_FILE_PATH, 'utf8');
      const state = JSON.parse(content) as DatabaseState;
      // Merge with default settings or schema updates if key properties aren't in cached DB
      if (!state.products || state.products.length === 0) state.products = INITIAL_PRODUCTS;
      if (!state.storeSettings) {
        state.storeSettings = INITIAL_SETTINGS;
      } else {
        if (!state.storeSettings.invoicePrintWidth) state.storeSettings.invoicePrintWidth = '80mm';
        if (!state.storeSettings.invoiceHeaderNote) state.storeSettings.invoiceHeaderNote = 'Premium Handmade Press-on Nails\nPhnom Penh, Cambodia';
        if (!state.storeSettings.invoiceFooterNote) state.storeSettings.invoiceFooterNote = 'Thank you for choosing Beauty Things! Please follow us on Telegram @beautythings_cambodia.';
        if (!state.storeSettings.deliveryPayMode) state.storeSettings.deliveryPayMode = 'INCLUDE';
        
        // Auto-backfill new telegram template settings if missing
        if (!state.storeSettings.tgOrderAcceptedTemplate) state.storeSettings.tgOrderAcceptedTemplate = INITIAL_SETTINGS.tgOrderAcceptedTemplate;
        if (!state.storeSettings.tgOrderDelayedTemplate) state.storeSettings.tgOrderDelayedTemplate = INITIAL_SETTINGS.tgOrderDelayedTemplate;
        if (!state.storeSettings.tgOrderRejectedTemplate) state.storeSettings.tgOrderRejectedTemplate = INITIAL_SETTINGS.tgOrderRejectedTemplate;
        if (!state.storeSettings.tgPaymentUploadedTemplate) state.storeSettings.tgPaymentUploadedTemplate = INITIAL_SETTINGS.tgPaymentUploadedTemplate;
        if (!state.storeSettings.tgPaymentVerifiedTemplate) state.storeSettings.tgPaymentVerifiedTemplate = INITIAL_SETTINGS.tgPaymentVerifiedTemplate;
        if (!state.storeSettings.tgPaymentDeclinedTemplate) state.storeSettings.tgPaymentDeclinedTemplate = INITIAL_SETTINGS.tgPaymentDeclinedTemplate;
        if (!state.storeSettings.tgOrderCompletedTemplate) state.storeSettings.tgOrderCompletedTemplate = INITIAL_SETTINGS.tgOrderCompletedTemplate;
        if (!state.storeSettings.tgCustomAcceptedTemplate) state.storeSettings.tgCustomAcceptedTemplate = INITIAL_SETTINGS.tgCustomAcceptedTemplate;
        if (!state.storeSettings.tgCustomRejectedTemplate) state.storeSettings.tgCustomRejectedTemplate = INITIAL_SETTINGS.tgCustomRejectedTemplate;
      }
      if (!state.telegramLogs) state.telegramLogs = [];
      if (!state.customRequests) state.customRequests = [];
      if (!state.users) state.users = [];

      // Auto-seed admin user if not exists
      const hasAdmin = state.users.some(u => 
        u.email === 'admin@beautythings.com'
      );
      if (!hasAdmin) {
        state.users.push({
          id: 'usr-admin',
          email: 'admin@beautythings.com',
          firstName: 'Administrator',
          lastName: 'System',
          phone: '012345678',
          gender: 'Other',
          role: 'admin',
          avatar: `https://api.dicebear.com/7.x/adventurer/svg?seed=Administrator`,
          telegramUsername: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          password: hashPassword('admin@123')
        });
        // Save immediately to file
        fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
      }

      this.cachedState = state;
      return state;
    } catch (e) {
      console.error("Failed to read database file, defaulting to memory state", e);
      return this.cachedState || INITIAL_STATE;
    }
  }

  private save(state: DatabaseState) {
    this.cachedState = state;
    try {
      this.ensureDbExists();
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf8');
    } catch (e) {
      console.error("Failed to save database file", e);
    }
  }

  // --- Products ---
  getProducts(): Product[] {
    return this.load().products;
  }

  getProductById(id: string): Product | undefined {
    return this.getProducts().find(p => p.id === id);
  }

  saveProduct(prod: Product): Product {
    const state = this.load();
    const index = state.products.findIndex(p => p.id === prod.id);
    if (index >= 0) {
      state.products[index] = prod;
    } else {
      state.products.push(prod);
    }
    this.save(state);
    return prod;
  }

  deleteProduct(id: string): boolean {
    const state = this.load();
    const lenBefore = state.products.length;
    state.products = state.products.filter(p => p.id !== id);
    this.save(state);
    return lenBefore !== state.products.length;
  }

  // --- Orders ---
  getOrders(): Order[] {
    return this.load().orders.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getOrderById(id: string): Order | undefined {
    return this.getOrders().find(o => o.id === id);
  }

  saveOrder(order: Order): Order {
    const state = this.load();
    const index = state.orders.findIndex(o => o.id === order.id);
    const updatedOrder = { ...order, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      state.orders[index] = updatedOrder;
    } else {
      state.orders.push(updatedOrder);
    }
    this.save(state);
    return updatedOrder;
  }

  // --- Order History Timeline ---
  getOrderHistory(orderId: string): OrderHistory[] {
    return this.load().orderHistory
      .filter(h => h.orderId === orderId)
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addOrderHistory(orderId: string, status: OrderStatus, remark: string) {
    const state = this.load();
    const newHistory: OrderHistory = {
      id: 'hist-' + Math.random().toString(36).substr(2, 9),
      orderId,
      status,
      remark,
      createdAt: new Date().toISOString()
    };
    state.orderHistory.push(newHistory);
    this.save(state);
    return newHistory;
  }

  // --- Custom Nail Requests ---
  getCustomRequests(): CustomNailRequest[] {
    return this.load().customRequests.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  getCustomRequestById(id: string): CustomNailRequest | undefined {
    return this.getCustomRequests().find(r => r.id === id);
  }

  saveCustomRequest(req: CustomNailRequest): CustomNailRequest {
    const state = this.load();
    const index = state.customRequests.findIndex(r => r.id === req.id);
    const updatedReq = { ...req, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      state.customRequests[index] = updatedReq;
    } else {
      state.customRequests.push(updatedReq);
    }
    this.save(state);
    return updatedReq;
  }

  // --- Settings ---
  getSettings(): StoreSettings {
    return this.load().storeSettings;
  }

  updateSettings(settings: StoreSettings): StoreSettings {
    const state = this.load();
    state.storeSettings = settings;
    this.save(state);
    return settings;
  }

  // --- Telegram Logs ---
  getTelegramLogs(): TelegramLog[] {
    return this.load().telegramLogs.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  addTelegramLog(recipient: string, content: string, status: 'SUCCESS' | 'FAILED', error?: string): TelegramLog {
    const state = this.load();
    const newLog: TelegramLog = {
      id: 'log-' + Math.random().toString(36).substr(2, 9),
      recipient,
      content,
      status,
      error,
      createdAt: new Date().toISOString()
    };
    state.telegramLogs.push(newLog);
    // Keep max 100 logs
    if (state.telegramLogs.length > 100) {
      state.telegramLogs = state.telegramLogs.slice(-100);
    }
    this.save(state);
    return newLog;
  }

  // --- Users ---
  getUsers(): UserProfile[] {
    return this.load().users || [];
  }

  getUserById(id: string): UserProfile | undefined {
    return this.getUsers().find(u => u.id === id || u.email === id);
  }

  saveUser(user: UserProfile): UserProfile {
    const state = this.load();
    if (!state.users) state.users = [];
    const index = state.users.findIndex(u => u.id === user.id || u.email === user.email);
    const updatedUser = { ...user, updatedAt: new Date().toISOString() };
    if (index >= 0) {
      state.users[index] = updatedUser;
    } else {
      state.users.push(updatedUser);
    }
    this.save(state);
    return updatedUser;
  }

  deleteUser(id: string): boolean {
    const state = this.load();
    if (!state.users) return false;
    const lenBefore = state.users.length;
    state.users = state.users.filter(u => u.id !== id && u.email !== id);
    this.save(state);
    return lenBefore !== state.users.length;
  }
}

// Global DB instance
export const db = new DatabaseManager();
