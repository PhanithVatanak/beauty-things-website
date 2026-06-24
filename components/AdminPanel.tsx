'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ClipboardCheck, CreditCard, Sparkles, Settings, FileText, RefreshCw, 
  CheckCircle, XCircle, Clock, Trash2, Plus, Edit, DollarSign, ExternalLink, ShieldCheck, Mail,
  Lock, LogOut, Eye, EyeOff, ShoppingBag, Users, Printer, Check, Undo
} from 'lucide-react';
import { SellerReasonType } from '@/lib/db';

interface AdminPanelProps {
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
  currentUser?: any;
  onImpersonate?: (user: any) => void;
}

export default function AdminPanel({ showToast, currentUser, onImpersonate }: AdminPanelProps) {
  // Authentication states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('beauty_things_admin_auth') === 'true';
    }
    return false;
  });
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [adminLoading, setAdminLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (currentUser?.role === 'admin' || currentUser?.role === 'manager' || currentUser?.role === 'support') {
      setIsAuthenticated(true);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('beauty_things_admin_auth', 'true');
      }
    }
  }, [currentUser]);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) return;
    setAdminLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: adminEmail,
          password: adminPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        if (data.role === 'admin' || data.role === 'manager' || data.role === 'support') {
          setIsAuthenticated(true);
          setError('');
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('beauty_things_admin_auth', 'true');
            localStorage.setItem('beauty_things_user', JSON.stringify(data));
          }
          notify(`Access granted. Welcome, ${data.firstName}!`, 'success');
          window.location.reload();
        } else {
          setError('Access Denied: Only staff accounts are permitted.');
          notify('Customer accounts cannot access console.', 'error');
        }
      } else {
        setError(data.error || 'Invalid username or password');
        notify(data.error || 'Authentication failure.', 'error');
      }
    } catch (err) {
      setError('Network connection failure.');
      notify('Connection error.', 'error');
    } finally {
      setAdminLoading(false);
    }
  };

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('beauty_things_admin_auth');
      localStorage.removeItem('beauty_things_user');
    }
    setIsAuthenticated(false);
    setAdminEmail('');
    setAdminPassword('');
    setError('');
    notify('Successfully logged out.', 'info');
    window.location.reload();
  };



  const [activeTab, setActiveTab] = useState<'orders' | 'payments' | 'requests' | 'products' | 'settings' | 'logs' | 'purchases' | 'users'>('orders');
  
  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (showToast) {
      showToast(msg, type);
    } else {
      console.log(`[Admin Notice]: ${msg}`);
    }
  };
  
  // Data lists
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);
  
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Selected for modals
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [previewInvoiceOrder, setPreviewInvoiceOrder] = useState<any>(null);

  // DECISION SUBMIT STATE
  const [decision, setDecision] = useState<'ACCEPT' | 'ACCEPT_WITH_DELAY' | 'REJECT'>('ACCEPT');
  const [reasonType, setReasonType] = useState<SellerReasonType>('NORMAL');
  const [remark, setRemark] = useState('');
  const [estimatedCompletion, setEstimatedCompletion] = useState('7 days');
  const [customEstDate, setCustomEstDate] = useState('');

  // PAYMENT VERIFICATION COMMENT STATE
  const [paymentApproved, setPaymentApproved] = useState(true);
  const [paymentComment, setPaymentComment] = useState('');

  // CUSTOM REQUEST QUOTATION STATE
  const [quotePrice, setQuotePrice] = useState('');
  const [quoteEstTime, setQuoteEstTime] = useState('5 days');
  const [quoteDecision, setQuoteDecision] = useState<'ACCEPTED' | 'REJECTED'>('ACCEPTED');
  const [quoteComment, setQuoteComment] = useState('');

  // PRODUCT CRUD STATE
  const [isProductFormOpen, setIsProductFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    category: 'Elegant',
    description: '',
    shapes: ['Almond', 'Coffin', 'Square'],
    lengths: ['Short', 'Medium', 'Long'],
    productionTime: '3-5 days',
    isBestSeller: false,
    isNewArrival: false,
    images: ['']
  });

  // STORE SETTINGS STATE
  const [settingsForm, setSettingsForm] = useState({
    deliveryFee: 2.00,
    telegramBotToken: '',
    telegramChannelId: '',
    abaQrText: '',
    abaHolder: '',
    abaNumber: '',
    acledaQrText: '',
    acledaHolder: '',
    acledaNumber: '',
    wingQrText: '',
    wingHolder: '',
    wingNumber: '',
    invoicePrintWidth: '80mm',
    invoiceHeaderNote: '',
    invoiceFooterNote: '',
    deliveryPayMode: 'INCLUDE',
    tgOrderAcceptedTemplate: '',
    tgOrderDelayedTemplate: '',
    tgOrderRejectedTemplate: '',
    tgPaymentUploadedTemplate: '',
    tgPaymentVerifiedTemplate: '',
    tgPaymentDeclinedTemplate: '',
    tgOrderCompletedTemplate: '',
    tgCustomAcceptedTemplate: '',
    tgCustomRejectedTemplate: '',
  });

  // State for active edit/preview modal on Telegram templates
  const [editingTemplateKey, setEditingTemplateKey] = useState<string | null>(null);
  const [previewTemplate, setPreviewTemplate] = useState<{ title: string; templateText: string } | null>(null);
  const [originalTemplateValue, setOriginalTemplateValue] = useState<string>('');

  const getPreviewText = (templateText: string) => {
    if (!templateText) return '';
    const mockVars: Record<string, string> = {
      orderId: 'bt-ord-H1WD7476Q',
      customerName: 'SUN Phanithvatanak',
      estimatedTime: '14 days',
      remark: 'okay will be done on 14 days',
      reasonType: 'DELAY',
      price: '$28.00',
      appUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
    };
    let result = templateText;
    for (const [key, value] of Object.entries(mockVars)) {
      result = result.replace(new RegExp(`{${key}}`, 'g'), value);
    }
    return result;
  };

  const formatTelegramHtmlPreview = (text: string) => {
    const interpolated = getPreviewText(text);
    return { __html: interpolated.replace(/\n/g, '<br />') };
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'orders' || activeTab === 'purchases') {
        const res = await fetch('/api/orders');
        const d = await res.json();
        setOrders(Array.isArray(d) ? d : []);
      } else if (activeTab === 'users') {
        const [ordersRes, usersRes] = await Promise.all([
          fetch('/api/orders'),
          fetch('/api/users')
        ]);
        const ordersData = await ordersRes.json();
        const usersData = await usersRes.json();
        setOrders(Array.isArray(ordersData) ? ordersData : []);
        setUsers(Array.isArray(usersData) ? usersData : []);
      } else if (activeTab === 'requests') {
        const res = await fetch('/api/custom-requests');
        const d = await res.json();
        setRequests(Array.isArray(d) ? d : []);
      } else if (activeTab === 'products') {
        const res = await fetch('/api/products');
        const d = await res.json();
        setProducts(Array.isArray(d) ? d : []);
      } else if (activeTab === 'logs') {
        const res = await fetch('/api/telegram-logs');
        const d = await res.json();
        setLogs(Array.isArray(d) ? d : []);
      } else if (activeTab === 'settings') {
        const res = await fetch('/api/settings');
        const d = await res.json();
        setSettings(d);
        setSettingsForm({
          deliveryFee: d.deliveryFee || 2.00,
          telegramBotToken: d.telegramBotToken || '',
          telegramChannelId: d.telegramChannelId || '',
          abaQrText: d.abaQrText || '',
          abaHolder: d.abaHolder || '',
          abaNumber: d.abaNumber || '',
          acledaQrText: d.acledaQrText || '',
          acledaHolder: d.acledaHolder || '',
          acledaNumber: d.acledaNumber || '',
          wingQrText: d.wingQrText || '',
          wingHolder: d.wingHolder || '',
          wingNumber: d.wingNumber || '',
          invoicePrintWidth: d.invoicePrintWidth || '80mm',
          invoiceHeaderNote: d.invoiceHeaderNote || '',
          invoiceFooterNote: d.invoiceFooterNote || '',
          deliveryPayMode: d.deliveryPayMode || 'INCLUDE',
          tgOrderAcceptedTemplate: d.tgOrderAcceptedTemplate || '',
          tgOrderDelayedTemplate: d.tgOrderDelayedTemplate || '',
          tgOrderRejectedTemplate: d.tgOrderRejectedTemplate || '',
          tgPaymentUploadedTemplate: d.tgPaymentUploadedTemplate || '',
          tgPaymentVerifiedTemplate: d.tgPaymentVerifiedTemplate || '',
          tgPaymentDeclinedTemplate: d.tgPaymentDeclinedTemplate || '',
          tgOrderCompletedTemplate: d.tgOrderCompletedTemplate || '',
          tgCustomAcceptedTemplate: d.tgCustomAcceptedTemplate || '',
          tgCustomRejectedTemplate: d.tgCustomRejectedTemplate || '',
        });
      }
    } catch (e) {
      console.error("Failed to load matching admin data", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const handle = setTimeout(() => {
      loadAllData();
    }, 0);
    return () => clearTimeout(handle);
  }, [activeTab]);

  const purchaseItems = useMemo(() => {
    const itemsList: Array<{
      id: string;
      orderId: string;
      customerName: string;
      phone: string;
      productName: string;
      shape: string;
      length: string;
      quantity: number;
      price: number;
      total: number;
      status: string;
      createdAt: string;
    }> = [];

    orders.forEach(o => {
      if (o.items && Array.isArray(o.items)) {
        o.items.forEach((item: any, index: number) => {
          itemsList.push({
            id: `${o.id}-item-${index}`,
            orderId: o.id,
            customerName: o.customerName,
            phone: o.phone,
            productName: item.name,
            shape: item.shape,
            length: item.length,
            quantity: item.quantity,
            price: item.price,
            total: item.price * item.quantity,
            status: o.status,
            createdAt: o.createdAt
          });
        });
      }
    });

    return itemsList;
  }, [orders]);

  const customerSummary = useMemo(() => {
    const customersMap: { [phone: string]: { name: string; phone: string; telegram: string; ordersCount: number; totalSpent: number; lastOrderDate: string } } = {};
    
    orders.forEach(o => {
      const phoneKey = o.phone || 'No Phone';
      const orderPrice = o.totalPrice || 0;
      const orderDate = o.createdAt;
      
      if (!customersMap[phoneKey]) {
        customersMap[phoneKey] = {
          name: o.customerName || 'Anonymous',
          phone: phoneKey,
          telegram: o.telegramUsername || '',
          ordersCount: 1,
          totalSpent: orderPrice,
          lastOrderDate: orderDate
        };
      } else {
        const current = customersMap[phoneKey];
        current.ordersCount += 1;
        current.totalSpent += orderPrice;
        if (new Date(orderDate).getTime() > new Date(current.lastOrderDate).getTime()) {
          current.lastOrderDate = orderDate;
          current.name = o.customerName || current.name;
          current.telegram = o.telegramUsername || current.telegram;
        }
      }
    });

    return Object.values(customersMap);
  }, [orders]);

  // 1. Submit seller approval / accept-delay options
  const handleDecisionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setActionLoading(true);

    const finalEstTime = estimatedCompletion === 'custom' ? customEstDate : estimatedCompletion;

    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'seller-decision',
          decision,
          reasonType,
          remark,
          estimatedCompletionDate: finalEstTime
        })
      });

      if (res.ok) {
        setSelectedOrder(null);
        setRemark('');
        loadAllData();
      } else {
        notify('Failed to submit decision review.', 'error');
      }
    } catch (err) {
      notify('Network outage while processing decision.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Verified payments release (Approve / Deny screenshot proofs)
  const handleVerifyPayment = async (approved: boolean) => {
    if (!selectedOrder) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify-payment',
          approved,
          sellerComment: paymentComment
        })
      });
      if (res.ok) {
        setSelectedOrder(null);
        setPaymentComment('');
        loadAllData();
      } else {
        notify('Payment action rejection or authorization mismatch.', 'error');
      }
    } catch(e) {
      notify('Network failure.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Complete order production release
  const handleCompleteOrder = async (orderId: string) => {
    if (!confirm('Mark this order as fulfilled & courier dispatched?')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'complete-order'
        })
      });
      if (res.ok) {
        loadAllData();
      }
    } catch(e){}
  };

  const handleMarkAsPicked = async (orderId: string) => {
    if (!confirm('Mark this order as successfully Picked Up / Collected?')) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'picked'
        })
      });
      if (res.ok) {
        loadAllData();
      }
    } catch(e){}
  };

  const handlePrintInvoice = (order: any) => {
    const width = settings?.invoicePrintWidth || '80mm';
    const header = settings?.invoiceHeaderNote || 'Premium Handmade Press-on Nails\nPhnom Penh, Cambodia';
    const footer = settings?.invoiceFooterNote || 'Thank you for choosing Beauty Things! Please follow us on Telegram @beautythings_cambodia.';

    const printWindow = window.open('', '_blank', 'width=600,height=800');
    if (!printWindow) return;

    let widthStyle = 'width: 80mm; padding: 4mm;';
    let pageRule = '@page { size: 80mm auto; margin: 0; }';

    if (width === '58mm') {
      widthStyle = 'width: 58mm; padding: 2mm;';
      pageRule = '@page { size: 58mm auto; margin: 0; }';
    } else if (width === 'A5') {
      widthStyle = 'width: 148mm; padding: 10mm;';
      pageRule = '@page { size: A5; margin: 10mm; }';
    } else if (width === 'A4') {
      widthStyle = 'width: 210mm; padding: 15mm;';
      pageRule = '@page { size: A4; margin: 15mm; }';
    }

    const itemsHtml = order.items.map((item: any) => `
      <tr style="border-bottom: 1px dashed #eee;">
        <td style="padding: 6px 0; font-size: 11px; text-align: left;">
          <strong>${item.name}</strong><br/>
          <span style="font-size: 9px; color: #666;">Shape: ${item.shape} / Len: ${item.length}</span>
        </td>
        <td style="padding: 6px 0; text-align: center; font-size: 11px;">${item.quantity}</td>
        <td style="padding: 6px 0; text-align: right; font-size: 11px; font-family: monospace;">$${item.price.toFixed(2)}</td>
        <td style="padding: 6px 0; text-align: right; font-size: 11px; font-family: monospace;">$${(item.price * item.quantity).toFixed(2)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Invoice - ${order.id}</title>
          <style>
            ${pageRule}
            body {
              font-family: 'Courier New', Courier, monospace;
              color: #000;
              margin: 0;
              padding: 0;
              background: #fff;
              -webkit-print-color-adjust: exact;
            }
            .invoice-box {
              ${widthStyle}
              box-sizing: border-box;
              margin: 0 auto;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .header { margin-bottom: 15px; border-bottom: 2px dashed #000; padding-bottom: 10px; }
            .footer { margin-top: 20px; border-top: 2px dashed #000; padding-top: 10px; font-size: 10px; }
            .info-table { width: 100%; margin-bottom: 15px; font-size: 11px; }
            .items-table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
            .totals-table { width: 100%; margin-top: 10px; border-top: 1px dashed #000; padding-top: 8px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <div class="header text-center">
              <h2 style="margin: 0 0 5px 0; font-size: 18px; font-family: sans-serif;">BEAUTY THINGS</h2>
              <div style="font-size: 10px; margin-bottom: 8px; white-space: pre-line;">${header}</div>
              <div style="font-size: 11px; font-weight: bold;">SALES INVOICE</div>
            </div>

            <table class="info-table">
              <tr>
                <td><strong>Invoice No:</strong> ${order.id}</td>
                <td class="text-right"><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td><strong>Customer:</strong> ${order.customerName}</td>
                <td class="text-right"><strong>Phone:</strong> ${order.phone}</td>
              </tr>
              <tr>
                <td colspan="2"><strong>Address:</strong> ${order.deliveryAddress}</td>
              </tr>
            </table>

            <table class="items-table">
              <thead>
                <tr style="border-bottom: 1px solid #000; font-weight: bold;">
                  <th style="text-align: left; padding-bottom: 5px;">Item</th>
                  <th style="text-align: center; padding-bottom: 5px; width: 40px;">Qty</th>
                  <th style="text-align: right; padding-bottom: 5px; width: 60px;">Price</th>
                  <th style="text-align: right; padding-bottom: 5px; width: 60px;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <table class="totals-table">
              <tr>
                <td>Subtotal:</td>
                <td class="text-right font-mono">$${(order.subtotal !== undefined ? order.subtotal : (order.totalPrice - order.deliveryFee)).toFixed(2)}</td>
              </tr>
              <tr>
                <td>Delivery Fee (${order.deliveryOption}):</td>
                <td class="text-right font-mono">$${order.deliveryFee.toFixed(2)}</td>
              </tr>
              <tr style="font-size: 13px; font-weight: bold; border-top: 1px solid #000;">
                <td style="padding-top: 5px;">GRAND TOTAL:</td>
                <td class="text-right font-mono" style="padding-top: 5px;">$${order.totalPrice.toFixed(2)}</td>
              </tr>
            </table>

            <div class="footer text-center">
              <p style="margin: 0 0 5px 0;">Status: <strong>${order.status}</strong></p>
              <p style="margin: 0; white-space: pre-line;">${footer}</p>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 4. Send Custom Requests replies (Pricing quotes)
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequest) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/custom-requests/${selectedRequest.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'admin-reply',
          status: quoteDecision,
          price: quoteDecision === 'ACCEPTED' ? quotePrice : undefined,
          estimatedTime: quoteDecision === 'ACCEPTED' ? quoteEstTime : undefined,
          sellerReasonType: quoteDecision === 'REJECTED' ? 'MATERIAL_SHORTAGE' : 'NORMAL',
          sellerRemark: quoteComment
        })
      });
      if (res.ok) {
        setSelectedRequest(null);
        setQuotePrice('');
        setQuoteComment('');
        loadAllData();
      } else {
        notify('Quotation submit failure.', 'error');
      }
    } catch(err) {
      notify('Network malfunction.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Product creation / update
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...productForm,
          id: editingProduct?.id || undefined,
          price: parseFloat(productForm.price)
        })
      });
      if (res.ok) {
        setIsProductFormOpen(false);
        setEditingProduct(null);
        setProductForm({
          name: '', price: '', category: 'Elegant', description: '',
          shapes: ['Almond', 'Coffin', 'Square'], lengths: ['Short', 'Medium', 'Long'],
          productionTime: '3-5 days', isBestSeller: false, isNewArrival: false, images: ['']
        });
        loadAllData();
      } else {
        notify('Product write operation rejected.', 'error');
      }
    } catch(err) {
      notify('Network failure.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this press-on design from catalog?')) return;
    try {
      const res = await fetch(`/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'x-requester-email': currentUser?.email || ''
        }
      });
      if (res.ok) {
        loadAllData();
        notify('Product deleted successfully.', 'success');
      } else {
        const errData = await res.json();
        notify(errData.error || 'Failed to delete product.', 'error');
      }
    } catch(e){
      notify('Network error deleting product.', 'error');
    }
  };

  const handleUpdateRole = async (targetUser: any, nextRole: 'admin' | 'manager' | 'support' | 'customer') => {
    if (!confirm(`Are you sure you want to change ${targetUser.firstName}'s role to ${nextRole}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-requester-email': currentUser?.email || ''
        },
        body: JSON.stringify({
          ...targetUser,
          role: nextRole
        })
      });
      if (res.ok) {
        notify(`Role updated to ${nextRole} successfully!`, 'success');
        loadAllData();
      } else {
        const data = await res.json();
        notify(data.error || 'Failed to update role.', 'error');
      }
    } catch (e) {
      notify('Network error updating role.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (userEmail: string) => {
    if (!confirm(`Are you sure you want to delete the user profile for ${userEmail}?`)) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
        headers: {
          'x-requester-email': currentUser?.email || ''
        }
      });
      if (res.ok) {
        notify('User profile deleted successfully.', 'success');
        loadAllData();
      } else {
        const data = await res.json();
        notify(data.error || 'Failed to delete user profile.', 'error');
      }
    } catch (e) {
      notify('Network error deleting user profile.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Settings PUT update
  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...settingsForm,
          deliveryFee: parseFloat(settingsForm.deliveryFee.toString())
        })
      });
      if (res.ok) {
        notify('Settings updated successfully!', 'success');
        loadAllData();
      }
    } catch(err) {
      notify('Settings transmission failure.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const navs = [
    { key: 'orders', label: 'Bespoke Orders', icon: ClipboardCheck },
    { key: 'payments', label: 'Payment Proofs', icon: CreditCard },
    { key: 'requests', label: 'Custom Quotes', icon: Sparkles },
    { key: 'purchases', label: 'Purchases Ledger', icon: ShoppingBag },
    { key: 'users', label: 'Customer Registry', icon: Users },
    { key: 'products', label: 'Products Catalog', icon: Plus },
    { key: 'settings', label: 'Store Settings', icon: Settings },
    { key: 'logs', label: 'Telegram Logs', icon: FileText },
  ];

  if (!isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-[600px] px-4 py-12 animate-fadeIn" id="admin-login-view">
        <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] relative overflow-hidden">
          {/* Decorative gradients */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#FFD6E7]/30 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-[#D4A373]/10 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col items-center text-center space-y-4 mb-8">
            <div className="w-16 h-16 bg-[#FF5FA2]/10 rounded-2xl flex items-center justify-center text-[#FF5FA2] shadow-[0_8px_16px_rgba(255,95,162,0.1)]">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-gray-900">Beauty Things HQ</h2>
              <p className="text-xs text-gray-500 mt-1.5 font-sans">Authorized Staff Portal Console</p>
            </div>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-xs font-semibold text-center leading-normal">
                {error}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-sans">
                Username or Email
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={adminEmail}
                  onChange={(e) => {
                    setError('');
                    setAdminEmail(e.target.value);
                  }}
                  placeholder="e.g. Administrator or user@example.com"
                  className="w-full pl-10 pr-4 py-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#FF5FA2] font-semibold text-stone-800"
                  autoFocus
                />
                <span className="absolute left-3 top-3.5 text-gray-400">
                  <Mail className="w-4 h-4" />
                </span>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block font-sans">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  value={adminPassword}
                  onChange={(e) => {
                    setError('');
                    setAdminPassword(e.target.value);
                  }}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:border-[#FF5FA2] font-mono text-stone-850"
                />
                <span className="absolute left-3 top-3.5 text-gray-400">
                  <Lock className="w-4 h-4" />
                </span>
              </div>
            </div>

            <button
              type="submit"
              disabled={adminLoading}
              className="w-full py-3.5 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer shadow-sm disabled:opacity-50 mt-4"
            >
              {adminLoading ? 'Verifying Identity...' : 'Access Staff Console'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6" id="admin-workspace">
      
      {/* Upper header segment */}
      <div className="bg-white border border-gray-105 rounded-3xl p-8 shadow-[0_2px_12px_rgba(0,0,0,0.02)] flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 opacity-[0.02] font-serif text-9xl select-none italic font-bold pointer-events-none">
          Studio
        </div>
        <div className="flex items-center space-x-4 z-10">
          <span className="w-12 h-12 bg-[#FFD6E7]/35 rounded-full flex items-center justify-center text-[#FF5FA2]">
            <ShieldCheck className="w-6 h-6" />
          </span>
          <div>
            <h1 className="font-serif text-2xl font-medium tracking-tight text-gray-950">Beauty Things HQ</h1>
            <p className="text-xs text-gray-500 mt-1">Administrative Order Management, Quotations & Bank Ledger Verification</p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 z-10">
          <button
            onClick={loadAllData}
            className="px-6 py-3 bg-gray-900 hover:bg-black text-[10px] font-bold uppercase tracking-widest text-white rounded-full cursor-pointer flex items-center space-x-2 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Sync Live Records</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 text-[10px] font-bold uppercase tracking-widest text-white rounded-full cursor-pointer flex items-center space-x-2 transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Tab bar */}
      <div className="flex overflow-x-auto pb-2 scrollbar-none">
        <div className="flex space-x-1.5 bg-gray-100/75 p-1 rounded-2xl w-full sm:w-auto">
          {navs.map(nav => {
            const Icon = nav.icon;
            const active = activeTab === nav.key;
            return (
              <button
                key={nav.key}
                onClick={() => {
                  setActiveTab(nav.key as any);
                  setSelectedOrder(null);
                  setSelectedRequest(null);
                }}
                className={`flex items-center space-x-2 px-5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  active 
                    ? 'bg-white text-[#FF5FA2] shadow-[0_2px_8px_rgba(0,0,0,0.04)]' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{nav.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {loading && !actionLoading && (
        <div className="text-center py-16 text-stone-500 font-mono text-xs flex flex-col items-center justify-center space-y-2">
          <RefreshCw className="w-8 h-8 animate-spin text-[#FF5FA2]" />
          <span>Loading admin credentials & records...</span>
        </div>
      )}

      {!loading && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm min-h-[400px]">
          
          {/* TAB 1: ORDERS LIST & DESIGNER DECISION APPROVALS */}
          {activeTab === 'orders' && (
            <div className="space-y-6" id="tab-admin-orders">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-stone-900">Bespoke Press-On Orders</h2>
                <span className="text-xs font-medium text-stone-500">{orders.length} total requests found</span>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-16 text-stone-400 text-xs italic">No orders received on network yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-100 text-stone-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">Order ID</th>
                        <th className="py-3 px-2">Customer</th>
                        <th className="py-3 px-2">Price</th>
                        <th className="py-3 px-2">Telegram Handle</th>
                        <th className="py-3 px-2">Status</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {orders.map(o => (
                        <tr key={o.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="py-3 px-2 font-mono font-bold text-[#FF5FA2]">{o.id.slice(0, 8)}</td>
                          <td className="py-3 px-2">
                            <div className="font-bold text-stone-900">{o.customerName}</div>
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5">{o.phone}</div>
                          </td>
                          <td className="py-3 px-2 font-bold font-mono text-stone-900">${o.totalPrice.toFixed(2)}</td>
                          <td className="py-3 px-2">
                            {o.telegramUsername ? (
                              <a 
                                href={`https://t.me/${o.telegramUsername}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-primary hover:underline flex items-center space-x-1 font-mono hover:font-bold"
                              >
                                <span>@{o.telegramUsername}</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            ) : (
                              <span className="text-stone-400 italic text-[11px]">N/A</span>
                            )}
                          </td>
                          <td className="py-3 px-2">
                            <span className={`px-2.5 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                              o.status === 'PENDING_REVIEW' ? 'bg-amber-100 text-amber-700 border border-amber-200 animate-pulse' :
                              o.status === 'WAITING_PAYMENT' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                              o.status === 'PAYMENT_UPLOADED' ? 'bg-purple-100 text-purple-700 border border-purple-200 font-bold' :
                              o.status === 'IN_PRODUCTION' ? 'bg-pink-100 text-[#FF5FA2] border border-pink-200' :
                              o.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                              o.status === 'PICKED' ? 'bg-blue-50 text-blue-700 border border-blue-150 font-bold' : 'bg-stone-200 text-stone-600'
                            }`}>
                              {o.status}
                            </span>
                          </td>
                          <td className="py-3 px-2 text-right space-x-1.5">
                            {o.status === 'PENDING_REVIEW' && (
                              <button
                                onClick={() => setSelectedOrder(o)}
                                className="px-3 py-1 bg-[#FF5FA2] hover:bg-pink-600 text-white rounded-full font-bold text-[10px] cursor-pointer"
                              >
                                Review/Decide
                              </button>
                            )}
                            {o.status === 'PAYMENT_UPLOADED' && (
                              <button
                                onClick={() => {
                                  setSelectedOrder(o);
                                  setActiveTab('payments');
                                }}
                                className="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-full font-bold text-[10px] cursor-pointer"
                              >
                                Verify Proof
                              </button>
                            )}
                            {o.status === 'IN_PRODUCTION' && (
                              <button
                                onClick={() => handleCompleteOrder(o.id)}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full font-bold text-[10px] cursor-pointer"
                              >
                                Complete Nail Set
                              </button>
                            )}
                            {o.status === 'COMPLETED' && (
                              <button
                                onClick={() => handleMarkAsPicked(o.id)}
                                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-bold text-[10px] cursor-pointer"
                              >
                                Mark as Picked
                              </button>
                            )}
                            {o.status !== 'CANCELLED' && o.status !== 'REJECTED' && (
                              <button
                                onClick={() => setPreviewInvoiceOrder(o)}
                                className="px-3 py-1 bg-stone-100 hover:bg-stone-200 text-stone-700 hover:text-stone-950 rounded-full font-bold text-[10px] cursor-pointer transition-all inline-block"
                              >
                                Print Invoice
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* HANDCRAFT APPROVAL / DECISION MODAL PANEL */}
              {selectedOrder && selectedOrder.status === 'PENDING_REVIEW' && (
                <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn" id="designer-decision-modal">
                  <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-pink-100 shadow-2xl space-y-6 relative">
                    <button
                      onClick={() => setSelectedOrder(null)}
                      className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors cursor-pointer"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                    
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono tracking-wider text-stone-400">DECISION GATEWAY</span>
                      <h3 className="font-serif text-xl font-bold text-stone-900">Approve Custom Order #{selectedOrder.id.slice(0, 8)}</h3>
                      <p className="text-xs text-stone-500">Customer: {selectedOrder.customerName}. Subtotal: ${selectedOrder.subtotal.toFixed(2)}</p>
                    </div>

                    <form onSubmit={handleDecisionSubmit} className="space-y-4">
                      
                      {/* DECISION OPTION RADIO */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-stone-700">Designer Action</label>
                        <div className="grid grid-cols-3 gap-2">
                          {(['ACCEPT', 'ACCEPT_WITH_DELAY', 'REJECT'] as const).map(dec => (
                            <button
                              key={dec}
                              type="button"
                              onClick={() => setDecision(dec)}
                              className={`py-2 text-[10px] font-bold rounded-lg border uppercase tracking-wider text-center transition-all ${
                                decision === dec
                                  ? dec === 'REJECT'
                                    ? 'bg-red-50 text-red-650 border-red-300'
                                    : 'bg-primary text-white border-primary shadow-xs'
                                  : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                              }`}
                            >
                              {dec === 'ACCEPT_WITH_DELAY' ? 'Delayed Wait' : dec}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* ESTIMATED DAYS SELECT */}
                      {decision !== 'REJECT' && (
                        <div className="space-y-1.5">
                          <label className="block text-xs font-bold text-stone-700">Estimated Production / Shipping Time</label>
                          <div className="grid grid-cols-4 gap-2">
                            {['3 days', '7 days', '14 days', 'custom'].map(t => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => setEstimatedCompletion(t)}
                                className={`py-1.5 text-[10px] font-bold rounded-lg border text-center transition-all ${
                                  estimatedCompletion === t
                                    ? 'bg-stone-900 text-white border-stone-900'
                                    : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>
                          
                          {estimatedCompletion === 'custom' && (
                            <input
                              type="text"
                              value={customEstDate}
                              onChange={(e) => setCustomEstDate(e.target.value)}
                              placeholder="e.g. 21 days (delayed back-order)"
                              className="w-full mt-2 px-3 py-2 text-xs rounded-lg border border-stone-200 font-mono font-semibold"
                            />
                          )}
                        </div>
                      )}

                      {/* REASON SELECT */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-stone-700">Reason Category Type</label>
                        <select
                          value={reasonType}
                          onChange={(e) => setReasonType(e.target.value as SellerReasonType)}
                          className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 font-semibold text-stone-700"
                        >
                          <option value="NORMAL">NORMAL (Everything on track)</option>
                          <option value="DELAY">DELAY (Temporary queue buffer)</option>
                          <option value="MATERIAL_SHORTAGE">MATERIAL_SHORTAGE (Specific nail shells missing)</option>
                          <option value="FULLY_BOOKED">FULLY_BOOKED (Studio slots saturated)</option>
                          <option value="CUSTOM">CUSTOM (Specific modification notes)</option>
                        </select>
                      </div>

                      {/* SELLER REMARK */}
                      <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-[#FF5FA2]">Seller Remark (Sent directly to Customer via Telegram) *</label>
                        <textarea
                          rows={3}
                          required
                          value={remark}
                          onChange={(e) => setRemark(e.target.value)}
                          placeholder={
                            decision === 'ACCEPT' ? 'e.g. Order accepted. We will start production.' :
                            decision === 'ACCEPT_WITH_DELAY' ? 'e.g. High order volume. Delivery will take 14 days.' :
                            'e.g. Material not available for this design.'
                          }
                          className="w-full px-3 py-2 text-xs rounded-lg border border-stone-200 focus:outline-[#FF5FA2]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={actionLoading}
                        className={`w-full py-2.5 rounded-lg text-white font-bold text-xs shadow-md transition-all uppercase tracking-widest ${
                          actionLoading ? 'bg-pink-300' : 'bg-primary hover:bg-pink-600'
                        }`}
                      >
                        {actionLoading ? 'Updating ledger and dispatching Telegram message...' : 'Commit Decision & Alert Bot'}
                      </button>

                    </form>
                  </div>
                </div>
              )}

            </div>
          )}

          {/* TAB 2: PAYMENTS SCREENSHOT VERIFICATION */}
          {activeTab === 'payments' && (
            <div className="space-y-6" id="tab-admin-payments">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-stone-900">Payment Proofs Review Ledger</h2>
                <span className="text-xs font-mono font-medium text-[#FF5FA2]">Awaiting authorization audit</span>
              </div>

              {orders.filter(o => o.status === 'PAYMENT_UPLOADED').length === 0 ? (
                <div className="text-center py-16 text-stone-400 text-xs italic">All payment tickets have been audited or verified. Good job!</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Ledger list */}
                  <div className="space-y-4">
                    {orders.filter(o => o.status === 'PAYMENT_UPLOADED').map(o => (
                      <div 
                        key={o.id}
                        onClick={() => setSelectedOrder(o)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all ${
                          selectedOrder?.id === o.id
                            ? 'border-primary bg-pink-50/10'
                            : 'border-stone-250 bg-stone-50/50 hover:bg-stone-50'
                        }`}
                      >
                        <div className="flex justify-between font-mono font-bold text-xs">
                          <span className="text-primary truncate">#{o.id.slice(0, 8)}</span>
                          <span className="text-stone-900">${o.totalPrice.toFixed(2)}</span>
                        </div>
                        <div className="text-stone-700 text-xs font-bold mt-1.5">{o.customerName}</div>
                        <div className="text-[10px] text-stone-500 font-mono mt-1 flex justify-between">
                          <span>Bank: {o.paymentMethod || 'ABA'}</span>
                          <span>Ref: {o.transactionRef || 'N/A'}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Receipt Lightbox block */}
                  <div>
                    {selectedOrder && selectedOrder.status === 'PAYMENT_UPLOADED' ? (
                      <div className="border border-stone-200 rounded-2xl p-4 space-y-4 bg-stone-50/10">
                        <div className="text-center">
                          <h4 className="text-xs font-bold text-stone-900">Receipt Verification Desk</h4>
                          <span className="text-[10px] font-mono text-[#D4A373]">Reference key matches bank reports</span>
                        </div>

                        {selectedOrder.paymentScreenshot ? (
                          <div className="relative group border border-stone-200 rounded-xl overflow-hidden bg-white max-h-72 flex items-center justify-center p-1.5">
                            <img
                              src={selectedOrder.paymentScreenshot}
                              alt="Transaction Proof Screen"
                              className="max-h-64 object-contain filter hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="text-center py-12 text-stone-400 text-xs bg-white rounded-lg border italic">No visual uploaded.</div>
                        )}

                        <div className="bg-stone-50 p-3 rounded-lg text-xs space-y-1">
                          <div><b>Ref Key:</b> <code className="bg-white px-1 py-0.5 rounded border text-purple-700 font-bold">{selectedOrder.transactionRef || 'None'}</code></div>
                          <div><b>Client:</b> {selectedOrder.customerName}{selectedOrder.telegramUsername ? ` / @${selectedOrder.telegramUsername}` : ''}</div>
                          <div><b>Phone:</b> {selectedOrder.phone}</div>
                        </div>

                        <div className="space-y-1.5">
                          <label className="block text-xs font-semibold text-stone-700">Internal Audit Remark / Client Message</label>
                          <textarea
                            rows={2}
                            value={paymentComment}
                            onChange={(e) => setPaymentComment(e.target.value)}
                            placeholder="e.g. Transaction verified. Starting production!"
                            className="w-full text-xs px-2.5 py-1.5 border border-stone-200 rounded-lg focus:outline-[#FF5FA2]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2" id="payment-audit-actions">
                          <button
                            disabled={actionLoading}
                            onClick={() => handleVerifyPayment(true)}
                            className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full cursor-pointer flex items-center justify-center space-x-1"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>Confirm Balance</span>
                          </button>
                          <button
                            disabled={actionLoading}
                            onClick={() => handleVerifyPayment(false)}
                            className="py-2 bg-red-100 hover:bg-red-200 text-red-600 font-bold text-xs rounded-full cursor-pointer flex items-center justify-center space-x-1"
                          >
                            <XCircle className="w-4 h-4" />
                            <span>Decline Receipt</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-20 text-stone-400 text-xs italic border-2 border-dashed border-stone-200 rounded-xl">
                        Select an uploaded payment ticket from the list to preview bank screenshot and complete ledger audit.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CUSTOM CREATIONS QUOTES & REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-6" id="tab-admin-requests">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-stone-900">Custom Nail Design Requests</h2>
                <span className="text-xs text-stone-400">{requests.length} requests received</span>
              </div>

              {requests.length === 0 ? (
                <div className="text-center py-16 text-stone-400 text-xs italic">No design request files received on system.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Requests register */}
                  <div className="space-y-4">
                    {requests.map(req => (
                      <div
                        key={req.id}
                        onClick={() => setSelectedRequest(req)}
                        className={`p-4 border rounded-xl cursor-pointer transition-all flex justify-between items-start ${
                          selectedRequest?.id === req.id
                            ? 'border-primary bg-pink-50/10 scale-[0.99]'
                            : 'border-stone-250 hover:bg-stone-50'
                        }`}
                      >
                        <div className="space-y-1 max-w-[70%]">
                          <code className="text-[10px] font-bold text-primary font-mono block">REQUEST ID: #{req.id.slice(0, 8)}</code>
                          <div className="text-xs font-bold text-stone-900">Shape: {req.nailShape} / L: {req.nailLength}</div>
                          <p className="text-[10px] text-stone-500 truncate mt-0.5">Notes: {req.notes || 'None'}</p>
                        </div>
                        <span className={`block px-2 text-[9px] font-bold rounded-full uppercase ${
                          req.status === 'PENDING' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                          req.status === 'ACCEPTED' ? 'bg-emerald-100 text-emerald-700 font-semibold' : 'bg-red-100 text-red-700'
                        }`}>
                          {req.status}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Quoter form panel */}
                  <div>
                    {selectedRequest ? (
                      <div className="border border-stone-200 rounded-2xl p-5 space-y-4 bg-stone-50/10">
                        <div className="font-mono text-[10px] text-stone-400">CREATIVE DECOR DESIGN FILE</div>
                        
                        {/* Reference Image Thumbnail */}
                        {selectedRequest.referenceImage ? (
                          <div className="border border-stone-200 bg-white rounded-lg p-1.5 flex items-center justify-center max-h-56 overflow-hidden">
                            <img
                              src={selectedRequest.referenceImage}
                              alt="Bespoke Reference Diagram"
                              className="max-h-48 object-contain rounded-md"
                            />
                          </div>
                        ) : (
                          <div className="text-center py-8 text-stone-400 text-xs bg-white italic border rounded">No illustration available.</div>
                        )}

                        <div className="text-xs space-y-1 border-b border-stone-100 pb-3">
                          <div><b>Preferred Layout:</b> {selectedRequest.nailShape} shape, {selectedRequest.nailLength} length</div>
                          <div><b>Colors Schema:</b> {selectedRequest.colorPreference}</div>
                          <p className="text-stone-600 bg-white p-2.5 rounded border text-[11px] mt-2 italic leading-relaxed">
                            &ldquo;{selectedRequest.notes || 'No added notes specs.'}&rdquo;
                          </p>
                        </div>

                        {selectedRequest.status === 'PENDING' ? (
                          <form onSubmit={handleQuoteSubmit} className="space-y-4" id="custom-nail-quoter-form">
                            
                            <div className="grid grid-cols-2 gap-2">
                              <button
                                type="button"
                                onClick={() => setQuoteDecision('ACCEPTED')}
                                className={`py-1.5 text-xs font-bold rounded-lg border text-center transition-all ${
                                  quoteDecision === 'ACCEPTED' ? 'bg-emerald-600 border-emerald-600 text-white' : 'border-stone-200 text-stone-600'
                                }`}
                              >
                                Accept & Price File
                              </button>
                              <button
                                type="button"
                                onClick={() => setQuoteDecision('REJECTED')}
                                className={`py-1.5 text-xs font-bold rounded-lg border text-center transition-all ${
                                  quoteDecision === 'REJECTED' ? 'bg-red-650 border-red-400 text-white' : 'border-stone-200 text-stone-600'
                                }`}
                              >
                                Reject File
                              </button>
                            </div>

                            {quoteDecision === 'ACCEPTED' && (
                              <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-stone-700 block">Quoted Price ($USD)</label>
                                  <input
                                    type="number"
                                    required
                                    step="0.01"
                                    value={quotePrice}
                                    onChange={(e) => setQuotePrice(e.target.value)}
                                    placeholder="e.g. 35.00"
                                    className="w-full px-3 py-1.5 text-xs rounded border border-stone-200 font-mono font-semibold"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <label className="text-xs font-semibold text-stone-700 block">Time Estimate</label>
                                  <input
                                    type="text"
                                    required
                                    value={quoteEstTime}
                                    onChange={(e) => setQuoteEstTime(e.target.value)}
                                    placeholder="e.g. 5 days"
                                    className="w-full px-3 py-1.5 text-xs rounded border border-stone-200 font-semibold text-stone-700"
                                  />
                                </div>
                              </div>
                            )}

                            <div className="space-y-1">
                              <label className="text-xs font-semibold text-[#FF5FA2] block">Designer Feedback Notes (Sent via Telegram) *</label>
                              <textarea
                                rows={2.5}
                                required
                                value={quoteComment}
                                onChange={(e) => setQuoteComment(e.target.value)}
                                placeholder="Write design evaluation advice or reason of cancellation here..."
                                className="w-full px-2.5 py-1.5 text-xs rounded border border-stone-200 focus:outline-[#FF5FA2]"
                              />
                            </div>

                            <button
                              type="submit"
                              disabled={actionLoading}
                              className="w-full py-2 bg-[#FF5FA2] hover:bg-pink-600 text-white text-xs font-bold rounded-full shadow-xs cursor-pointer tracking-wider"
                            >
                              Dispatch Decision
                            </button>

                          </form>
                        ) : (
                          <div className="p-3 bg-emerald-50 rounded-lg text-emerald-800 text-xs font-semibold">
                            Quote Decided: {selectedRequest.status}. Cost: ${selectedRequest.price || 'N/A'}. Estimates: {selectedRequest.estimatedTime || 'N/A'}. 
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-20 text-stone-400 text-xs border-2 border-dashed border-stone-200 rounded-xl italic">
                        Select an active bespoke creation specification file to review reference sketch, price designs, and message back customers.
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3.5: PURCHASES LEDGER */}
          {activeTab === 'purchases' && (
            <div className="space-y-6" id="tab-admin-purchases">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-stone-900">Purchases & Items Ledger</h2>
                <span className="text-xs font-medium text-stone-500">{purchaseItems.length} purchased items compiled</span>
              </div>

              {purchaseItems.length === 0 ? (
                <div className="text-center py-16 text-stone-400 text-xs italic">No items purchased on records yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-100 text-stone-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">Date</th>
                        <th className="py-3 px-2">Order ID</th>
                        <th className="py-3 px-2">Customer</th>
                        <th className="py-3 px-2">Nail Art Product</th>
                        <th className="py-3 px-2">Specs (Shape/Len)</th>
                        <th className="py-3 px-2 text-center">Qty</th>
                        <th className="py-3 px-2 font-mono">Unit Price</th>
                        <th className="py-3 px-2 font-mono">Total Paid</th>
                        <th className="py-3 px-2 text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {purchaseItems.map((item) => (
                        <tr key={item.id} className="hover:bg-stone-50/50 transition-colors">
                          <td className="py-3 px-2 font-mono text-stone-500">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-2 font-mono font-bold text-[#FF5FA2]">
                            {item.orderId.slice(0, 8)}
                          </td>
                          <td className="py-3 px-2">
                            <div className="font-bold text-stone-900">{item.customerName}</div>
                            <div className="text-[10px] text-stone-400 font-mono mt-0.5">{item.phone}</div>
                          </td>
                          <td className="py-3 px-2 font-semibold text-stone-850">
                            {item.productName}
                          </td>
                          <td className="py-3 px-2 text-stone-500 font-mono text-[10px]">
                            {item.shape} / {item.length}
                          </td>
                          <td className="py-3 px-2 text-center font-bold text-stone-900">
                            {item.quantity}
                          </td>
                          <td className="py-3 px-2 font-mono font-medium text-stone-600">
                            ${item.price.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 font-mono font-bold text-stone-900">
                            ${item.total.toFixed(2)}
                          </td>
                          <td className="py-3 px-2 text-right">
                            <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full uppercase tracking-wider ${
                              item.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700' :
                              item.status === 'IN_PRODUCTION' ? 'bg-pink-100 text-[#FF5FA2]' :
                              item.status === 'PAYMENT_UPLOADED' ? 'bg-purple-100 text-purple-700' :
                              item.status === 'WAITING_PAYMENT' ? 'bg-blue-100 text-blue-700' :
                              item.status === 'CANCELLED' || item.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                              'bg-stone-100 text-stone-650'
                            }`}>
                              {item.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 3.6: CUSTOMER DIRECTORY */}
          {activeTab === 'users' && (
            <div className="space-y-6" id="tab-admin-users">
              <div className="flex justify-between items-center">
                <h2 className="text-base font-bold text-stone-900">Customer & User Registry</h2>
                <span className="text-xs font-medium text-stone-500">{users.length} registered profiles found</span>
              </div>

              {users.length === 0 ? (
                <div className="text-center py-16 text-stone-400 text-xs italic">No registered profiles in database.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-stone-100 text-stone-400 font-bold uppercase tracking-wider">
                        <th className="py-3 px-2">User Profile</th>
                        <th className="py-3 px-2">Contact info</th>
                        <th className="py-3 px-2 text-center">Gender</th>
                        <th className="py-3 px-2 text-center">Role</th>
                        <th className="py-3 px-2 text-center">Orders</th>
                        <th className="py-3 px-2 font-mono">Total Spent</th>
                        <th className="py-3 px-2">Joined Date</th>
                        <th className="py-3 px-2 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-50">
                      {users.map((user) => {
                        const userOrdersCount = orders.filter(o => 
                          o.phone === user.phone || 
                          o.customerName.toLowerCase() === `${user.firstName} ${user.lastName}`.toLowerCase()
                        ).length;

                        const userTotalSpent = orders.filter(o => 
                          o.phone === user.phone || 
                          o.customerName.toLowerCase() === `${user.firstName} ${user.lastName}`.toLowerCase()
                        ).reduce((sum, o) => sum + o.totalPrice, 0);

                        return (
                          <tr key={user.id} className="hover:bg-stone-50/50 transition-colors">
                            <td className="py-3 px-2">
                              <div className="flex items-center space-x-3">
                                <img
                                  src={user.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.email}`}
                                  alt={user.firstName}
                                  className="w-8 h-8 rounded-full border border-stone-200"
                                />
                                <div>
                                  <div className="font-bold text-stone-905">{user.firstName} {user.lastName}</div>
                                  <div className="text-[10px] text-stone-400 font-mono">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="py-3 px-2 font-mono text-stone-600 font-medium">
                              <div>Phone: {user.phone}</div>
                            </td>
                            <td className="py-3 px-2 text-center text-stone-500 font-medium">
                              {user.gender}
                            </td>
                            <td className="py-3 px-2 text-center">
                              <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full uppercase tracking-wider ${
                                user.role === 'admin' ? 'bg-pink-100 text-primary border border-pink-200' :
                                user.role === 'manager' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                                user.role === 'support' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                                'bg-blue-50 text-blue-600 border border-blue-100'
                              }`}>
                                {user.role}
                              </span>
                            </td>
                            <td className="py-3 px-2 text-center font-bold text-stone-900">
                              {userOrdersCount}
                            </td>
                            <td className="py-3 px-2 font-mono font-bold text-[#FF5FA2]">
                              ${userTotalSpent.toFixed(2)}
                            </td>
                            <td className="py-3 px-2 font-mono text-[10px] text-stone-500">
                              {new Date(user.createdAt).toLocaleDateString()}
                            </td>
                            <td className="py-3 px-2 text-right font-sans space-x-1.5">
                              {(() => {
                                const reqRole = currentUser?.role;

                                // support cannot promote/demote or delete anyone
                                if (reqRole === 'support') {
                                  return <span className="text-[10px] text-stone-400 italic">No permissions</span>;
                                }

                                if (reqRole === 'manager') {
                                  // manager can promote/demote to support only, and delete customer/support profiles
                                  const isCustomer = user.role === 'customer';
                                  const isSupport = user.role === 'support';
                                  
                                  return (
                                    <div className="flex items-center justify-end space-x-2">
                                      {/* Impersonate button */}
                                      <button
                                        onClick={() => onImpersonate?.(user)}
                                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-full font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all inline-block"
                                        title="Login as this user"
                                      >
                                        Impersonate
                                      </button>

                                      {isCustomer && (
                                        <button
                                          onClick={() => handleUpdateRole(user, 'support')}
                                          disabled={actionLoading}
                                          className="px-2.5 py-1 bg-stone-900 hover:bg-black text-white rounded-full font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all inline-block animate-fadeIn"
                                        >
                                          Make Support
                                        </button>
                                      )}
                                      {isSupport && (
                                        <button
                                          onClick={() => handleUpdateRole(user, 'customer')}
                                          disabled={actionLoading}
                                          className="px-2.5 py-1 bg-amber-600 hover:bg-amber-755 text-white rounded-full font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all inline-block animate-fadeIn"
                                        >
                                          Demote
                                        </button>
                                      )}
                                      
                                      {(user.role === 'customer' || user.role === 'support') && (
                                        <button
                                          onClick={() => handleDeleteUser(user.email)}
                                          disabled={actionLoading}
                                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all inline-block"
                                        >
                                          Delete
                                        </button>
                                      )}
                                    </div>
                                  );
                                }

                                if (reqRole === 'admin') {
                                  // admin can promote/demote anyone to Support or Manager or Customer or Admin
                                  return (
                                    <div className="flex items-center justify-end space-x-2.5">
                                      {/* Impersonate button */}
                                      <button
                                        onClick={() => onImpersonate?.(user)}
                                        className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-full font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all inline-block"
                                        title="Login as this user"
                                      >
                                        Impersonate
                                      </button>

                                      <select
                                        value={user.role}
                                        disabled={actionLoading}
                                        onChange={(e) => handleUpdateRole(user, e.target.value as any)}
                                        className="px-2 py-1 text-[10px] border border-stone-250 rounded-lg font-bold text-stone-750"
                                      >
                                        <option value="customer">Customer</option>
                                        <option value="support">Support</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                      </select>
                                      
                                      <button
                                        onClick={() => handleDeleteUser(user.email)}
                                        disabled={actionLoading}
                                        className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-full font-bold text-[9px] uppercase tracking-wider cursor-pointer transition-all inline-block"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  );
                                }

                                return null;
                              })()}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: PRODUCTS CRUD CONFIGURATION */}
          {activeTab === 'products' && (
            <div className="space-y-6" id="tab-admin-products">
              <div className="flex justify-between items-center bg-stone-50 p-4 rounded-xl border border-stone-100">
                <div>
                  <h3 className="text-xs font-bold text-stone-900">Products Catalog Registry</h3>
                  <p className="text-[10px] text-stone-400">Quickly add, modify options, or delete nail designs</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setEditingProduct(null);
                    setProductForm({
                      name: '', price: '', category: 'Elegant', description: '',
                      shapes: ['Almond', 'Coffin', 'Square'], lengths: ['Short', 'Medium', 'Long'],
                      productionTime: '3-5 days', isBestSeller: false, isNewArrival: false, images: ['']
                    });
                    setIsProductFormOpen(true);
                  }}
                  className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full font-bold text-xs flex items-center space-x-1 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Insert New Nail Art</span>
                </button>
              </div>

              {/* Product list catalog */}
              {isProductFormOpen ? (
                <form onSubmit={handleProductSubmit} className="border border-pink-100 p-6 rounded-3xl space-y-4 max-w-xl bg-pink-50/5 animate-fadeIn" id="product-crud-form">
                  <h4 className="font-serif font-bold text-stone-900">{editingProduct ? 'Update Product Details' : 'Add New Handcrafted Press-On'}</h4>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold block">Design Name *</label>
                      <input
                        type="text"
                        required
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        placeholder="e.g. Starry Velvet Ribbon"
                        className="w-full px-3 py-2 text-xs border rounded focus:outline-primary"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold block">Retail Base Price ($USD) *</label>
                      <input
                        type="number"
                        required
                        step="0.01"
                        value={productForm.price}
                        onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                        placeholder="25.00"
                        className="w-full px-3 py-2 text-xs border rounded font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold block">Category *</label>
                      <select
                        value={productForm.category}
                        onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                        className="w-full px-3 py-2 text-xs border rounded font-semibold text-stone-700"
                      >
                        {['Classic', 'Luxury', 'Cute', 'Elegant', 'Minimalist'].map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold block">Crafting Time</label>
                      <input
                        type="text"
                        value={productForm.productionTime}
                        onChange={(e) => setProductForm({ ...productForm, productionTime: e.target.value })}
                        placeholder="3-5 days"
                        className="w-full px-3 py-2 text-xs border rounded"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <label className="flex items-center space-x-2 text-xs font-semibold text-stone-750">
                      <input
                        type="checkbox"
                        checked={productForm.isBestSeller}
                        onChange={(e) => setProductForm({ ...productForm, isBestSeller: e.target.checked })}
                      />
                      <span>Promote as Best Seller</span>
                    </label>
                    <label className="flex items-center space-x-2 text-xs font-semibold text-stone-750">
                      <input
                        type="checkbox"
                        checked={productForm.isNewArrival}
                        onChange={(e) => setProductForm({ ...productForm, isNewArrival: e.target.checked })}
                      />
                      <span>Mark Tag as New Arrival</span>
                    </label>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold block">Image Link URL</label>
                    <input
                      type="text"
                      value={productForm.images[0]}
                      onChange={(e) => setProductForm({ ...productForm, images: [e.target.value] })}
                      placeholder="https://picsum.photos/seed/nail_art_name/600/600"
                      className="w-full px-3 py-2 text-xs border rounded font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold block">Description</label>
                    <textarea
                      rows={3}
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Meticulously catalog luxury press-on nail ingredients."
                      className="w-full px-3 py-2 text-xs border rounded focus:outline-primary"
                    />
                  </div>

                  <div className="flex space-x-2 justify-end pt-3">
                    <button
                      type="button"
                      onClick={() => setIsProductFormOpen(false)}
                      className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-full cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={actionLoading}
                      className="px-5 py-2 bg-[#FF5FA2] hover:bg-pink-600 text-white text-xs font-bold rounded-full shadow-sm cursor-pointer"
                    >
                      Save to Catalog
                    </button>
                  </div>
                </form>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {products.map(p => (
                    <div key={p.id} className="border border-stone-200 rounded-xl overflow-hidden shadow-xs hover:shadow-md transition-shadow relative">
                      <div className="h-36 bg-stone-100 relative">
                        <img
                          src={p.images?.[0] || 'https://picsum.photos/seed/nail/600/600'}
                          alt={p.name}
                          className="w-full h-full object-cover"
                        />
                        <span className="absolute top-2 left-2 bg-[#FFD6E7] text-[#FF5FA2] text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full">
                          {p.category}
                        </span>
                      </div>
                      <div className="p-3.5 space-y-1 bg-white">
                        <h4 className="text-xs font-bold text-stone-900 truncate">{p.name}</h4>
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-bold font-mono text-[#D4A373]">${p.price.toFixed(2)}</span>
                          <span className="text-[10px] text-stone-400 font-sans italic">{p.productionTime}</span>
                        </div>
                        <div className="flex space-x-1.5 justify-end pt-3 border-t border-stone-50 mt-2">
                          <button
                            type="button"
                            onClick={() => {
                              setEditingProduct(p);
                              setProductForm({
                                name: p.name,
                                price: p.price.toString(),
                                category: p.category,
                                description: p.description,
                                shapes: p.shapes || ['Almond', 'Coffin'],
                                lengths: p.lengths || ['Short', 'Medium'],
                                productionTime: p.productionTime || '3-5 days',
                                isBestSeller: !!p.isBestSeller,
                                isNewArrival: !!p.isNewArrival,
                                images: p.images || ['']
                              });
                              setIsProductFormOpen(true);
                            }}
                            className="p-1.5 border border-stone-200 hover:border-pink-300 rounded text-stone-600 hover:text-primary transition-colors cursor-pointer"
                            title="Edit Nail design specifications"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          {currentUser?.role !== 'support' && (
                            <button
                              type="button"
                              onClick={() => deleteProduct(p.id)}
                              className="p-1.5 border border-red-200 text-red-500 hover:bg-red-50 rounded cursor-pointer"
                              title="Remove design"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: ADMIN CONFIGS / SETTINGS */}
          {activeTab === 'settings' && (
            <div className="space-y-6" id="tab-admin-settings">
              <h2 className="text-base font-bold text-stone-900 pb-3 border-b border-stone-100 flex items-center space-x-2">
                <Settings className="w-5 h-5 text-primary" />
                <span>Nail Salon Workspace Settings</span>
              </h2>

              <form onSubmit={handleSettingsSubmit} className="space-y-5 max-w-2xl" id="store-settings-form">
                
                {/* 1. Core fees */}
                <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200/50 space-y-3">
                  <h3 className="text-xs font-bold text-stone-900 uppercase">1. Financials & Delivery Parameters</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold block text-stone-700">Cambodia Courier Shipment Flat Rate ($USD)</label>
                      <input
                        type="number"
                        step="0.01"
                        value={settingsForm.deliveryFee}
                        onChange={(e) => setSettingsForm({ ...settingsForm, deliveryFee: parseFloat(e.target.value) })}
                        className="w-full text-xs font-mono font-semibold px-3 py-2 border rounded"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold block text-stone-700">Delivery Payment Mode</label>
                      <select
                        value={settingsForm.deliveryPayMode}
                        onChange={(e) => setSettingsForm({ ...settingsForm, deliveryPayMode: e.target.value })}
                        className="w-full text-xs px-3 py-2 border rounded bg-white"
                      >
                        <option value="INCLUDE">Include Delivery Fee in Checkout (Pre-paid upfront)</option>
                        <option value="EXCLUDE">Exclude Delivery Fee (Customer pays courier on arrival)</option>
                        <option value="FLEXIBLE">Flexible Option (Customer decides at checkout)</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* 2. Telegram Bot credentials */}
                <div className="p-4 bg-stone-50/50 rounded-2xl border border-stone-200/50 space-y-3">
                  <h3 className="text-xs font-bold text-[#FF5FA2] uppercase">2. Outbound Telegram Notification Bot Api</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold block text-stone-700">Telegram Bot API Token</label>
                      <input
                        type="text"
                        value={settingsForm.telegramBotToken}
                        onChange={(e) => setSettingsForm({ ...settingsForm, telegramBotToken: e.target.value })}
                        placeholder="e.g. 12345678:AAH-uN29482..."
                        className="w-full text-[11px] font-mono px-3 py-2 border rounded"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold block text-stone-700">Administrative Group ID or Channel Chat ID</label>
                      <input
                        type="text"
                        value={settingsForm.telegramChannelId}
                        onChange={(e) => setSettingsForm({ ...settingsForm, telegramChannelId: e.target.value })}
                        placeholder="e.g. -10019284729"
                        className="w-full text-[11px] font-mono px-3 py-2 border rounded"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-stone-400 italic">
                    {"* If left blank, the application executes beautifully in Simulated Preview mode, writing prepared telegram notification payloads to the \"Telegram Logs\" dashboard tab."}
                  </p>
                </div>

                {/* 3. QR code profiles */}
                <div className="p-4 bg-amber-50/10 rounded-2xl border border-amber-200/40 space-y-4">
                  <h3 className="text-xs font-bold text-stone-900 uppercase">3. Banking Payments Information Profiles</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    
                    {/* ABA CARD */}
                    <div className="p-3 bg-white rounded-xl border space-y-2">
                      <span className="text-[10px] font-bold text-blue-700">ABA Pay QR Details</span>
                      <input
                        type="text"
                        placeholder="Payee Account Holder Name"
                        value={settingsForm.abaHolder}
                        onChange={(e) => setSettingsForm({ ...settingsForm, abaHolder: e.target.value })}
                        className="w-full text-[10px] px-2 py-1.5 border rounded"
                      />
                      <input
                        type="text"
                        placeholder="ABA Number (000 123 456)"
                        value={settingsForm.abaNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, abaNumber: e.target.value })}
                        className="w-full text-[10px] px-2 py-1.5 border rounded"
                      />
                      <input
                        type="text"
                        placeholder="Merchant QR deep-link"
                        value={settingsForm.abaQrText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, abaQrText: e.target.value })}
                        className="w-full text-[9px] font-mono px-2 py-1 border rounded"
                      />
                    </div>

                    {/* ACLEDA CARD */}
                    <div className="p-3 bg-white rounded-xl border space-y-2">
                      <span className="text-[10px] font-bold text-emerald-700">ACLEDA QR Details</span>
                      <input
                        type="text"
                        placeholder="Payee Account Holder Name"
                        value={settingsForm.acledaHolder}
                        onChange={(e) => setSettingsForm({ ...settingsForm, acledaHolder: e.target.value })}
                        className="w-full text-[10px] px-2 py-1.5 border rounded"
                      />
                      <input
                        type="text"
                        placeholder="ACLEDA Number"
                        value={settingsForm.acledaNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, acledaNumber: e.target.value })}
                        className="w-full text-[10px] px-2 py-1.5 border rounded"
                      />
                      <input
                        type="text"
                        placeholder="Merchant QR link"
                        value={settingsForm.acledaQrText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, acledaQrText: e.target.value })}
                        className="w-full text-[9px] font-mono px-2 py-1 border rounded"
                      />
                    </div>

                    {/* WING CARD */}
                    <div className="p-3 bg-white rounded-xl border space-y-2">
                      <span className="text-[10px] font-bold text-orange-600">Wing QR Details</span>
                      <input
                        type="text"
                        placeholder="Payee Account Holder Name"
                        value={settingsForm.wingHolder}
                        onChange={(e) => setSettingsForm({ ...settingsForm, wingHolder: e.target.value })}
                        className="w-full text-[10px] px-2 py-1.5 border rounded"
                      />
                      <input
                        type="text"
                        placeholder="Wing Number"
                        value={settingsForm.wingNumber}
                        onChange={(e) => setSettingsForm({ ...settingsForm, wingNumber: e.target.value })}
                        className="w-full text-[10px] px-2 py-1.5 border rounded"
                      />
                      <input
                        type="text"
                        placeholder="Merchant QR link"
                        value={settingsForm.wingQrText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, wingQrText: e.target.value })}
                        className="w-full text-[9px] font-mono px-2 py-1 border rounded"
                      />
                    </div>

                  </div>
                </div>

                {/* 4. Sales Invoice Print Settings */}
                <div className="p-4 bg-blue-50/5 rounded-2xl border border-blue-200/40 space-y-4">
                  <h3 className="text-xs font-bold text-stone-900 uppercase">4. Sales Invoice Print Configurations</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-xs font-semibold block text-stone-700">Invoice Page Width / Print size</label>
                      <select
                        value={settingsForm.invoicePrintWidth}
                        onChange={(e) => setSettingsForm({ ...settingsForm, invoicePrintWidth: e.target.value })}
                        className="w-full text-xs px-3 py-2 border rounded font-semibold text-stone-750"
                      >
                        <option value="80mm">80mm (Standard Thermal Receipt)</option>
                        <option value="58mm">58mm (Mobile Thermal Receipt)</option>
                        <option value="A5">A5 Page (Medium Flyer Size)</option>
                        <option value="A4">A4 Page (Standard Desktop Paper)</option>
                      </select>
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold block text-stone-700">Invoice Header Branding / Top Notes</label>
                      <input
                        type="text"
                        value={settingsForm.invoiceHeaderNote}
                        onChange={(e) => setSettingsForm({ ...settingsForm, invoiceHeaderNote: e.target.value })}
                        placeholder="e.g. Handmade Luxury Press-on Nails"
                        className="w-full text-xs px-3 py-2 border rounded"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold block text-stone-700">Invoice Footer Remarks / Bottom Notes</label>
                    <textarea
                      rows={2}
                      value={settingsForm.invoiceFooterNote}
                      onChange={(e) => setSettingsForm({ ...settingsForm, invoiceFooterNote: e.target.value })}
                      placeholder="e.g. Thanks for your purchase! Connect with us on Telegram for details."
                      className="w-full text-xs px-3 py-2 border rounded"
                    />
                  </div>
                </div>

                {/* 5. Telegram Notification Templates */}
                <div className="p-6 bg-purple-50/5 rounded-3xl border border-purple-200/40 space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-bold text-stone-900 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-purple-600" />
                        <span>5. Telegram Customer Notification Templates</span>
                      </h3>
                      <p className="text-xs text-stone-500 mt-1 font-sans">
                        Customize HTML-formatted notification messages sent to customers on Telegram chat.
                      </p>
                    </div>
                  </div>

                  <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200/50 space-y-2">
                    <p className="text-[11px] font-bold text-stone-700 uppercase tracking-wider font-sans">Available Placeholders</p>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { name: '{orderId}', desc: 'Bespoke order ID' },
                        { name: '{customerName}', desc: "Customer's full name" },
                        { name: '{estimatedTime}', desc: 'Estimated completion duration' },
                        { name: '{remark}', desc: 'Seller status comments/reasons' },
                        { name: '{reasonType}', desc: 'Delay or cancellation category' },
                        { name: '{price}', desc: 'Item or final invoice pricing' },
                        { name: '{appUrl}', desc: 'Website address home portal link' }
                      ].map((item) => (
                        <div key={item.name} className="flex items-center gap-1 bg-white border border-stone-200 px-2 py-1 rounded-lg text-[10px]" title={item.desc}>
                          <code className="font-bold text-purple-700 font-mono">{item.name}</code>
                          <span className="text-stone-300">|</span>
                          <span className="text-stone-500 font-sans">{item.desc}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(['tgOrderAcceptedTemplate', 'tgOrderDelayedTemplate', 'tgOrderRejectedTemplate', 'tgPaymentUploadedTemplate', 'tgPaymentVerifiedTemplate', 'tgPaymentDeclinedTemplate', 'tgOrderCompletedTemplate', 'tgCustomAcceptedTemplate', 'tgCustomRejectedTemplate'] as const).map((key) => {
                      const templateLabels: Record<string, { label: string; phase: 'Order' | 'Payment' | 'Custom'; desc: string }> = {
                        tgOrderAcceptedTemplate: {
                          label: 'Order Accepted (WAITING_PAYMENT)',
                          phase: 'Order',
                          desc: 'Sent when the admin accepts a bespoke order and requests payment.'
                        },
                        tgOrderDelayedTemplate: {
                          label: 'Order Accepted with Delay',
                          phase: 'Order',
                          desc: 'Sent when the order is accepted but requires additional crafting time.'
                        },
                        tgOrderRejectedTemplate: {
                          label: 'Order Rejected',
                          phase: 'Order',
                          desc: 'Sent when a bespoke order request is rejected/declined.'
                        },
                        tgPaymentUploadedTemplate: {
                          label: 'Payment Proof Submitted',
                          phase: 'Payment',
                          desc: 'Sent to acknowledge that the user uploaded their checkout receipt.'
                        },
                        tgPaymentVerifiedTemplate: {
                          label: 'Payment Verified (IN_PRODUCTION)',
                          phase: 'Payment',
                          desc: 'Sent when payment proof is confirmed and production starts.'
                        },
                        tgPaymentDeclinedTemplate: {
                          label: 'Payment Proof Declined',
                          phase: 'Payment',
                          desc: 'Sent when the uploaded transaction statement is rejected.'
                        },
                        tgOrderCompletedTemplate: {
                          label: 'Order Dispatched / Completed',
                          phase: 'Order',
                          desc: 'Sent when the crafting is done and item is shipped/ready.'
                        },
                        tgCustomAcceptedTemplate: {
                          label: 'Custom Request Approved',
                          phase: 'Custom',
                          desc: 'Sent when a custom design suggestion receives a price/timeline quote.'
                        },
                        tgCustomRejectedTemplate: {
                          label: 'Custom Request Rejected',
                          phase: 'Custom',
                          desc: 'Sent when custom design specifications cannot be fulfilled.'
                        }
                      };

                      const meta = templateLabels[key];
                      const isEditing = editingTemplateKey === key;
                      const value = settingsForm[key];

                      return (
                        <div 
                          key={key} 
                          className={`flex flex-col border rounded-3xl p-5 transition-all bg-white relative ${
                            isEditing 
                              ? 'border-[#FF5FA2] ring-1 ring-[#FF5FA2] shadow-md' 
                              : 'border-stone-200/80 hover:border-stone-300 shadow-sm hover:shadow-md'
                          }`}
                        >
                          {/* Header info */}
                          <div className="flex items-start justify-between gap-2 mb-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                                  meta.phase === 'Order' ? 'bg-blue-50 text-blue-600 border border-blue-100' :
                                  meta.phase === 'Payment' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                                  'bg-purple-50 text-purple-700 border border-purple-100'
                                }`}>
                                  {meta.phase}
                                </span>
                              </div>
                              <h4 className="text-xs font-extrabold text-stone-900 leading-snug">{meta.label}</h4>
                              <p className="text-[10px] text-stone-400 font-sans leading-tight">{meta.desc}</p>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {isEditing ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSettingsForm({ ...settingsForm, [key]: originalTemplateValue });
                                      setEditingTemplateKey(null);
                                    }}
                                    className="p-1.5 bg-stone-100 text-stone-600 hover:bg-stone-200 rounded-lg cursor-pointer transition-colors"
                                    title="Revert changes"
                                  >
                                    <Undo className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingTemplateKey(null)}
                                    className="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200 rounded-lg cursor-pointer transition-colors"
                                    title="Apply template code"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPreviewTemplate({ title: meta.label, templateText: value });
                                    }}
                                    className="p-1.5 bg-stone-50 border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg cursor-pointer transition-all animate-fadeIn"
                                    title="Live chat mockup preview"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setOriginalTemplateValue(value);
                                      setEditingTemplateKey(key);
                                    }}
                                    className="p-1.5 bg-stone-900 text-white hover:bg-stone-850 rounded-lg cursor-pointer transition-all animate-fadeIn"
                                    title="Edit template content"
                                  >
                                    <Edit className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>

                          {/* Body block */}
                          <div className="flex-1 flex flex-col mt-2">
                            {isEditing ? (
                              <textarea
                                rows={5}
                                value={value}
                                onChange={(e) => setSettingsForm({ ...settingsForm, [key]: e.target.value })}
                                className="w-full text-xs font-mono p-3 border border-stone-200 rounded-xl focus:outline-primary bg-stone-50/50 flex-1 resize-y"
                                placeholder={`Enter message template for ${meta.label}...`}
                              />
                            ) : (
                              <div className="flex-1 flex flex-col justify-between bg-stone-50 rounded-2xl border border-stone-150 p-3 min-h-[120px]">
                                {/* Code view header */}
                                <div className="flex justify-between items-center mb-2 pb-1.5 border-b border-stone-200/50">
                                  <span className="text-[9px] font-mono font-semibold uppercase text-stone-400 font-sans">Raw HTML Template</span>
                                </div>
                                
                                {/* Code area */}
                                <div className="flex-1 font-mono text-[11px] text-stone-700 whitespace-pre-wrap break-all overflow-y-auto max-h-[140px] leading-normal select-all">
                                  {value || <span className="text-stone-400 italic font-sans">No template configuration. Click edit to write one.</span>}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-6 py-2.5 bg-primary hover:bg-pink-600 font-bold text-xs text-white rounded-full cursor-pointer shadow-md"
                >
                  {actionLoading ? 'Saving...' : 'Save Configuration Parameters'}
                </button>

              </form>
            </div>
          )}

          {/* TAB 6: TELEMETRY SYSTEM LOGGER FOR TELEGRAM BOT MESSAGES */}
          {activeTab === 'logs' && (
            <div className="space-y-6" id="tab-admin-logs">
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <div>
                  <h2 className="text-base font-bold text-stone-900">Telegram Bot Notifications Logging</h2>
                  <p className="text-[10px] text-stone-400">Review prepared/transmitted XML & JSON telegram messaging payloads</p>
                </div>
                <span className="text-xs font-mono font-medium text-emerald-600">PREV. SIMULATION RECEPTOR LIVE</span>
              </div>

              {logs.length === 0 ? (
                <div className="text-center py-20 text-stone-400 text-xs italic border rounded-xl">No bot dispatch parameters saved to local file ledger yet. Try submitting an order!</div>
              ) : (
                <div className="space-y-4">
                  {logs.map(log => (
                    <div key={log.id} className="p-4 border border-stone-150 rounded-xl bg-stone-50/50 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-mono text-stone-400">
                        <span>TIMESTAMP: {new Date(log.createdAt).toLocaleString()}</span>
                        <span className={`px-2 py-0.5 rounded-full font-bold ${
                          log.status === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-red-50 text-red-650'
                        }`}>
                          {log.status === 'SUCCESS' ? 'DISPATCHED/SIMULATED' : 'DELIVERY FAILURE'}
                        </span>
                      </div>
                      
                      <div className="text-xs space-y-1">
                        <div><b>Recipient Type:</b> <span className="font-bold text-stone-800">{log.recipient}</span></div>
                        {log.error && (
                          <div className="text-red-500 bg-red-50 p-2 rounded text-[10px] font-mono"><b>API Output:</b> {log.error}</div>
                        )}
                        
                        <div className="bg-stone-900 text-pink-100/90 p-3.5 rounded-lg text-[11px] font-mono font-medium leading-relaxed overflow-x-auto select-all whitespace-pre-wrap">
                          {log.content.replace(/<[^>]+>/g, '') /* sanitize tags briefly on display text */}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      )}

      {/* SALES INVOICE PRINT PREVIEW MODAL */}
      {previewInvoiceOrder && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn" id="print-preview-modal">
          <div className="bg-stone-100 rounded-3xl p-6 max-w-2xl w-full border border-stone-200 shadow-2xl space-y-6 relative my-8">
            <button
              onClick={() => setPreviewInvoiceOrder(null)}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors cursor-pointer"
            >
              <XCircle className="w-6 h-6" />
            </button>

            <div className="space-y-1 pr-8">
              <span className="text-[10px] font-mono tracking-wider text-stone-400">SALES INVOICE WORKSPACE</span>
              <h3 className="font-serif text-xl font-bold text-stone-900">Print Preview - Order #{previewInvoiceOrder.id.slice(0, 8)}</h3>
              <p className="text-xs text-stone-500">
                Configure width style or check settings under Print Configurations. Current Format Width: <span className="font-bold text-purple-700">{settings?.invoicePrintWidth || '80mm'}</span>
              </p>
            </div>

            {/* Simulated Paper Receipt Container */}
            <div className="flex justify-center bg-stone-250 p-6 rounded-2xl border border-stone-200 overflow-x-auto max-h-[60vh] overflow-y-auto">
              <div 
                className="bg-white p-6 shadow-md border border-stone-300 font-mono text-black text-left leading-tight"
                style={{
                  width: settings?.invoicePrintWidth === '58mm' ? '280px' :
                         settings?.invoicePrintWidth === '80mm' ? '360px' :
                         settings?.invoicePrintWidth === 'A5' ? '480px' : '100%',
                  maxWidth: '100%',
                  fontSize: '12px',
                  fontFamily: "'Courier New', Courier, monospace"
                }}
              >
                {/* Header */}
                <div className="text-center mb-4 pb-2 border-b-2 border-dashed border-stone-900">
                  <h2 className="text-lg font-bold font-sans tracking-wide m-0 mb-1">BEAUTY THINGS</h2>
                  <div className="text-[10px] whitespace-pre-line text-stone-700">
                    {settings?.invoiceHeaderNote || 'Premium Handmade Press-on Nails\nPhnom Penh, Cambodia'}
                  </div>
                  <div className="text-xs font-bold mt-2 tracking-widest text-center">SALES INVOICE</div>
                </div>

                {/* Info Table */}
                <div className="text-[11px] space-y-1 mb-4">
                  <div className="flex justify-between">
                    <span><b>Invoice No:</b> {previewInvoiceOrder.id}</span>
                    <span><b>Date:</b> {new Date(previewInvoiceOrder.createdAt).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span><b>Customer:</b> {previewInvoiceOrder.customerName}</span>
                    <span><b>Phone:</b> {previewInvoiceOrder.phone}</span>
                  </div>
                  <div>
                    <span><b>Address:</b> {previewInvoiceOrder.deliveryAddress}</span>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full border-collapse text-[11px] mb-4">
                  <thead>
                    <tr className="border-b border-stone-900 font-bold">
                      <th className="text-left pb-1">Item</th>
                      <th className="text-center pb-1 w-10">Qty</th>
                      <th className="text-right pb-1 w-16">Price</th>
                      <th className="text-right pb-1 w-16">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {previewInvoiceOrder.items.map((item: any, idx: number) => (
                      <tr key={idx} className="border-b border-dashed border-stone-200">
                        <td className="py-1.5 text-left">
                          <strong>{item.name}</strong>
                          <br />
                          <span className="text-[9px] text-stone-600">
                            Shape: {item.shape} / Len: {item.length}
                          </span>
                        </td>
                        <td className="py-1.5 text-center">{item.quantity}</td>
                        <td className="py-1.5 text-right font-mono">${item.price.toFixed(2)}</td>
                        <td className="py-1.5 text-right font-mono">${(item.price * item.quantity).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals Table */}
                <table className="w-full text-[11px] mt-2 border-t border-dashed border-stone-900 pt-2">
                  <tbody>
                    <tr>
                      <td className="py-0.5">Subtotal:</td>
                      <td className="text-right font-mono">
                        ${(previewInvoiceOrder.subtotal !== undefined ? previewInvoiceOrder.subtotal : (previewInvoiceOrder.totalPrice - previewInvoiceOrder.deliveryFee)).toFixed(2)}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-0.5">Delivery Fee ({previewInvoiceOrder.deliveryOption}):</td>
                      <td className="text-right font-mono">
                        ${previewInvoiceOrder.deliveryFee.toFixed(2)}
                        {previewInvoiceOrder.deliveryOption === 'DELIVERY' ? (
                          previewInvoiceOrder.deliveryPayOption === 'EXCLUDE' ? ' (Pay on Arrival)' : ' (Pre-paid)'
                        ) : ''}
                      </td>
                    </tr>
                    <tr className="font-bold border-t border-stone-900 text-xs">
                      <td className="pt-1.5">GRAND TOTAL:</td>
                      <td className="text-right font-mono pt-1.5">
                        ${previewInvoiceOrder.totalPrice.toFixed(2)}
                      </td>
                    </tr>
                  </tbody>
                </table>

                {/* Footer */}
                <div className="text-center mt-4 pt-2 border-t border-dashed border-stone-900 text-[10px] space-y-1">
                  <p className="m-0">Status: <strong>{previewInvoiceOrder.status}</strong></p>
                  <p className="m-0 whitespace-pre-line text-stone-700">
                    {settings?.invoiceFooterNote || 'Thank you for choosing Beauty Things! Please follow us on Telegram @beautythings_cambodia.'}
                  </p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setPreviewInvoiceOrder(null)}
                className="px-4 py-2 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold rounded-xl text-xs cursor-pointer transition-colors"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={() => {
                  handlePrintInvoice(previewInvoiceOrder);
                  setPreviewInvoiceOrder(null);
                }}
                className="px-5 py-2 bg-[#FF5FA2] hover:bg-pink-600 text-white font-bold rounded-xl text-xs cursor-pointer shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 uppercase tracking-wider"
              >
                <Printer className="w-4 h-4" />
                Print Now
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* TELEGRAM TEMPLATE LIVE PREVIEW MODAL */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn" id="tg-preview-modal">
          {/* Custom style overrides for HTML tags inside the Telegram bubble preview */}
          <style>{`
            .tg-message-content b, .tg-message-content strong {
              font-weight: 800;
              color: #111111;
            }
            .tg-message-content i, .tg-message-content em {
              font-style: italic;
            }
            .tg-message-content code {
              font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
              background-color: rgba(220, 38, 38, 0.08);
              color: #dc2626;
              padding: 1.5px 3.5px;
              border-radius: 4px;
              font-size: 85%;
              font-weight: 600;
            }
            .tg-message-content pre {
              font-family: Menlo, Monaco, Consolas, "Courier New", monospace;
              background-color: rgba(0, 0, 0, 0.05);
              padding: 6px 10px;
              border-radius: 6px;
              font-size: 85%;
              overflow-x: auto;
              white-space: pre-wrap;
              word-break: break-all;
              margin: 4px 0;
            }
            .tg-message-content a {
              color: #2481cc;
              text-decoration: underline;
              font-weight: 600;
            }
          `}</style>

          <div className="bg-stone-900 border border-stone-850 rounded-[36px] p-4 max-w-sm w-full shadow-2xl space-y-4 relative">
            {/* Modal close header button */}
            <button
              onClick={() => setPreviewTemplate(null)}
              className="absolute -top-3 -right-3 bg-stone-900 text-stone-400 hover:text-white border border-stone-800 p-1.5 rounded-full shadow-md transition-all cursor-pointer z-50"
              title="Close Preview Screen"
            >
              <XCircle className="w-6 h-6" />
            </button>

            {/* Smartphone frame container */}
            <div className="bg-[#e7ebf0] rounded-[28px] overflow-hidden border-4 border-stone-950 shadow-inner flex flex-col relative aspect-[9/16] max-h-[620px] min-h-[500px]">
              
              {/* Telegram App Header Bar */}
              <div className="bg-[#517da2] px-4 py-3 flex items-center justify-between shrink-0 shadow-sm">
                <div className="flex items-center space-x-2.5">
                  {/* Back button icon arrow left */}
                  <button 
                    onClick={() => setPreviewTemplate(null)}
                    className="text-white hover:opacity-80 transition-opacity focus:outline-none cursor-pointer"
                  >
                    <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                      <path d="M20,11V13H8L13.5,18.5L12.08,19.92L4.16,12L12.08,4.08L13.5,5.5L8,11H20Z" />
                    </svg>
                  </button>
                  
                  {/* Circle Bot avatar */}
                  <div className="w-8 h-8 rounded-full bg-[#ff70a6] flex items-center justify-center font-bold text-white text-[11px] shadow-[0_2px_5px_rgba(0,0,0,0.1)] uppercase border border-[#ff85b3]/50">
                    BT
                  </div>

                  {/* Title and online status */}
                  <div className="flex flex-col">
                    <span className="font-extrabold text-white text-xs tracking-wide">Beauty Things Bot</span>
                    <span className="text-[10px] text-sky-100 font-medium">bot</span>
                  </div>
                </div>

                {/* Right menu action */}
                <div className="text-white opacity-90 cursor-pointer">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12,16A2,2 0 0,1 14,18A2,2 0 0,1 12,20A2,2 0 0,1 10,18A2,2 0 0,1 12,16M12,10A2,2 0 0,1 14,12A2,2 0 0,1 12,14A2,2 0 0,1 10,12A2,2 0 0,1 12,10M12,4A2,2 0 0,1 14,6A2,2 0 0,1 12,8A2,2 0 0,1 10,6A2,2 0 0,1 12,4Z" />
                  </svg>
                </div>
              </div>

              {/* Chat history list */}
              <div className="flex-1 overflow-y-auto p-4 flex flex-col space-y-4 font-sans relative">
                
                {/* Simulated timestamp header in bubble list */}
                <div className="self-center">
                  <span className="bg-stone-400/40 backdrop-blur-xs text-[9px] font-extrabold text-stone-900/90 px-3 py-1 rounded-full uppercase tracking-wider">
                    Today
                  </span>
                </div>

                {/* Telegram Bot incoming chat bubble */}
                <div className="flex items-start space-x-1.5 max-w-[85%] self-start animate-slideUp">
                  
                  {/* Bot mini rounded avatar */}
                  <div className="w-6 h-6 rounded-full bg-[#ff70a6] flex items-center justify-center font-bold text-white text-[8px] uppercase select-none shrink-0 mt-0.5">
                    BT
                  </div>

                  {/* Message Bubble container */}
                  <div className="bg-white text-stone-900 rounded-2xl rounded-tl-none p-3 shadow-md border border-stone-200/40 relative flex flex-col">
                    
                    {/* Render raw template tags parsed dynamically */}
                    <div 
                      className="tg-message-content text-[11px] leading-relaxed text-stone-850 break-words whitespace-pre-wrap select-text"
                      dangerouslySetInnerHTML={formatTelegramHtmlPreview(previewTemplate.templateText)}
                    />

                    {/* Chat bubble tail-accent & time */}
                    <div className="flex items-center justify-end space-x-1 mt-1 text-[8px] font-medium text-stone-400 self-end">
                      <span>10:42 AM</span>
                    </div>

                  </div>
                </div>

              </div>

              {/* Telegram bottom chat keyboard dock mockup */}
              <div className="bg-white px-3.5 py-2.5 flex items-center justify-between border-t border-stone-200 shrink-0">
                <div className="flex items-center space-x-2.5 flex-1 bg-stone-50 border border-stone-200 rounded-2xl px-3 py-1.5">
                  {/* Smiley emoji icon button placeholder */}
                  <svg className="w-4 h-4 fill-current text-stone-400 shrink-0 cursor-pointer" viewBox="0 0 24 24">
                    <path d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2H2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20M7,9.5A1.5,1.5 0 0,0 8.5,11A1.5,1.5 0 0,0 10,9.5A1.5,1.5 0 0,0 8.5,8A1.5,1.5 0 0,0 7,9.5M14,9.5A1.5,1.5 0 0,0 15.5,11A1.5,1.5 0 0,0 17,9.5A1.5,1.5 0 0,0 15.5,8A1.5,1.5 0 0,0 14,9.5M12,18C14.75,18 17.13,16.32 18.2,14H5.8C6.87,16.32 9.25,18 12,18Z" />
                  </svg>

                  {/* Text input label */}
                  <span className="text-[11px] text-stone-400 flex-1 font-sans">Message</span>

                  {/* Paperclip attachment placeholder */}
                  <svg className="w-4 h-4 fill-current text-stone-400 shrink-0 cursor-pointer" viewBox="0 0 24 24">
                    <path d="M16.5,6V17.5A4,4 0 0,1 12.5,21.5A4,4 0 0,1 8.5,17.5V5A2.5,2.5 0 0,1 11,2.5A2.5,2.5 0 0,1 13.5,5V15.5A1,1 0 0,1 12.5,16.5A1,1 0 0,1 11.5,15.5V6H10V15.5A2.5,2.5 0 0,0 12.5,18A2.5,2.5 0 0,0 15,15.5V5A4,4 0 0,0 11,1A4,4 0 0,0 7,5V17.5A5.5,5.5 0 0,0 12.5,23A5.5,5.5 0 0,0 18,17.5V6H16.5Z" />
                  </svg>
                </div>

                {/* Right microphone voice note mock button */}
                <div className="ml-2.5 text-[#517da2] cursor-pointer">
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M12,2A3,3 0 0,1 15,5V11A3,3 0 0,1 12,14A3,3 0 0,1 9,11V5A3,3 0 0,1 12,2M19,11C19,14.53 16.39,17.44 13,17.93V21H11V17.93C7.61,17.44 5,14.53 5,11H7A5,5 0 0,0 12,16A5,5 0 0,0 17,11H19Z" />
                  </svg>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* FOOTER NOTIFY */}
      <div className="text-center text-[10px] text-stone-400 py-3 font-mono">
        Beauty Things Handmade Studio Admin Panel Security Workspace | Dual Auth Bypass
      </div>

    </div>
  );
}
