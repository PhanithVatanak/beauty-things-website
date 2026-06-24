'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, Heart, Sparkles, Activity, Settings, Search, Filter, 
  ChevronRight, Plus, Minus, Trash2, ClipboardCheck, ArrowLeft, 
  Languages, Star, Image, Share2, Phone, MapPin, CheckCircle, X, ShieldAlert,
  Printer, FileText, User
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Subcomponents
import NavHeader from '@/components/NavHeader';
import CustomRequestForm from '@/components/CustomRequestForm';
import OrderTracking from '@/components/OrderTracking';
import AdminPanel from '@/components/AdminPanel';

// Translations
import { Language, TRANSLATIONS } from '@/lib/translations';

// Initial types (matching our schema)
export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  shape: string;
  length: string;
  sizeNotes?: string;
}

export default function HomeView() {
  const [currentView, setCurrentView] = useState<string>('home');
  const [previewInvoiceOrder, setPreviewInvoiceOrder] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('beauty_things_user');
      return saved ? JSON.parse(saved) : null;
    }
    return null;
  });

  const [isCompleteProfileOpen, setIsCompleteProfileOpen] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState<any>(null);

  // Auth Modal States
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  const [authEmailOrUser, setAuthEmailOrUser] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authFirstName, setAuthFirstName] = useState('');
  const [authLastName, setAuthLastName] = useState('');
  const [authPhone, setAuthPhone] = useState('');
  const [authGender, setAuthGender] = useState('Female');
  const [authTelegram, setAuthTelegram] = useState('');
  const [authError, setAuthError] = useState('');
  const [submittingAuth, setSubmittingAuth] = useState(false);
  const [deliveryPayPreference, setDeliveryPayPreference] = useState<'INCLUDE' | 'EXCLUDE'>('INCLUDE');

  // Complete profile state
  const [profileFirstName, setProfileFirstName] = useState('');
  const [profileLastName, setProfileLastName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileGender, setProfileGender] = useState('Female');
  const [profileRole, setProfileRole] = useState<'customer' | 'admin'>('customer');
  const [profileTelegram, setProfileTelegram] = useState('');
  const [profileAvatar, setProfileAvatar] = useState('');
  const [submittingProfile, setSubmittingProfile] = useState(false);

  const getInitials = (firstName: string, lastName: string) => {
    const f = firstName ? firstName.trim().charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.trim().charAt(0).toUpperCase() : '';
    return f + l || 'U';
  };

  const renderAvatar = (user: any, sizeClass = "w-16 h-16 sm:w-20 sm:h-20", textClass = "text-lg sm:text-2xl") => {
    if (user.avatar && !user.avatar.includes('api.dicebear.com')) {
      return (
        <img
          src={user.avatar}
          alt={user.firstName}
          className={`${sizeClass} rounded-full object-cover border-2 border-[#FF5FA2] shadow-sm bg-white`}
        />
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-[#FF5FA2] text-white flex items-center justify-center font-bold font-serif ${textClass} border-2 border-[#FF5FA2] shadow-sm uppercase select-none`}>
        {getInitials(user.firstName, user.lastName)}
      </div>
    );
  };

  // User profile dashboard orders lists
  const [userOrders, setUserOrders] = useState<any[]>([]);
  const [loadingUserOrders, setLoadingUserOrders] = useState(false);
  const [profileTab, setProfileTab] = useState<'settings' | 'orders' | 'invoices' | 'favorites' | 'cart'>('orders');
  const [notifications, setNotifications] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('beauty_things_user');
      const email = savedUser ? JSON.parse(savedUser)?.email : 'guest';
      const saved = localStorage.getItem(`beauty_things_notifications_${email}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('beauty_things_lang');
      return (saved as Language) || 'km';
    }
    return 'km';
  });
  
  // Catalog products
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Cart & Wishlist persistence
  const [cart, setCart] = useState<OrderItem[]>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('beauty_things_user');
      const email = savedUser ? JSON.parse(savedUser)?.email : 'guest';
      const saved = localStorage.getItem(`beauty_things_cart_${email}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [wishlist, setWishlist] = useState<any[]>(() => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('beauty_things_user');
      const email = savedUser ? JSON.parse(savedUser)?.email : 'guest';
      const saved = localStorage.getItem(`beauty_things_wishlist_${email}`);
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  
  // Search & Catalog filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedShape, setSelectedShape] = useState('All');
  const [selectedLength, setSelectedLength] = useState('All');
  const [priceRange, setPriceRange] = useState<number>(40);

  // checkout form parameters
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [telegramUsername, setTelegramUsername] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryOption, setDeliveryOption] = useState<'SELF_PICKUP' | 'DELIVERY'>('DELIVERY');
  const [submittingCheckout, setSubmittingCheckout] = useState(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);

  // Custom Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  // Settings
  const [deliveryFee, setDeliveryFee] = useState<number>(2.00);

  // Double Click / Zoom visualizer
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Dynamic reviews
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [newReviewComment, setNewReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  const t = TRANSLATIONS[language];

  const fetchProducts = async () => {
    setTimeout(() => {
      setLoadingProducts(true);
    }, 0);
    try {
      const res = await fetch('/api/products');
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    } catch (e) {
      console.error("Failed to fetch product catalog", e);
    } finally {
      setTimeout(() => {
        setLoadingProducts(false);
      }, 0);
    }
  };

  const [storeSettings, setStoreSettings] = useState<any>(null);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const d = await res.json();
        setStoreSettings(d);
        if (d && typeof d.deliveryFee === 'number') {
          setDeliveryFee(d.deliveryFee);
        }
      }
    } catch(e){}
  };

  const handlePrintInvoice = (order: any) => {
    const width = storeSettings?.invoicePrintWidth || '80mm';
    const header = storeSettings?.invoiceHeaderNote || 'Premium Handmade Press-on Nails\nPhnom Penh, Cambodia';
    const footer = storeSettings?.invoiceFooterNote || 'Thank you for choosing Beauty Things! Please follow us on Telegram @beautythings_cambodia.';

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
                <td class="text-right font-mono">
                  $${order.deliveryFee.toFixed(2)}
                  ${order.deliveryOption === 'DELIVERY' ? (
                    order.deliveryPayOption === 'EXCLUDE' ? ' (Pay on Arrival)' : ' (Pre-paid)'
                  ) : ''}
                </td>
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

  // Sync view state with browser URL hash for back/forward navigation support
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      const validViews = ['home', 'shop', 'detail', 'wishlist', 'cart', 'custom', 'tracking', 'admin', 'profile', 'orders'];
      if (hash && validViews.includes(hash)) {
        setCurrentView(hash);
        setOrderSuccessId(null); // clears order successful prompt state
      } else {
        if (!window.location.hash) {
          setCurrentView('home');
        }
      }
    };

    if (typeof window !== 'undefined') {
      if (window.location.hash) {
        handleHashChange();
      } else {
        window.location.hash = 'home';
      }
      window.addEventListener('hashchange', handleHashChange);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('hashchange', handleHashChange);
      }
    };
  }, []);

  // When currentView changes, update the URL hash if it is different
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const currentHash = window.location.hash.replace('#', '');
      if (currentHash !== currentView) {
        window.location.hash = currentView;
      }
    }
  }, [currentView]);

  // Load products & settings on mount
  useEffect(() => {
    const handle = setTimeout(() => {
      fetchProducts();
      fetchSettings();
    }, 0);
    return () => clearTimeout(handle);
  }, []);

  // Listen for Google Auth callback messages
  useEffect(() => {
    const handleMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'GOOGLE_SIGNIN_SUCCESS') {
        const { email, name, avatar } = event.data.user;
        setIsAuthModalOpen(false);
        
        try {
          const res = await fetch(`/api/users/${encodeURIComponent(email)}`);
          if (res.ok) {
            const userProfile = await res.json();
            setCurrentUser(userProfile);
            localStorage.setItem('beauty_things_user', JSON.stringify(userProfile));
            showToast(`Welcome back, ${userProfile.firstName}!`, 'success');
          } else if (res.status === 404) {
            // Split name
            const nameParts = name.split(' ');
            const firstName = nameParts[0] || '';
            const lastName = nameParts.slice(1).join(' ') || '';
            
            setProfileFirstName(firstName);
            setProfileLastName(lastName);
            setProfilePhone('');
            setProfileGender('Female');
            setProfileRole('customer');
            setPendingGoogleUser({ email, name, avatar });
            setIsCompleteProfileOpen(true);
          } else {
            showToast('Failed to check user details.', 'error');
          }
        } catch (err) {
          showToast('Database connection error during auth.', 'error');
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Sync profile details if currentUser changes (e.g. for editing profile form fields)
  useEffect(() => {
    if (currentUser) {
      setProfileFirstName(currentUser.firstName || '');
      setProfileLastName(currentUser.lastName || '');
      setProfilePhone(currentUser.phone || '');
      setProfileGender(currentUser.gender || 'Female');
      setProfileRole(currentUser.role || 'customer');
      setProfileTelegram(currentUser.telegramUsername || '');
      setProfileAvatar(currentUser.avatar || '');
      
      // Auto-populate checkout contact details
      setCustomerName(`${currentUser.firstName} ${currentUser.lastName}`);
      setPhone(currentUser.phone || '');
      setTelegramUsername(currentUser.telegramUsername || '');
    } else {
      setCustomerName('');
      setPhone('');
      setTelegramUsername('');
      setProfileTelegram('');
      setProfileAvatar('');
    }
  }, [currentUser]);

  const fetchUserOrders = async () => {
    if (!currentUser || !currentUser.phone) return;
    setLoadingUserOrders(true);
    try {
      const name = `${currentUser.firstName} ${currentUser.lastName}`;
      const url = `/api/orders?phone=${encodeURIComponent(currentUser.phone)}&customerName=${encodeURIComponent(name)}`;
      const res = await fetch(url);
      if (res.ok) {
        const filtered = await res.json();
        
        // --- NOTIFICATION DETECTION SYSTEM ---
        if (typeof window !== 'undefined' && filtered.length > 0) {
          const email = currentUser?.email || 'guest';
          const statusCacheKey = `beauty_things_order_statuses_${email}`;
          
          const savedStatusesStr = localStorage.getItem(statusCacheKey);
          const previousStatuses = savedStatusesStr ? JSON.parse(savedStatusesStr) : {};
          
          let newNotifs: any[] = [];
          let statusMapChanged = false;
          const currentStatuses: Record<string, string> = {};

          filtered.forEach((ord: any) => {
            currentStatuses[ord.id] = ord.status;
            
            const prevStatus = previousStatuses[ord.id];
            if (prevStatus && prevStatus !== ord.status) {
              const statusTexts: Record<string, string> = {
                PENDING_REVIEW: language === 'km' ? 'រង់ចាំការពិនិត្យ' : 'Awaiting Approval',
                ACCEPTED: language === 'km' ? 'បានយល់ព្រម' : 'Approved',
                ACCEPTED_WITH_DELAY: language === 'km' ? 'យល់ព្រម (មានការពន្យារពេល)' : 'Approved with schedule delay',
                REJECTED: language === 'km' ? 'បានបដិសេធ' : 'Declined',
                WAITING_PAYMENT: language === 'km' ? 'រង់ចាំការបង់ប្រាក់' : 'Awaiting Payment',
                PAYMENT_UPLOADED: language === 'km' ? 'បានផ្ញើភស្តុតាងបង់ប្រាក់' : 'Payment Proof Submitted',
                PAYMENT_VERIFIED: language === 'km' ? 'ការបង់ប្រាក់ត្រូវបានផ្ទៀងផ្ទាត់' : 'Payment Verified',
                IN_PRODUCTION: language === 'km' ? 'កំពុងផលិតដោយដៃ 💅' : 'In Production',
                COMPLETED: language === 'km' ? 'រួចរាល់ និងបានដឹកជញ្ជូន 🎉' : 'Completed & Dispatched',
                CANCELLED: language === 'km' ? 'បានលុបចោល' : 'Cancelled',
                PICKED: language === 'km' ? 'បានទទួលរួចរាល់ (Picked Up) ✅' : 'Collected / Received'
              };

              const newText = statusTexts[ord.status] || ord.status;
              const msg = language === 'km' 
                ? `ការបញ្ជាទិញ #${ord.id.slice(0, 8)} ត្រូវបានប្តូរទៅ៖ ${newText}`
                : `Order #${ord.id.slice(0, 8)} status updated to: ${newText}`;
              
              newNotifs.push({
                id: 'notif-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
                orderId: ord.id,
                message: msg,
                read: false,
                createdAt: new Date().toISOString()
              });
              statusMapChanged = true;
            } else if (!prevStatus) {
              statusMapChanged = true;
            }
          });

          localStorage.setItem(statusCacheKey, JSON.stringify(currentStatuses));

          if (newNotifs.length > 0) {
            setNotifications((prev) => {
              const merged = [...newNotifs, ...prev];
              return merged.slice(0, 50);
            });
            showToast(
              language === 'km' ? 'អ្នកមានការជូនដំណឹងថ្មី!' : 'You have new order notifications!',
              'info'
            );
          } else if (statusMapChanged) {
            localStorage.setItem(statusCacheKey, JSON.stringify(currentStatuses));
          }
        }
        // -------------------------------------

        setUserOrders(filtered);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingUserOrders(false);
    }
  };

  const handleMarkNotificationRead = (notifId: string) => {
    setNotifications((prev) => 
      prev.map(n => n.id === notifId ? { ...n, read: true } : n)
    );
  };

  const handleMarkPickedUp = async (orderId: string) => {
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'picked'
        })
      });
      if (res.ok) {
        fetchUserOrders();
        showToast(language === 'km' ? 'អរគុណ! ការកុម្ម៉ង់ត្រូវបានទទួលរួចរាល់។' : 'Thank you! Order marked as Received.', 'success');
      }
    } catch (e) {
      showToast('Failed to update status.', 'error');
    }
  };

  useEffect(() => {
    if ((currentView === 'profile' || currentView === 'orders') && currentUser) {
      fetchUserOrders();
    }
  }, [currentView, currentUser]);

  const handleGoogleSignIn = () => {
    const width = 500;
    const height = 600;
    const left = typeof window !== 'undefined' ? window.screenX + (window.outerWidth - width) / 2 : 0;
    const top = typeof window !== 'undefined' ? window.screenY + (window.outerHeight - height) / 2 : 0;
    window.open(
      '/google-signin',
      'google_signin',
      `width=${width},height=${height},left=${left},top=${top}`
    );
  };

  const handleSignOut = () => {
    setCurrentUser(null);
    setUserOrders([]); // Clear orders on sign out so they don't leak/linger on screen
    setNotifications([]); // Clear notifications state on logout
    if (typeof window !== 'undefined') {
      localStorage.removeItem('beauty_things_user');
      sessionStorage.removeItem('beauty_things_admin_auth');
    }
    showToast('Signed out successfully.', 'info');
    setCurrentView('home');
  };

  const handleAuthSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmailOrUser || !authPassword) return;
    setSubmittingAuth(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailOrUsername: authEmailOrUser,
          password: authPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
        localStorage.setItem('beauty_things_user', JSON.stringify(data));
        setIsAuthModalOpen(false);
        setAuthPassword('');
        setAuthEmailOrUser('');
        showToast(`Welcome back, ${data.firstName}!`, 'success');
      } else {
        setAuthError(data.error || 'Authentication failed');
      }
    } catch (err) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleAuthSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmailOrUser || !authFirstName || !authLastName || !authPhone || !authPassword) {
      setAuthError('Please fill in all required fields');
      return;
    }
    setSubmittingAuth(true);
    setAuthError('');
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: authEmailOrUser,
          firstName: authFirstName,
          lastName: authLastName,
          phone: authPhone,
          gender: authGender,
          role: 'customer',
          telegramUsername: authTelegram,
          password: authPassword
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data);
        localStorage.setItem('beauty_things_user', JSON.stringify(data));
        setIsAuthModalOpen(false);
        // Reset inputs
        setAuthEmailOrUser('');
        setAuthPassword('');
        setAuthFirstName('');
        setAuthLastName('');
        setAuthPhone('');
        setAuthGender('Female');
        setAuthTelegram('');
        showToast(`Account created! Welcome, ${data.firstName}!`, 'success');
      } else {
        setAuthError(data.error || 'Registration failed');
      }
    } catch (err) {
      setAuthError('Connection error. Please try again.');
    } finally {
      setSubmittingAuth(false);
    }
  };

  const handleCompleteProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingGoogleUser || !profileFirstName || !profileLastName || !profilePhone) return;
    setSubmittingProfile(true);

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: pendingGoogleUser.email,
          firstName: profileFirstName,
          lastName: profileLastName,
          phone: profilePhone,
          gender: profileGender,
          role: profileRole,
          avatar: pendingGoogleUser.avatar
        })
      });

      if (res.ok) {
        const newUserProfile = await res.json();
        setCurrentUser(newUserProfile);
        localStorage.setItem('beauty_things_user', JSON.stringify(newUserProfile));
        setIsCompleteProfileOpen(false);
        setPendingGoogleUser(null);
        showToast(`Registration complete! Welcome ${newUserProfile.firstName}!`, 'success');
      } else {
        const errData = await res.json();
        showToast(errData.error || 'Failed to complete profile registration.', 'error');
      }
    } catch (err) {
      showToast('Network error while completing registration.', 'error');
    } finally {
      setSubmittingProfile(false);
    }
  };

  // Load User-specific Cart and Wishlist when currentUser changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = currentUser?.email || 'guest';
      const userCartKey = `beauty_things_cart_${email}`;
      const savedCart = localStorage.getItem(userCartKey);
      setCart(savedCart ? JSON.parse(savedCart) : []);

      const userWishlistKey = `beauty_things_wishlist_${email}`;
      const savedWishlist = localStorage.getItem(userWishlistKey);
      setWishlist(savedWishlist ? JSON.parse(savedWishlist) : []);
    }
  }, [currentUser]);

  // Save Cart & Wishlist to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = currentUser?.email || 'guest';
      localStorage.setItem(`beauty_things_cart_${email}`, JSON.stringify(cart));
    }
  }, [cart, currentUser]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = currentUser?.email || 'guest';
      localStorage.setItem(`beauty_things_wishlist_${email}`, JSON.stringify(wishlist));
    }
  }, [wishlist, currentUser]);

  // Load User-specific Notifications when currentUser changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = currentUser?.email || 'guest';
      const savedNotifs = localStorage.getItem(`beauty_things_notifications_${email}`);
      setNotifications(savedNotifs ? JSON.parse(savedNotifs) : []);
    }
  }, [currentUser]);

  // Save Notifications to localStorage on change
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const email = currentUser?.email || 'guest';
      localStorage.setItem(`beauty_things_notifications_${email}`, JSON.stringify(notifications));
    }
  }, [notifications, currentUser]);

  const handleToggleLanguage = () => {
    const nextLang = language === 'km' ? 'en' : 'km';
    setLanguage(nextLang);
    if (typeof window !== 'undefined') {
      localStorage.setItem('beauty_things_lang', nextLang);
    }
  };

  // Cart operations
  const addToCart = (product: any, shape: string, length: string, qty = 1, sizeNotes = 'Standard S') => {
    const existingIndex = cart.findIndex(
      item => item.productId === product.id && item.shape === shape && item.length === length
    );

    if (existingIndex >= 0) {
      const updated = [...cart];
      updated[existingIndex].quantity += qty;
      setCart(updated);
    } else {
      const newItem: OrderItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.images?.[0] || 'https://picsum.photos/seed/nail/600/600',
        quantity: qty,
        shape: shape,
        length: length,
        sizeNotes
      };
      setCart([...cart, newItem]);
    }
  };

  const removeFromCart = (index: number) => {
    const updated = cart.filter((_, i) => i !== index);
    setCart(updated);
  };

  const updateQuantity = (index: number, change: number) => {
    const updated = [...cart];
    updated[index].quantity += change;
    if (updated[index].quantity <= 0) {
      removeFromCart(index);
    } else {
      setCart(updated);
    }
  };

  // Wishlist toggle
  const toggleWishlist = (product: any) => {
    const index = wishlist.findIndex(item => item.id === product.id);
    if (index >= 0) {
      setWishlist(wishlist.filter(item => item.id !== product.id));
    } else {
      setWishlist([...wishlist, product]);
    }
  };

  // Submit secure checkout
  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) return;
    setSubmittingCheckout(true);

    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          phone,
          telegramUsername,
          deliveryAddress,
          deliveryOption,
          deliveryPayPreference,
          items: cart
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setCart([]); // Clear cart
        setOrderSuccessId(data.id);
        setCurrentView('tracking');
        showToast('Your custom order was submitted successfully!', 'success');
      } else {
        showToast(data.error || 'Failed to submit order request', 'error');
      }
    } catch (err) {
      showToast('Network outage. Could not submit checkout details.', 'error');
    } finally {
      setSubmittingCheckout(false);
    }
  };

  // Submit Review detail
  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !newReviewAuthor || !newReviewComment) return;
    setSubmittingReview(true);
    try {
      const res = await fetch(`/api/products/${selectedProductId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          author: newReviewAuthor,
          rating: newReviewRating,
          comment: newReviewComment
        })
      });
      if (res.ok) {
        setNewReviewAuthor('');
        setNewReviewComment('');
        fetchProducts(); // Refresh list to catch new review
      }
    } catch(err) {
      console.error(err);
    } finally {
      setSubmittingReview(false);
    }
  };

  // Active product details helper
  const activeProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Catalog filtered lists
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
      const matchPrice = p.price <= priceRange;
      
      // Filter helper for shape and length matches if product list is pre-configured
      const matchShape = selectedShape === 'All' || (p.shapes && p.shapes.includes(selectedShape));
      const matchLength = selectedLength === 'All' || (p.lengths && p.lengths.includes(selectedLength));

      return matchSearch && matchCategory && matchPrice && matchShape && matchLength;
    });
  }, [products, searchQuery, selectedCategory, priceRange, selectedShape, selectedLength]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  }, [cart]);

  const isDeliveryFeeIncludedInTotal = useMemo(() => {
    if (deliveryOption !== 'DELIVERY') return false;
    const mode = storeSettings?.deliveryPayMode || 'INCLUDE';
    if (mode === 'INCLUDE') return true;
    if (mode === 'EXCLUDE') return false;
    return deliveryPayPreference === 'INCLUDE';
  }, [deliveryOption, storeSettings?.deliveryPayMode, deliveryPayPreference]);

  const cartTotal = useMemo(() => {
    const fee = isDeliveryFeeIncludedInTotal ? deliveryFee : 0;
    return cartSubtotal + fee;
  }, [cartSubtotal, isDeliveryFeeIncludedInTotal, deliveryFee]);

  const getKhmerFontClass = () => {
    if (language !== 'km') return '';
    const font = storeSettings?.khmerFont || 'KANTUMRUY';
    return `khmer-font-${font.toLowerCase()}`;
  };

  return (
    <div className={`min-h-screen bg-stone-50/20 text-stone-800 flex flex-col selection:bg-pink-100 selection:text-primary ${language === 'km' ? getKhmerFontClass() : 'font-sans'}`}>
      
      {/* HEADER SECTION */}
      <NavHeader 
        currentView={currentView}
        onNavigate={(v) => {
          setCurrentView(v);
          setOrderSuccessId(null); // clears order successful prompt state
        }}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        cartCount={cart.reduce((sum, i) => sum + i.quantity, 0)}
        wishlistCount={wishlist.length}
        currentUser={currentUser}
        onGoogleSignIn={() => {
          setIsAuthModalOpen(true);
          setAuthMode('signin');
          setAuthError('');
        }}
        onSignOut={handleSignOut}
        notifications={notifications}
        onMarkNotificationRead={handleMarkNotificationRead}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* VIEW 1: HOME PAGE (Luxury, brand presentation, arrivals lists) */}
        {currentView === 'home' && (
          <div className="space-y-16 animate-fadeIn" id="home-view-canvas">
            
            {/* HERO PROMOTION BANNER */}
            <section className="relative rounded-3xl bg-[#FFD6E7]/25 border border-gray-100 overflow-hidden py-14 sm:py-20 px-8 sm:px-16 text-center sm:text-left flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="max-w-xl space-y-6 z-10">
                <span className="text-[#D4A373] font-serif italic text-lg sm:text-xl block">
                  Modern Korean Aesthetics
                </span>
                
                <h1 className="font-serif text-4xl sm:text-6xl text-gray-900 leading-[1.15] tracking-tight">
                  Handmade <br className="hidden sm:inline"/> <span className="text-[#FF5FA2] font-bold">Press-on Nails</span> <br/> Crafted in Cambodia
                </h1>
                
                <p className="text-sm sm:text-base text-gray-600 max-w-sm leading-relaxed">
                  {t.heroSubtitle}
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <button
                    onClick={() => setCurrentView('shop')}
                    className="px-8 py-4 bg-gray-900 hover:bg-black text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all cursor-pointer text-center"
                    id="btn-hero-shop"
                  >
                    {t.ctaShopNow}
                  </button>
                  <button
                    onClick={() => setCurrentView('custom')}
                    className="px-8 py-4 border border-gray-900 text-gray-900 hover:bg-gray-50 rounded-full text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer text-center bg-transparent"
                    id="btn-hero-custom"
                  >
                    {t.ctaCustomDesign}
                  </button>
                </div>
              </div>

              {/* Graphical / Photo Representation */}
              <div className="mt-10 md:mt-0 relative w-64 h-64 sm:w-[350px] sm:h-[350px] rounded-3xl overflow-hidden border border-gray-100 flex items-center justify-center relative bg-gray-50 shrink-0">
                <img
                  src="https://picsum.photos/seed/nail_hero/600/600"
                  alt="Elegant Korean Press-ons"
                  className="w-full h-full object-cover"
                />
              </div>
            </section>

            {/* HOW IT WORKS / TIMELINE PROCESS */}
            <section className="space-y-8" id="section-how-it-works">
              <div className="text-center max-w-lg mx-auto">
                <span className="text-xs font-bold tracking-widest uppercase text-[#D4A373]">Process Flow</span>
                <h2 className="font-serif text-2xl sm:text-3xl font-medium text-gray-900 mt-1">{t.howItWorks}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map((stepNum) => (
                  <div key={stepNum} className="p-6 bg-white border border-gray-100 rounded-3xl space-y-3 transition-colors hover:border-gray-250">
                    <span className="text-3xl font-serif italic font-bold text-[#FF5FA2] leading-none">0{stepNum}</span>
                    <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wider">{t[`step${stepNum}Title` as keyof typeof t]}</h3>
                    <p className="text-xs text-gray-500 leading-relaxed">{t[`step${stepNum}Desc` as keyof typeof t]}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* BEST SELLERS GRID */}
            <section className="space-y-6" id="section-best-sellers">
              <div className="flex justify-between items-end border-b border-gray-150 pb-4">
                <div>
                  <span className="text-xs font-bold tracking-widest text-[#D4A373] uppercase">Modern Korean Aesthetics</span>
                  <h2 className="font-serif text-2xl text-gray-900 mt-0.5">{t.bestSellers}</h2>
                </div>
                <button
                  onClick={() => setCurrentView('shop')}
                  className="text-xs font-bold uppercase tracking-widest text-[#FF5FA2] border-b-2 border-[#FF5FA2] pb-1 hover:text-pink-600 hover:border-pink-600 transition-colors cursor-pointer"
                >
                  See all designs
                </button>
              </div>

              {loadingProducts ? (
                <div className="text-center py-10 italic text-xs text-gray-400">Aligning catalog...</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-8">
                  {products.filter(p => p.isBestSeller).slice(0, 4).map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setCurrentView('detail');
                      }}
                      className="group cursor-pointer flex flex-col bg-transparent"
                    >
                      <div className="aspect-[4/5] bg-gray-50 rounded-3xl mb-4 overflow-hidden relative border border-gray-100 flex items-center justify-center">
                        <img
                          src={p.images?.[0] || 'https://picsum.photos/seed/nail/600/600'}
                          alt={p.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter text-[#D4A373]">
                          {p.category}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleWishlist(p);
                          }}
                          className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full text-stone-500 hover:text-red-500 transition-colors cursor-pointer z-10 shadow-sm"
                        >
                          <Heart className={`w-4 h-4 ${wishlist.some(item => item.id === p.id) ? 'fill-red-500 text-red-500' : ''}`} />
                        </button>
                      </div>
                      
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium text-base text-gray-900 group-hover:text-[#FF5FA2] transition-colors truncate pr-2">{p.name}</h3>
                        <span className="text-[#FF5FA2] font-semibold text-base shrink-0">${p.price.toFixed(2)}</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        Coffin Shape • {p.productionTime}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ART DIARY CUSTOMER GALLERY */}
            <section className="space-y-6" id="section-gallery">
              <div className="text-center max-w-md mx-auto space-y-1">
                <span className="text-xs font-bold tracking-widest uppercase text-[#D4A373]">Diary Records</span>
                <h2 className="font-serif text-2xl font-medium text-gray-900">{t.customerGallery}</h2>
                <p className="text-xs text-gray-500">Meticulously cataloged press-ons worn by customers under natural sunlight.</p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <div key={idx} className="relative aspect-square rounded-3xl overflow-hidden border border-gray-100 group">
                    <img
                      src={`https://picsum.photos/seed/diary_${idx}/400/400`}
                      alt="Nails Diary"
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-stone-900/5 group-hover:bg-stone-900/25 transition-colors" />
                    <span className="absolute bottom-3 left-3 p-1 px-3 bg-white/90 backdrop-blur-xs rounded-full text-[9px] font-bold tracking-widest text-stone-800 uppercase opacity-0 group-hover:opacity-100 transition-opacity">
                      @Customer_0{idx}
                    </span>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}

        {/* VIEW 2: SHOP CATALOG PAGE (Product grid, Filters shape, length, price range) */}
        {currentView === 'shop' && (
          <div className="space-y-6 animate-fadeIn" id="shop-catalog-canvas">
            
            {/* Header info */}
            <div className="pb-4 border-b border-gray-100">
              <h2 className="font-serif text-2xl font-medium text-gray-900">{t.allProducts}</h2>
              <span className="text-xs text-gray-450">{filteredProducts.length} press-ons match currently</span>
            </div>

            {/* FILTER CONTROLS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              
              {/* FILTERS PANEL */}
              <div className="p-6 bg-white border border-gray-100 rounded-3xl space-y-6 h-fit" id="shop-sidebar-filters">
                <div className="flex justify-between items-center pb-3 border-b border-gray-100">
                  <span className="text-xs font-bold uppercase text-gray-800 flex items-center space-x-1.5">
                    <Filter className="w-4 h-4 text-primary" />
                    <span>{t.filters}</span>
                  </span>
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedCategory('All');
                      setSelectedShape('All');
                      setSelectedLength('All');
                      setPriceRange(40);
                    }}
                    className="text-[10px] font-bold text-gray-400 hover:text-primary cursor-pointer uppercase tracking-widest"
                  >
                    {t.resetFilters}
                  </button>
                </div>

                {/* Search query box */}
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Search</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder={t.searchPlaceholder}
                      className="w-full pl-8 pr-3 py-2 text-xs border border-gray-150 rounded-xl focus:outline-primary"
                    />
                    <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-gray-400" />
                  </div>
                </div>

                {/* Category tab buttons */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">{t.category}</label>
                  <div className="flex flex-col space-y-1">
                    {['All', 'Classic', 'Luxury', 'Cute', 'Elegant', 'Minimalist'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        className={`text-left px-3 py-2 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                          selectedCategory === cat 
                            ? 'bg-[#FFD6E7]/35 text-[#FF5FA2] font-bold' 
                            : 'hover:bg-gray-50 text-gray-500'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Shape options */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">{t.shape}</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {['All', 'Almond', 'Coffin', 'Square', 'Oval', 'Round', 'Stiletto'].map(sh => (
                      <button
                        key={sh}
                        onClick={() => setSelectedShape(sh)}
                        className={`py-2 text-[10px] font-bold border rounded-xl transition-all cursor-pointer ${
                          selectedShape === sh
                            ? 'bg-[#FF5FA2] border-[#FF5FA2] text-white'
                            : 'border-gray-105 hover:bg-gray-50 text-gray-500'
                        }`}
                      >
                        {sh}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Length tabs */}
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-gray-400 block">{t.length}</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['All', 'Short', 'Medium', 'Long', 'Extra Long'].map(len => (
                      <button
                        key={len}
                        onClick={() => setSelectedLength(len)}
                        className={`px-3 py-1.5 text-[10px] font-bold border rounded-full transition-all cursor-pointer ${
                          selectedLength === len
                            ? 'bg-gray-900 border-gray-900 text-white'
                            : 'border-gray-105 hover:bg-gray-50 text-gray-500'
                        }`}
                      >
                        {len}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Price range */}
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-gray-450 font-mono">
                    <span>{t.priceRange}</span>
                    <span className="text-gray-905">${priceRange.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="15"
                    max="45"
                    step="1"
                    value={priceRange}
                    onChange={(e) => setPriceRange(parseFloat(e.target.value))}
                    className="w-full accent-primary cursor-pointer text-primary"
                  />
                  <div className="flex justify-between text-[9px] text-gray-450 font-mono">
                    <span>$15.00</span>
                    <span>$45.00</span>
                  </div>
                </div>

              </div>

              {/* PRODUCTS LIST GRID */}
              <div className="md:col-span-3">
                {filteredProducts.length === 0 ? (
                  <div className="text-center py-24 text-gray-400 text-xs italic bg-white border border-gray-100 rounded-3xl">
                    No press-on designs fit your filters configuration. Try reset filters!
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-8">
                    {filteredProducts.map(p => (
                      <div 
                        key={p.id}
                        onClick={() => {
                          setSelectedProductId(p.id);
                          setCurrentView('detail');
                        }}
                        className="group cursor-pointer flex flex-col bg-transparent"
                      >
                        <div className="relative aspect-[4/5] bg-gray-50 rounded-3xl overflow-hidden border border-gray-100 flex items-center justify-center">
                          <img
                            src={p.images?.[0] || 'https://picsum.photos/seed/nail/600/600'}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute top-4 left-4 bg-white/90 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-tighter text-[#D4A373]">
                            {p.category}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(p);
                            }}
                            className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white rounded-full text-stone-500 hover:text-red-500 transition-colors cursor-pointer z-10 shadow-sm"
                          >
                            <Heart className={`w-4 h-4 ${wishlist.some(item => item.id === p.id) ? 'fill-red-500 text-red-500' : ''}`} />
                          </button>
                        </div>

                        <div className="flex justify-between items-start mt-4">
                          <h3 className="font-medium text-base text-gray-900 group-hover:text-[#FF5FA2] transition-colors truncate pr-2">{p.name}</h3>
                          <span className="text-[#FF5FA2] font-semibold text-base shrink-0">${p.price.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Almond Shape • {p.productionTime}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>

          </div>
        )}

        {/* VIEW 3: PRODUCT DETAIL PAGE (Image gallery, reviews, sizing details) */}
        {currentView === 'detail' && activeProduct && (
          <div className="space-y-12 animate-fadeIn" id="product-detail-view">
            
            {/* Back button */}
            <button
              onClick={() => setCurrentView('shop')}
              className="text-stone-600 hover:text-stone-900 text-xs font-semibold flex items-center space-x-1.5 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Designs Grid</span>
            </button>

            {/* Core details layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              
              {/* IMAGE GALLERY & ZOOM */}
              <div className="space-y-4">
                <div className="aspect-square border border-stone-250 bg-white rounded-3xl overflow-hidden p-1 bg-stone-50 flex items-center justify-center select-none relative group">
                  <img
                    src={activeProduct.images[activeImageIndex] || 'https://picsum.photos/seed/nail/600/600'}
                    alt={activeProduct.name}
                    className="w-full h-full object-cover rounded-2xl group-hover:scale-102 transition-transform duration-300"
                    id="zoom-image-main"
                  />
                </div>
                
                {/* Secondary image dots */}
                {activeProduct.images.length > 1 && (
                  <div className="flex space-x-2">
                    {activeProduct.images.map((img: string, i: number) => (
                      <button
                        key={img}
                        onClick={() => setActiveImageIndex(i)}
                        className={`w-14 h-14 rounded-lg border-2 overflow-hidden transition-all cursor-pointer ${
                          activeImageIndex === i ? 'border-[#FF5FA2]' : 'border-stone-200 hover:border-pink-200'
                        }`}
                      >
                        <img src={img} alt="Nails thumbnail" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* DETAILS AND SELECTORS */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <span className="p-1 px-2.5 bg-[#FFD6E7]/30 text-[#FF5FA2] rounded-full text-[9px] font-extrabold uppercase tracking-wider inline-block">
                    {activeProduct.category}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-3.5xl font-bold tracking-tight text-stone-950">
                    {activeProduct.name}
                  </h2>
                  <div className="flex items-center space-x-2 text-xs">
                    <div className="flex text-amber-400">
                      <Star className="w-4 h-4 fill-amber-400" />
                      <span className="font-bold text-stone-850 pl-1">{activeProduct.rating || '5.0'}</span>
                    </div>
                    <span className="text-stone-300">/</span>
                    <span className="text-stone-500 font-medium">{(activeProduct.reviews || []).length} studio reviews</span>
                  </div>
                </div>

                <div className="text-xl font-bold font-mono text-stone-900 pb-3 border-b border-stone-105">
                  ${activeProduct.price.toFixed(2)}
                </div>

                <p className="text-xs sm:text-sm text-stone-605 leading-relaxed">
                  {activeProduct.description}
                </p>

                <div className="bg-pink-50/20 border border-pink-100 p-4 rounded-xl text-xs space-y-1">
                  <div><b>{t.productionTime}：</b> <span className="text-primary font-bold">{activeProduct.productionTime}</span></div>
                  <div><b>Handcraft Source：</b> 100% bespoke created by head lacquer painters.</div>
                </div>

                {/* Sizing Guides */}
                <div className="p-4 bg-stone-50 rounded-2xl space-y-3">
                  <h4 className="text-xs font-bold text-stone-800 flex items-center space-x-1">
                    <ClipboardCheck className="w-4 h-4 text-primary" />
                    <span>Nails Size Specifications</span>
                  </h4>
                  <p className="text-[10px] text-stone-500 leading-snug">
                    You can pick standard M size or type custom specs in sizeNotes. (XS: 13mm thumb, 9mm index; S: 14mm, 10mm; M: 15mm, 11mm; L: 16mm, 12mm).
                  </p>
                </div>

                {/* Action button */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => {
                      addToCart(activeProduct, activeProduct.shapes?.[0] || 'Almond', activeProduct.lengths?.[0] || 'Medium');
                      showToast('Item added successfully to shopping cart!', 'success');
                    }}
                    className="flex-1 py-3 bg-gray-900 hover:bg-black text-white font-extrabold text-xs uppercase tracking-widest rounded-full shadow-none transition-all cursor-pointer text-center animate-none"
                    id="btn-add-to-cart-detail"
                  >
                    {t.addToCart}
                  </button>
                  <button
                    onClick={() => toggleWishlist(activeProduct)}
                    className="p-3 border border-stone-200 hover:border-pink-300 bg-white rounded-full text-stone-600 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <Heart className={`w-5 h-5 ${wishlist.some(item => item.id === activeProduct.id) ? 'fill-red-500 text-red-500' : ''}`} />
                  </button>
                </div>

              </div>

            </div>

            {/* REVIEWS SECTION */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-8 border-t border-stone-200">
              
              {/* Writer Form */}
              <div className="space-y-4">
                <h3 className="font-serif text-lg font-bold text-stone-900">{t.writeReview}</h3>
                
                <form onSubmit={handleReviewSubmit} className="space-y-3.5" id="product-review-form">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-700 block">{t.authorName}</label>
                    <input
                      type="text"
                      required
                      value={newReviewAuthor}
                      onChange={(e) => setNewReviewAuthor(e.target.value)}
                      placeholder="e.g. Sokunthea"
                      className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-[#FF5FA2]"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-700 block">{t.rating} (1-5 Stars)</label>
                    <select
                      value={newReviewRating}
                      onChange={(e) => setNewReviewRating(parseInt(e.target.value))}
                      className="w-full text-xs px-3 py-2 border rounded-lg font-bold text-stone-650"
                    >
                      <option value="5">⭐⭐⭐⭐⭐ 5 Stars</option>
                      <option value="4">⭐⭐⭐⭐ 4 Stars</option>
                      <option value="3">⭐⭐⭐ 3 Stars</option>
                      <option value="2">⭐⭐ 2 Stars</option>
                      <option value="1">⭐ 1 Star</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-700 block">{t.comment}</label>
                    <textarea
                      rows={3}
                      required
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      placeholder="Meticulously write down of styling experiences..."
                      className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-[#FF5FA2]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="px-5 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-full text-xs font-bold cursor-pointer"
                  >
                    {t.submitReview}
                  </button>
                </form>
              </div>

              {/* Reviews catalog */}
              <div className="md:col-span-2 space-y-4">
                <h3 className="font-serif text-lg font-bold text-stone-950">{t.customerReviews}</h3>
                
                <div className="space-y-4">
                  {(activeProduct.reviews || []).length === 0 ? (
                    <p className="text-stone-400 text-xs italic py-4">No reviews yet for this design. Be the first to try!</p>
                  ) : (
                    activeProduct.reviews.map((rev: any) => (
                      <div key={rev.id} className="p-4 bg-white border border-stone-200/60 rounded-xl space-y-1" id={`customer-review-${rev.id}`}>
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-stone-800">{rev.author}</span>
                          <span className="text-[10px] text-stone-450 font-mono">{new Date(rev.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex text-amber-400 text-xs py-0.5">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400" />
                          ))}
                        </div>
                        <p className="text-xs text-stone-600 leading-normal italic">
                          &ldquo;{rev.comment}&rdquo;
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>

          </div>
        )}

        {/* VIEW 4: WISHLIST VIEW */}
        {currentView === 'wishlist' && (
          <div className="space-y-6 animate-fadeIn" id="wishlist-view-canvas">
            <h2 className="font-serif text-2xl font-semibold text-stone-900 pb-3 border-b border-pink-50">{t.wishlist}</h2>

            {wishlist.length === 0 ? (
              <div className="text-center py-20 text-stone-400 text-xs bg-white border border-dashed rounded-3xl" id="wishlist-empty-prompt">
                {t.emptyWishlist}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {wishlist.map(p => (
                  <div 
                    key={p.id}
                    className="group bg-white border border-stone-200 rounded-2xl overflow-hidden relative flex flex-col justify-between"
                  >
                    <div className="aspect-square bg-stone-100 overflow-hidden relative">
                      <img src={p.images?.[0] || 'https://picsum.photos/seed/nail/600/600'} alt={p.name} className="w-full h-full object-cover" />
                      <button
                        onClick={() => toggleWishlist(p)}
                        className="absolute top-2 right-2 p-1.5 bg-white/85 text-red-500 rounded-full cursor-pointer hover:bg-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="p-3.5 space-y-1.5 bg-white">
                      <h4 className="text-xs font-bold text-gray-950 truncate">{p.name}</h4>
                      <div className="font-sans text-xs font-semibold text-[#FF5FA2]">${p.price.toFixed(2)}</div>
                      <button
                        onClick={() => {
                          addToCart(p, p.shapes?.[0] || 'Almond', p.lengths?.[0] || 'Medium');
                          showToast('Added design from wishlist to cart!', 'success');
                        }}
                        className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-900 border border-gray-100 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                        id="btn-wishlist-to-cart"
                      >
                        Move to Cart basket
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VIEW 5: CART AND SECURE CHECKOUT PAGE */}
        {currentView === 'cart' && (
          <div className="space-y-6 animate-fadeIn font-sans" id="cart-workspace">
            <h2 className="font-serif text-2xl font-semibold text-stone-900 pb-3 border-b border-pink-50">{t.cart}</h2>

            {cart.length === 0 ? (
              <div className="text-center py-20 text-stone-400 text-xs bg-white border border-dashed rounded-3xl" id="cart-empty-prompt">
                {t.emptyCart}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                
                {/* CART ITEMS BOX */}
                <div className="md:col-span-7 space-y-4">
                  {cart.map((item, idx) => (
                    <div key={idx} className="p-4 bg-white border border-stone-200/60 rounded-2xl flex items-center justify-between" id={`cart-row-${idx}`}>
                      <div className="flex items-center space-x-3.5">
                        <img src={item.image} alt={item.name} className="w-14 h-14 rounded-xl object-cover border" />
                        <div className="space-y-0.5">
                          <h4 className="text-xs font-bold text-stone-900">{item.name}</h4>
                          <span className="block text-[10px] text-stone-500 font-mono">Shape: {item.shape} / L: {item.length}</span>
                          <span className="block text-[10px] text-[#D4A373] font-mono italic">Notes: {item.sizeNotes}</span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        {/* Quantity selection */}
                        <div className="flex items-center space-x-2 bg-stone-100 p-1 rounded-lg">
                          <button
                            type="button"
                            onClick={() => updateQuantity(idx, -1)}
                            className="p-1 text-stone-600 hover:text-stone-950 hover:bg-white rounded transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="text-xs font-mono font-bold w-4 text-center text-stone-900">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(idx, 1)}
                            className="p-1 text-stone-600 hover:text-[#FF5FA2] hover:bg-white rounded transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="text-right">
                          <div className="text-xs font-bold font-mono text-stone-950">${(item.price * item.quantity).toFixed(2)}</div>
                          <button
                            type="button"
                            onClick={() => removeFromCart(idx)}
                            className="text-[10px] font-semibold text-red-500 hover:underline mt-1 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Summary card */}
                  <div className="p-5 bg-stone-50 rounded-2xl space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-medium">Bespoke Nails Subtotal</span>
                      <span className="font-bold font-mono text-stone-900">${cartSubtotal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500 font-medium">Cambodia Courier Shipment</span>
                      <span className="font-mono text-stone-600">
                        {deliveryOption === 'DELIVERY' ? (
                          isDeliveryFeeIncludedInTotal ? (
                            `$${deliveryFee.toFixed(2)}`
                          ) : (
                            `$${deliveryFee.toFixed(2)} (Pay on Arrival)`
                          )
                        ) : (
                          'Pickup ($0)'
                        )}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-stone-200 text-sm font-bold">
                      <span className="text-[#FF5FA2]">Estimated Quote Total</span>
                      <span className="font-mono text-stone-950">${cartTotal.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* CHECKOUT INFORMATION CAPTURE */}
                <div className="md:col-span-5">
                  <div className="bg-white border border-pink-100 p-5 sm:p-6 rounded-3xl shadow-lg space-y-4">
                    <h3 className="font-serif text-lg font-bold text-stone-900 border-b border-stone-100 pb-2 flex items-center space-x-2">
                      <ClipboardCheck className="w-5 h-5 text-primary" />
                      <span>{t.checkoutTitle}</span>
                    </h3>

                    <form onSubmit={handleCheckoutSubmit} className="space-y-4" id="checkout-form">
                      
                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-700 block">{t.fullName} *</label>
                        <input
                          type="text"
                          required
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="e.g. Sophy Chhim"
                          className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-[#FF5FA2]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-700 block">{t.phone} *</label>
                        <input
                          type="text"
                          required
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="e.g. 012 345 678"
                          className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-[#FF5FA2]"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-700 block">
                          {t.telegramUsername} <span className="text-stone-400 font-normal">({language === 'km' ? 'ស្រេចចិត្ត' : 'Optional'})</span>
                        </label>
                        <input
                          type="text"
                          value={telegramUsername}
                          onChange={(e) => setTelegramUsername(e.target.value)}
                          placeholder="e.g. @sophy_nails"
                          className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-[#FF5FA2]"
                        />
                      </div>

                      {/* Delivery option selection */}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-stone-700 block">{t.deliveryOption}</label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setDeliveryOption('DELIVERY')}
                            className={`py-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                              deliveryOption === 'DELIVERY'
                                ? 'bg-[#FF5FA2] border-[#FF5FA2] text-white shadow-xs'
                                : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                            }`}
                          >
                            Courier Delivery
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeliveryOption('SELF_PICKUP')}
                            className={`py-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                              deliveryOption === 'SELF_PICKUP'
                                ? 'bg-stone-900 border-stone-900 text-white'
                                : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                            }`}
                          >
                            Pickup ($0)
                          </button>
                        </div>
                      </div>

                      {deliveryOption === 'DELIVERY' && storeSettings?.deliveryPayMode === 'FLEXIBLE' && (
                        <div className="space-y-2 p-3 bg-stone-50 border border-stone-200 rounded-2xl animate-fadeIn">
                          <label className="text-[11px] font-bold text-stone-750 block">Delivery Payment Preference</label>
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              type="button"
                              onClick={() => setDeliveryPayPreference('INCLUDE')}
                              className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                                deliveryPayPreference === 'INCLUDE'
                                  ? 'bg-[#FF5FA2] border-[#FF5FA2] text-white shadow-xs'
                                  : 'bg-white border-stone-250 hover:bg-stone-100 text-stone-600'
                              }`}
                            >
                              Pay with Order (+${deliveryFee.toFixed(2)})
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeliveryPayPreference('EXCLUDE')}
                              className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                                deliveryPayPreference === 'EXCLUDE'
                                  ? 'bg-[#FF5FA2] border-[#FF5FA2] text-white shadow-xs'
                                  : 'bg-white border-stone-250 hover:bg-stone-100 text-stone-600'
                              }`}
                            >
                              Pay on Delivery (Courier Cash)
                            </button>
                          </div>
                        </div>
                      )}

                      <div className="space-y-1">
                        <label className="text-xs font-bold text-stone-700 block">{t.deliveryAddress} *</label>
                        <textarea
                          rows={2.5}
                          required
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="House No, Street, Sangkat, Khan, Phnom Penh..."
                          className="w-full text-xs px-2.5 py-1.5 border rounded-lg focus:outline-[#FF5FA2]"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingCheckout}
                        className={`w-full py-3 bg-[#FF5FA2] hover:bg-pink-600 text-white font-bold text-xs rounded-full shadow-md shadow-pink-50 hover:shadow-lg transition-all tracking-wider ${
                          submittingCheckout ? 'bg-pink-300' : 'cursor-pointer'
                        }`}
                        id="btn-checkout-submit"
                      >
                        {submittingCheckout ? 'Broadcasting specifications...' : t.submitOrderRequest}
                      </button>

                    </form>
                  </div>
                </div>

              </div>
            )}
          </div>
        )}

        {/* VIEW 6: CUSTOM REQUEST CREATION PAGE */}
        {currentView === 'custom' && (
          <div className="space-y-6 animate-fadeIn" id="custom-request-workspace">
            <CustomRequestForm 
              language={language}
              onSubmitSuccess={(id) => {
                // When custom request submitted, direct client to track other orders or we can stay put.
                // We show an awesome success card inside the form anyway!
              }}
            />
          </div>
        )}

        {/* VIEW 7: ORDER TIMELINE TRACKING PAGE */}
        {currentView === 'tracking' && (
          <div className="space-y-6 animate-fadeIn" id="tracking-view-canvas">
            {orderSuccessId && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-3xl p-6 text-center max-w-lg mx-auto shadow-md animate-bounce" id="success-checkout-lead">
                <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <h3 className="text-sm font-extrabold text-stone-900">{t.checkoutSuccess}</h3>
                <p className="text-xs text-stone-600 mt-1">
                  {language === 'km' 
                    ? 'សូមរង់ចាំក្រចកដៃសិប្បនិមិត្តរបស់អ្នកត្រូវបានយល់ព្រមពីម្ចាស់ហាង។ ជាងនឹងផ្ញើសារដំណឹងទៅ Telegram របស់អ្នក។'
                    : 'Your specifications are on review! Keep this Order ID for tracking and completing payment.'}
                </p>
                <div className="bg-white border border-emerald-100 p-2 text-xs font-mono rounded mt-3 text-stone-800">
                  ORDER ID: <span className="font-bold text-[#FF5FA2]">{orderSuccessId}</span>
                </div>
              </div>
            )}
            
            <OrderTracking 
              language={language} 
              initialOrderId={orderSuccessId || undefined} 
              showToast={showToast}
            />
          </div>
        )}

        {/* VIEW 8: OWNER HQ ADMIN PORTAL */}
        {currentView === 'admin' && (
          <div className="space-y-6 animate-fadeIn" id="owner-terminal">
            {!currentUser ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-[#FF5FA2]/10 rounded-2xl flex items-center justify-center text-[#FF5FA2] shadow-[0_8px_16px_rgba(255,95,162,0.15)] animate-bounce">
                  <Settings className="w-8 h-8 text-primary" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-gray-900">Auth Console Login Required</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Please sign in with an authorized administrator, manager, or support account to access the HQ dashboard console.
                </p>
                <button
                  onClick={() => {
                    setIsAuthModalOpen(true);
                    setAuthMode('signin');
                    setAuthError('');
                  }}
                  className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-full text-xs uppercase tracking-wider cursor-pointer transition-all"
                >
                  Sign In to Account
                </button>
              </div>
            ) : (currentUser.role !== 'admin' && currentUser.role !== 'manager' && currentUser.role !== 'support') ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto space-y-4">
                <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center text-red-500 border border-red-100 shadow-sm animate-pulse">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="font-serif text-2xl font-bold text-gray-900">Access Denied</h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Your current account (<b>{currentUser.email}</b>) has the role of <b>{currentUser.role}</b>. Only authorized staff accounts are authorized to enter the HQ panel.
                </p>
                <div className="flex space-x-2 w-full pt-2">
                  <button
                    onClick={() => setCurrentView('home')}
                    className="flex-1 py-2.5 border border-stone-200 hover:bg-stone-50 text-stone-700 font-bold rounded-full text-xs uppercase tracking-wider cursor-pointer transition-all"
                  >
                    Go to Home
                  </button>
                  <button
                    onClick={handleSignOut}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-full text-xs uppercase tracking-wider cursor-pointer transition-all"
                  >
                    Switch Account
                  </button>
                </div>
              </div>
            ) : (
              <AdminPanel showToast={showToast} currentUser={currentUser} />
            )}
          </div>
        )}

        {/* VIEW 9: USER PROFILE MANAGEMENT - SETTINGS ONLY */}
        {currentView === 'profile' && currentUser && (
          <div className="space-y-8 animate-fadeIn" id="user-profile-workspace">
            
            {/* User Premium Profile Card Header */}
            <div className="bg-gradient-to-r from-pink-50 via-white to-amber-50/30 border border-pink-100/60 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                {renderAvatar(currentUser, "w-16 h-16 sm:w-20 sm:h-20", "text-lg sm:text-2xl")}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
                      {language === 'km' ? 'ប្រវត្តិរូបរបស់ខ្ញុំ' : 'My Profile Settings'}
                    </h2>
                    <span className={`px-2.5 py-0.5 text-[9px] font-extrabold rounded-full uppercase tracking-wider ${
                      currentUser.role === 'admin' ? 'bg-pink-100 text-primary border border-pink-200' : 'bg-blue-50 text-blue-600 border border-blue-100'
                    }`}>
                      {currentUser.role === 'admin' ? (language === 'km' ? 'ម្ចាស់ហាង' : 'HQ Admin') : (language === 'km' ? 'អតិថិជន' : 'Customer')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-655 font-medium">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono flex items-center space-x-1">
                    <span>{currentUser.email}</span>
                    {currentUser.phone && (
                      <>
                        <span>•</span>
                        <span>{currentUser.phone}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Settings Form directly */}
            <div className="bg-white border border-stone-150 p-6 rounded-3xl shadow-xs">
              <div className="space-y-4 max-w-2xl mx-auto">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
                    {language === 'km' ? 'ព័ត៌មានគណនីផ្ទាល់ខ្លួន' : 'Profile Settings'}
                  </h3>
                  <p className="text-[10px] text-stone-400">
                    {language === 'km' ? 'ធ្វើបច្ចុប្បន្នភាពព័ត៌មាន رابط និងលេខទូរស័ព្ទសម្រាប់ទំនាក់ទំនងកុម្ម៉ង់' : 'Manage your contact details and order delivery info'}
                  </p>
                </div>

                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setSubmittingProfile(true);
                    try {
                      const res = await fetch('/api/users', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          email: currentUser.email,
                          firstName: profileFirstName,
                          lastName: profileLastName,
                          phone: profilePhone,
                          gender: profileGender,
                          role: currentUser.role, // Admin/Customer role protected
                          avatar: profileAvatar,
                          telegramUsername: profileTelegram
                        })
                      });

                      if (res.ok) {
                        const updated = await res.json();
                        setCurrentUser(updated);
                        localStorage.setItem('beauty_things_user', JSON.stringify(updated));
                        showToast('Profile updated successfully!', 'success');
                      } else {
                        showToast('Failed to update profile.', 'error');
                      }
                    } catch(err) {
                      showToast('Network error updating profile.', 'error');
                    } finally {
                      setSubmittingProfile(false);
                    }
                  }}
                  className="space-y-4"
                >
                  <div className="flex flex-col items-center mb-4">
                    <label htmlFor="avatar-upload-input" className="cursor-pointer group relative block">
                      {profileAvatar && !profileAvatar.includes('api.dicebear.com') ? (
                        <img
                          src={profileAvatar}
                          alt="Avatar"
                          className="w-20 h-20 rounded-full border-2 border-[#FF5FA2] shadow-sm bg-white object-cover"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-full bg-[#FF5FA2] text-white flex items-center justify-center font-bold font-serif text-2xl border-2 border-[#FF5FA2] shadow-sm uppercase select-none">
                          {getInitials(profileFirstName, profileLastName)}
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/40 text-white text-[10px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center rounded-full transition-opacity">
                        Change Photo
                      </div>
                    </label>
                    <input
                      type="file"
                      id="avatar-upload-input"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setProfileAvatar(reader.result as string);
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                    <span className="text-[9px] text-gray-400 mt-1">Click to upload photo</span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-755 uppercase block">Google Email (Fixed)</label>
                    <input
                      type="text"
                      disabled
                      value={currentUser.email}
                      className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg bg-stone-50 text-stone-400 font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-750 uppercase block">
                        {language === 'km' ? 'នាមខ្លួន *' : 'First Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={profileFirstName}
                        onChange={(e) => setProfileFirstName(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-[#FF5FA2]"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-stone-750 uppercase block">
                        {language === 'km' ? 'នាមត្រកូល *' : 'Last Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={profileLastName}
                        onChange={(e) => setProfileLastName(e.target.value)}
                        className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-[#FF5FA2]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-755 uppercase block">
                      {language === 'km' ? 'លេខទូរស័ព្ទ *' : 'Phone Number *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={profilePhone}
                      onChange={(e) => setProfilePhone(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-[#FF5FA2]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-755 uppercase block">
                      {language === 'km' ? 'ឈ្មោះអ្នកប្រើប្រាស់ Telegram' : 'Telegram Username'}
                    </label>
                    <input
                      type="text"
                      value={profileTelegram}
                      onChange={(e) => setProfileTelegram(e.target.value)}
                      placeholder="e.g. @sophy_chhim"
                      className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-[#FF5FA2]"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-755 uppercase block">
                      {language === 'km' ? 'ភេទ *' : 'Gender *'}
                    </label>
                    <select
                      value={profileGender}
                      onChange={(e) => setProfileGender(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg font-bold text-stone-700 bg-white"
                    >
                      <option value="Female">{language === 'km' ? 'ស្រី' : 'Female'}</option>
                      <option value="Male">{language === 'km' ? 'ប្រុស' : 'Male'}</option>
                      <option value="Other">{language === 'km' ? 'ផ្សេងៗ' : 'Other'}</option>
                      <option value="Prefer not to say">{language === 'km' ? 'មិនចង់បញ្ជាក់' : 'Prefer not to say'}</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    disabled={submittingProfile}
                    className="w-full py-2.5 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all cursor-pointer text-center"
                  >
                    {submittingProfile ? (language === 'km' ? 'កំពុងរក្សាទុក...' : 'Saving updates...') : (language === 'km' ? 'រក្សាទុកការផ្លាស់ប្តូរ' : 'Save Profile Changes')}
                  </button>
                </form>
              </div>
            </div>

          </div>
        )}

        {/* VIEW 10: USER ORDERS & INVOICES DIRECT ACCESS */}
        {currentView === 'orders' && currentUser && (
          <div className="space-y-8 animate-fadeIn" id="user-orders-workspace">
            
            {/* User Premium Profile Card Header */}
            <div className="bg-gradient-to-r from-pink-50 via-white to-amber-50/30 border border-pink-100/60 p-6 rounded-3xl shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center space-x-4">
                {renderAvatar(currentUser, "w-16 h-16 sm:w-20 sm:h-20", "text-lg sm:text-2xl")}
                <div className="space-y-1">
                  <div className="flex items-center space-x-2.5">
                    <h2 className="font-serif text-xl sm:text-2xl font-bold text-gray-900">
                      {language === 'km' ? 'ការបញ្ជាទិញរបស់ខ្ញុំ' : 'My Orders Ledger'}
                    </h2>
                  </div>
                  <p className="text-xs text-gray-655 font-medium">
                    {currentUser.firstName} {currentUser.lastName}
                  </p>
                  <p className="text-[10px] text-gray-400 font-mono flex items-center space-x-1">
                    <span>{currentUser.email}</span>
                    {currentUser.phone && (
                      <>
                        <span>•</span>
                        <span>{currentUser.phone}</span>
                      </>
                    )}
                  </p>
                </div>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-3 gap-2 sm:gap-4 bg-white/80 backdrop-blur-sm border border-stone-150 p-4 rounded-2xl divide-x divide-stone-100">
                <div className="px-2 text-center">
                  <span className="block text-xs font-bold text-[#FF5FA2]">{userOrders.length}</span>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                    {language === 'km' ? 'ការកុម្ម៉ង់' : 'Orders'}
                  </span>
                </div>
                <div className="px-2 text-center">
                  <span className="block text-xs font-bold text-[#FF5FA2]">{wishlist.length}</span>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                    {language === 'km' ? 'បញ្ជីប្រាថ្នា' : 'Wishlist'}
                  </span>
                </div>
                <div className="px-2 text-center">
                  <span className="block text-xs font-bold text-[#FF5FA2]">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                  <span className="text-[9px] font-bold text-stone-400 uppercase tracking-wider">
                    {language === 'km' ? 'កន្ត្រក' : 'Cart'}
                  </span>
                </div>
              </div>
            </div>

            {/* Tabs Header bar */}
            <div className="border-b border-stone-200">
              <div className="flex space-x-1 overflow-x-auto scrollbar-none pb-px">
                {[
                  { id: 'orders', label: language === 'km' ? 'ការកុម្ម៉ង់ទាំងអស់' : 'Bespoke Orders', icon: ClipboardCheck },
                  { id: 'invoices', label: language === 'km' ? 'វិក្កយបត្រលក់' : 'Sales Invoices', icon: FileText },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const isActive = (profileTab as any) === tab.id || ((profileTab as any) !== 'orders' && (profileTab as any) !== 'invoices' && tab.id === 'orders');
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setProfileTab(tab.id as any)}
                      className={`flex items-center space-x-1.5 py-3 px-4 border-b-2 text-xs font-bold uppercase tracking-wider whitespace-nowrap cursor-pointer transition-all duration-200 ${
                        isActive
                          ? 'border-[#FF5FA2] text-[#FF5FA2] bg-pink-50/20'
                          : 'border-transparent text-stone-500 hover:text-stone-900 hover:border-stone-300'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-[#FF5FA2]' : 'text-stone-450'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dashboard Content Switcher */}
            <div className="bg-white border border-stone-150 p-6 rounded-3xl shadow-xs">
              
              {/* TAB 1: BESPOKE ORDERS */}
              {((profileTab as any) === 'orders' || ((profileTab as any) !== 'orders' && (profileTab as any) !== 'invoices')) && (
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                    <div>
                      <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
                        {language === 'km' ? 'ការកុម្ម៉ង់ក្រចកសិប្បនិមិត្តរបស់ខ្ញុំ' : 'My Bespoke Orders'}
                      </h3>
                      <p className="text-[10px] text-stone-400">
                        {language === 'km' ? 'តាមដានស្ថានភាពការកុម្ម៉ង់ផ្ទាល់ខ្លួន' : 'Real-time production and tracking list'}
                      </p>
                    </div>
                    <button
                      onClick={fetchUserOrders}
                      className="text-[10px] text-pink-600 hover:underline font-bold"
                    >
                      {language === 'km' ? 'ធ្វើបច្ចុប្បន្នភាព' : 'Refresh Orders'}
                    </button>
                  </div>

                  {loadingUserOrders ? (
                    <div className="text-center py-12 text-stone-400 text-xs italic">
                      {language === 'km' ? 'កំពុងទាញយកទិន្នន័យ...' : 'Syncing your order ledger...'}
                    </div>
                  ) : userOrders.length === 0 ? (
                    <div className="text-center py-16 text-stone-400 text-xs italic bg-stone-50/50 border border-dashed rounded-2xl">
                      {language === 'km' ? (
                        <>អ្នកមិនទាន់មានការកុម្ម៉ង់នៅឡើយទេ។ ម៉ូដដែលអ្នកកុម្ម៉ង់ជាមួយលេខទូរស័ព្ទ <b>{currentUser.phone}</b> នឹងបង្ហាញនៅទីនេះ!</>
                      ) : (
                        <>You have not placed any orders yet. Once you place an order with your phone number <b>{currentUser.phone}</b>, it will appear here!</>
                      )}
                      <div className="mt-4">
                        <button
                          onClick={() => setCurrentView('shop')}
                          className="px-4 py-2 bg-stone-900 hover:bg-black text-white text-[10px] font-bold uppercase tracking-wider rounded-full cursor-pointer"
                        >
                          {language === 'km' ? 'ទិញទំនិញឥឡូវនេះ' : 'Shop Designs'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                      {userOrders.map((ord) => (
                        <div key={ord.id} className="p-4 border border-stone-200 hover:border-pink-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors bg-stone-50/10">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2 flex-wrap gap-y-1.5">
                              <span className="font-mono font-bold text-xs text-[#FF5FA2] truncate">{ord.id}</span>
                              <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full uppercase tracking-wider shrink-0 ${
                                ord.status === 'PENDING_REVIEW' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                ord.status === 'WAITING_PAYMENT' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                ord.status === 'PAYMENT_UPLOADED' ? 'bg-purple-50 text-purple-700 border border-purple-100' :
                                ord.status === 'IN_PRODUCTION' ? 'bg-pink-50 text-primary border border-pink-100' :
                                ord.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                                ord.status === 'PICKED' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                                'bg-stone-100 text-stone-600'
                              }`}>
                                {t[ord.status as keyof typeof t] || ord.status}
                              </span>
                            </div>
                            
                            <p className="text-[10px] text-stone-400 font-mono mt-1">
                              Placed on {new Date(ord.createdAt).toLocaleString()}
                            </p>

                            {/* Item details list with thumbnails */}
                            <div className="mt-3 pt-3 border-t border-stone-100 flex flex-col space-y-2">
                              {ord.items.map((item: any, itemIdx: number) => (
                                <div key={itemIdx} className="flex items-center justify-between text-xs text-stone-650">
                                  <div className="flex items-center space-x-2.5">
                                    <img 
                                      src={item.image || 'https://picsum.photos/seed/nail/600/600'} 
                                      alt={item.name} 
                                      className="w-8 h-8 rounded-lg object-cover border border-stone-150 shrink-0"
                                    />
                                    <div>
                                      <span className="font-semibold text-stone-900">{item.name}</span>
                                      <span className="block text-[9px] text-stone-400">Shape: {item.shape} / Len: {item.length}</span>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <span className="font-mono text-stone-500">{item.quantity}x</span>
                                    <span className="ml-2 font-mono font-semibold text-stone-900">${(item.price * item.quantity).toFixed(2)}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="text-right sm:border-l sm:border-stone-100 sm:pl-6 flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 shrink-0">
                            <div>
                              <div className="text-[10px] text-stone-450 font-bold uppercase tracking-wider">{language === 'km' ? 'តម្លៃសរុប' : 'Total Price'}</div>
                              <div className="text-sm font-bold font-mono text-stone-900">${ord.totalPrice.toFixed(2)}</div>
                            </div>
                            <button
                              onClick={() => {
                                setOrderSuccessId(ord.id);
                                setCurrentView('tracking');
                              }}
                              className="px-4 py-1.5 bg-stone-900 hover:bg-black text-white text-[9px] font-bold rounded-full uppercase tracking-widest cursor-pointer transition-all shadow-xs"
                            >
                              {language === 'km' ? 'តាមដានការផលិត' : 'Track Live'}
                            </button>

                            {ord.status === 'COMPLETED' && (
                              <button
                                onClick={() => handleMarkPickedUp(ord.id)}
                                className="px-4 py-1.5 bg-blue-650 hover:bg-blue-750 text-white text-[9px] font-bold rounded-full uppercase tracking-widest cursor-pointer transition-all shadow-xs"
                              >
                                {language === 'km' ? 'បានទទួលក្រចក' : 'Confirm Received'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: SALES INVOICES */}
              {profileTab === 'invoices' && (
                <div className="space-y-4">
                  <div className="border-b border-stone-100 pb-3">
                    <h3 className="text-sm font-extrabold text-stone-900 uppercase tracking-wider">
                      {language === 'km' ? 'វិក្កយបត្រលក់ និងបង្កាន់ដៃ' : 'Sales Invoices & Receipts'}
                    </h3>
                    <p className="text-[10px] text-stone-400">
                      {language === 'km' ? 'បោះពុម្ពវិក្កយបត្រផ្លូវការសម្រាប់កំណត់ត្រាការទូទាត់' : 'Print official invoices for your records'}
                    </p>
                  </div>

                  {loadingUserOrders ? (
                    <div className="text-center py-12 text-stone-400 text-xs italic">
                      {language === 'km' ? 'កំពុងស្វែងរកវិក្កយបត្រ...' : 'Retrieving invoices...'}
                    </div>
                  ) : userOrders.length === 0 ? (
                    <div className="text-center py-16 text-stone-400 text-xs italic bg-stone-50/50 border border-dashed rounded-2xl">
                      {language === 'km' ? 'មិនមានវិក្កយបត្រលក់សម្រាប់គណនីរបស់អ្នកឡើយ' : 'No sales invoices available for your account.'}
                    </div>
                  ) : (
                    <div className="space-y-3.5 max-h-[600px] overflow-y-auto pr-2">
                      {userOrders.map((ord) => (
                        <div key={ord.id} className="p-4 border border-stone-200 hover:border-pink-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors bg-white shadow-xs">
                          <div className="space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono font-bold text-xs text-stone-900">INV-{ord.id.substring(0, 8).toUpperCase()}</span>
                              <span className={`px-2 py-0.5 text-[9px] font-extrabold rounded-full uppercase tracking-wider shrink-0 ${
                                ord.status === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}>
                                {t[ord.status as keyof typeof t] || ord.status}
                              </span>
                            </div>
                            <p className="text-[10px] text-stone-400">
                              {language === 'km' ? 'កាលបរិច្ឆេទវិក្កយបត្រ៖' : 'Invoice Date:'} {new Date(ord.createdAt).toLocaleDateString()}
                            </p>
                            <p className="text-xs text-stone-600 font-medium">
                              {ord.items.length} {language === 'km' ? 'មុខទំនិញ' : 'item(s)'} • {language === 'km' ? 'ការដឹកជញ្ជូន៖' : 'Fulfillment:'} {ord.deliveryOption === 'DELIVERY' ? (language === 'km' ? 'ផ្ញើដល់កន្លែង' : 'Courier') : (language === 'km' ? 'មកយកផ្ទាល់' : 'Self Pickup')}
                            </p>
                          </div>
                          <div className="text-right flex items-center justify-between sm:justify-end space-x-6 shrink-0">
                            <div>
                              <span className="block text-[10px] text-stone-450 font-bold uppercase">{language === 'km' ? 'ទឹកប្រាក់សរុប' : 'Grand Total'}</span>
                              <span className="text-sm font-bold font-mono text-stone-900">${ord.totalPrice.toFixed(2)}</span>
                            </div>
                            <button
                              onClick={() => setPreviewInvoiceOrder(ord)}
                              className="px-4 py-2 bg-stone-100 hover:bg-[#FF5FA2] hover:text-white rounded-xl text-stone-700 transition-colors flex items-center space-x-1.5 text-xs font-bold cursor-pointer"
                            >
                              <Printer className="w-3.5 h-3.5" />
                              <span>{language === 'km' ? 'បោះពុម្ព' : 'Print'}</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        )}

      </main>

      {/* FOOTER AREA */}
      <footer className="bg-white text-gray-500 py-16 mt-20 border-t border-gray-100" id="footer-branding-block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-12">
          
          <div className="space-y-4">
            <h3 className="font-serif text-xl font-medium text-gray-900 tracking-tight">Beauty Things</h3>
            <p className="text-xs text-gray-400 leading-relaxed max-w-sm">
              Premium custom handmade press-on nail boutique in Phnom Penh, Cambodia. Bespoke Korean luxury styled with precision, approved individually before secure payouts.
            </p>
            <div className="text-[10px] text-[#D4A373] font-bold tracking-widest uppercase">
              Modern Korean Aesthetics
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#FF5FA2]">Quick Links</h4>
            <div className="flex flex-col space-y-2.5 text-xs font-semibold">
              <button onClick={() => setCurrentView('shop')} className="text-left text-gray-400 hover:text-[#FF5FA2] cursor-pointer transition-colors">Shop Nails CATALOG</button>
              <button onClick={() => setCurrentView('custom')} className="text-left text-gray-400 hover:text-[#FF5FA2] cursor-pointer transition-colors">Request Custom DESIGNS</button>
              <button onClick={() => setCurrentView('tracking')} className="text-left text-gray-400 hover:text-[#FF5FA2] cursor-pointer transition-colors">Live Order TRACKER</button>
              <button onClick={() => setCurrentView('admin')} className="text-left text-gray-400 hover:text-[#FF5FA2] cursor-pointer transition-colors">Owner Administrations TERMINAL</button>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#D4A373]">Connect & Socials</h4>
            <div className="flex flex-col space-y-2.5 text-xs text-gray-400 font-semibold">
              <a href="https://t.me/beautythings_cambodia" target="_blank" rel="noreferrer" className="flex items-center space-x-1.5 hover:text-[#FF5FA2] transition-colors">
                <Phone className="w-4 h-4 text-sky-450" />
                <span>Join Bot Channel</span>
              </a>
              <a href="https://facebook.com/beautythings" target="_blank" rel="noreferrer" className="flex items-center space-x-1.5 hover:text-[#FF5FA2] transition-colors">
                <Share2 className="w-4 h-4 text-blue-400" />
                <span>Facebook Page</span>
              </a>
              <div className="text-[10px] text-gray-300 font-mono pt-2">
                © {new Date().getFullYear()} Beauty Things Co. All Rights Reserved.
              </div>
            </div>
          </div>

        </div>
      </footer>

      {/* FLOAT ANIMATED NOTIFICATION TOAST BAR */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', duration: 0.4 }}
            className="fixed bottom-6 right-6 z-50 flex items-center space-x-3 bg-gray-900 text-white rounded-2xl px-5 py-4 shadow-xl border border-gray-800 max-w-sm pointer-events-auto"
            id="toast-notification-widget"
          >
            <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
              toast.type === 'success' ? 'bg-[#FFD6E7] text-[#FF5FA2]' : 'bg-red-500/20 text-red-400'
            }`}>
              {toast.type === 'success' ? <CheckCircle className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
            </span>
            <div className="text-xs font-semibold leading-relaxed pr-2">
              {toast.message}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-gray-400 hover:text-white transition-colors p-1 rounded-full cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
      {/* TRADITIONAL SIGN IN / SIGN UP AUTH MODAL */}
      {isAuthModalOpen && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-pink-100 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            {/* Close button */}
            <button
              onClick={() => {
                setIsAuthModalOpen(false);
                setAuthError('');
              }}
              className="absolute top-4 right-4 text-stone-400 hover:text-stone-900 transition-colors p-1.5 cursor-pointer rounded-full hover:bg-stone-50"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Logo area */}
            <div className="flex flex-col items-center text-center space-y-2">
              <div className="w-11 h-11 bg-[#FF5FA2] rounded-full flex items-center justify-center text-white font-serif italic text-lg font-bold">
                B
              </div>
              <h3 className="font-serif text-xl font-bold text-gray-900">Welcome to Beauty Things</h3>
              <p className="text-xs text-stone-500">Premium Handmade Press-on Nails Studio</p>
            </div>

            {/* Tab switchers */}
            <div className="flex bg-stone-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-all cursor-pointer ${
                  authMode === 'signin' ? 'bg-white text-[#FF5FA2] shadow-xs' : 'text-stone-500 hover:text-stone-850'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError('');
                }}
                className={`flex-1 py-1.5 text-xs font-bold rounded-lg text-center transition-all cursor-pointer ${
                  authMode === 'signup' ? 'bg-white text-[#FF5FA2] shadow-xs' : 'text-stone-500 hover:text-stone-850'
                }`}
              >
                Sign Up
              </button>
            </div>

            {authError && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-650 rounded-xl text-[11px] font-semibold text-center">
                {authError}
              </div>
            )}

            {/* DYNAMIC FORMS */}
            {authMode === 'signin' ? (
              <form onSubmit={handleAuthSignInSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase block">Email or Username *</label>
                  <input
                    type="text"
                    required
                    value={authEmailOrUser}
                    onChange={(e) => setAuthEmailOrUser(e.target.value)}
                    placeholder="e.g. Administrator or user@example.com"
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-[#FF5FA2]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase block">Password *</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-xl focus:outline-none focus:border-[#FF5FA2]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingAuth}
                  className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  {submittingAuth ? 'Signing In...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleAuthSignUpSubmit} className="space-y-3.5">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-700 uppercase block">First Name *</label>
                    <input
                      type="text"
                      required
                      value={authFirstName}
                      onChange={(e) => setAuthFirstName(e.target.value)}
                      placeholder="Sophy"
                      className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#FF5FA2]"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-700 uppercase block">Last Name *</label>
                    <input
                      type="text"
                      required
                      value={authLastName}
                      onChange={(e) => setAuthLastName(e.target.value)}
                      placeholder="Chhim"
                      className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#FF5FA2]"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase block">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={authEmailOrUser}
                    onChange={(e) => setAuthEmailOrUser(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-[#FF5FA2]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase block">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={authPhone}
                    onChange={(e) => setAuthPhone(e.target.value)}
                    placeholder="e.g. 012 345 678"
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-[#FF5FA2]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase block">Password *</label>
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-xs px-3.5 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:border-[#FF5FA2]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-700 uppercase block">Gender *</label>
                    <select
                      value={authGender}
                      onChange={(e) => setAuthGender(e.target.value)}
                      className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-none font-medium text-stone-700"
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                      <option value="Prefer not to say">Prefer not to say</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-stone-700 uppercase block">Telegram Username</label>
                    <input
                      type="text"
                      value={authTelegram}
                      onChange={(e) => setAuthTelegram(e.target.value)}
                      placeholder="@telegram_handle"
                      className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:border-[#FF5FA2]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={submittingAuth}
                  className="w-full py-3 bg-gray-900 hover:bg-black text-white rounded-full text-xs font-bold transition-all cursor-pointer disabled:opacity-50 mt-1"
                >
                  {submittingAuth ? 'Creating Account...' : 'Create Account'}
                </button>
              </form>
            )}

            {/* GOOGLE AUTHENTICATION MULTI-PROVIDER DECOR */}
            <div className="space-y-4 pt-1">
              <div className="flex items-center justify-center space-x-2 text-stone-300 text-xs">
                <hr className="w-full border-gray-200" />
                <span className="shrink-0 uppercase font-bold tracking-wider text-[9px] text-gray-400">or continue with</span>
                <hr className="w-full border-gray-200" />
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full py-2.5 border border-stone-250 hover:bg-stone-50 rounded-full text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-2 text-stone-750"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>Sign in with Google</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* COMPLETE PROFILE MODAL */}
      {isCompleteProfileOpen && pendingGoogleUser && (
        <div className="fixed inset-0 z-[100] bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full border border-pink-100 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <div className="flex flex-col items-center text-center space-y-3">
              <img
                src={pendingGoogleUser.avatar}
                alt="Google Avatar"
                className="w-16 h-16 rounded-full border-2 border-[#FF5FA2]"
              />
              <div>
                <h3 className="font-serif text-xl font-bold text-gray-900">Complete Your Profile</h3>
                <p className="text-xs text-stone-500">Sign-up for {pendingGoogleUser.email}</p>
              </div>
            </div>

            <form onSubmit={handleCompleteProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase block">First Name *</label>
                  <input
                    type="text"
                    required
                    value={profileFirstName}
                    onChange={(e) => setProfileFirstName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-[#FF5FA2]"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-stone-700 uppercase block">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={profileLastName}
                    onChange={(e) => setProfileLastName(e.target.value)}
                    className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-[#FF5FA2]"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-700 uppercase block">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="e.g. 012 345 678"
                  className="w-full text-xs px-3 py-2 border rounded-lg focus:outline-[#FF5FA2]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-stone-700 uppercase block">Gender *</label>
                <select
                  value={profileGender}
                  onChange={(e) => setProfileGender(e.target.value)}
                  className="w-full text-xs px-3 py-2 border rounded-lg font-bold text-stone-700"
                >
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-stone-700 uppercase block">Assign Platform Role *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setProfileRole('customer')}
                    className={`py-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                      profileRole === 'customer'
                        ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                    }`}
                  >
                    Customer
                  </button>
                  <button
                    type="button"
                    onClick={() => setProfileRole('admin')}
                    className={`py-2 text-[10px] font-bold rounded-lg border text-center transition-all cursor-pointer ${
                      profileRole === 'admin'
                        ? 'bg-[#FF5FA2] border-[#FF5FA2] text-white shadow-sm'
                        : 'border-stone-200 hover:bg-stone-50 text-stone-600'
                    }`}
                  >
                    HQ Admin
                  </button>
                </div>
                <p className="text-[9px] text-stone-400 text-center leading-snug">
                  Choose <b>HQ Admin</b> to manage the store and catalog, or <b>Customer</b> for standard shopping and tracking.
                </p>
              </div>

              <div className="flex space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCompleteProfileOpen(false);
                    setPendingGoogleUser(null);
                  }}
                  className="flex-1 py-2.5 border border-stone-200 text-stone-650 rounded-full text-xs font-bold hover:bg-stone-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingProfile}
                  className="flex-1 py-2.5 bg-gray-900 hover:bg-black text-white rounded-full text-xs font-bold cursor-pointer disabled:opacity-50"
                >
                  {submittingProfile ? 'Saving...' : 'Register'}
                </button>
              </div>
            </form>
          </div>
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
              <X className="w-6 h-6" />
            </button>

            <div className="space-y-1 pr-8">
              <span className="text-[10px] font-mono tracking-wider text-stone-400">SALES INVOICE WORKSPACE</span>
              <h3 className="font-serif text-xl font-bold text-stone-900">Print Preview - Order #{previewInvoiceOrder.id.slice(0, 8)}</h3>
              <p className="text-xs text-stone-500">
                Configure width style or check settings under Print Configurations. Current Format Width: <span className="font-bold text-purple-700">{storeSettings?.invoicePrintWidth || '80mm'}</span>
              </p>
            </div>

            {/* Simulated Paper Receipt Container */}
            <div className="flex justify-center bg-stone-250 p-6 rounded-2xl border border-stone-200 overflow-x-auto max-h-[60vh] overflow-y-auto">
              <div 
                className="bg-white p-6 shadow-md border border-stone-300 font-mono text-black text-left leading-tight"
                style={{
                  width: storeSettings?.invoicePrintWidth === '58mm' ? '280px' :
                         storeSettings?.invoicePrintWidth === '80mm' ? '360px' :
                         storeSettings?.invoicePrintWidth === 'A5' ? '480px' : '100%',
                  maxWidth: '100%',
                  fontSize: '12px',
                  fontFamily: "'Courier New', Courier, monospace"
                }}
              >
                {/* Header */}
                <div className="text-center mb-4 pb-2 border-b-2 border-dashed border-stone-900">
                  <h2 className="text-lg font-bold font-sans tracking-wide m-0 mb-1">BEAUTY THINGS</h2>
                  <div className="text-[10px] whitespace-pre-line text-stone-700">
                    {storeSettings?.invoiceHeaderNote || 'Premium Handmade Press-on Nails\nPhnom Penh, Cambodia'}
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
                    {storeSettings?.invoiceFooterNote || 'Thank you for choosing Beauty Things! Please follow us on Telegram @beautythings_cambodia.'}
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

    </div>
  );
}
