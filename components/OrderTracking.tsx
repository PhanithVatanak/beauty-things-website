'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, Search, ChevronRight, CheckCircle, Clock, AlertCircle, 
  Upload, X, CreditCard, ExternalLink, RefreshCw, Smartphone, DollarSign, Sparkles
} from 'lucide-react';
import { Language, TRANSLATIONS } from '@/lib/translations';

interface OrderTrackingProps {
  language: Language;
  initialOrderId?: string;
  showToast?: (message: string, type?: 'success' | 'error' | 'info') => void;
}

export default function OrderTracking({ language, initialOrderId, showToast }: OrderTrackingProps) {
  const notify = (msg: string, type: 'success' | 'error' | 'info' = 'success') => {
    if (showToast) {
      showToast(msg, type);
    } else {
      console.log(`[Order Notice]: ${msg}`);
    }
  };
  const t = TRANSLATIONS[language];
  const [searchId, setSearchId] = useState(initialOrderId || '');
  const [orderId, setOrderId] = useState(initialOrderId || '');
  
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [orderData, setOrderData] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>(null);

  // Payment states
  const [paymentMethod, setPaymentMethod] = useState<'ABA' | 'ACLEDA' | 'WING'>('ABA');
  const [paymentScreenshot, setPaymentScreenshot] = useState('');
  const [imageName, setImageName] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchOrderDetails = async (id: string) => {
    setTimeout(() => {
      setLoading(true);
      setStatusMsg('');
    }, 0);
    try {
      const res = await fetch(`/api/orders/${id.trim()}`);
      if (res.ok) {
        const data = await res.json();
        setOrderData(data.order);
        setHistory(data.history || []);
        setSettings(data.settings);
        setOrderId(data.order.id);
        setSearchId(data.order.id);
      } else {
        setOrderData(null);
        setStatusMsg('No matching order was located. Please check the spelling of your Order Request ID.');
      }
    } catch (err) {
      setStatusMsg('Connection malfunction. Failed to retrieve order history logs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      const handle = setTimeout(() => {
        fetchOrderDetails(orderId);
      }, 0);
      return () => clearTimeout(handle);
    }
  }, [orderId]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId) {
      setOrderId(searchId);
    }
  };

  // Customer Choice (Delay Approval/Acknowledge)
  const handleDecisionResponse = async (confirmStatus: 'ACCEPTED' | 'CANCELLED') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'customer-confirm', confirmStatus }),
      });
      if (response.ok) {
        await fetchOrderDetails(orderId);
      }
    } catch (e) {
      setStatusMsg('Failed to process reaction. Please retry.');
    } finally {
      setLoading(false);
    }
  };

  // Process receipt upload to base64
  const processReceipt = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
       notify('Only image receipts (PNG/JPG) are valid.', 'error');
       return;
    }
    setImageName(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setPaymentScreenshot(e.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processReceipt(files[0]);
    }
  };

  const submitPaymentProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentScreenshot) {
       notify('Please select or drag in your bank receipt photo first.', 'error');
       return;
    }
    setSubmittingPayment(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'customer-payment',
          paymentScreenshot,
          transactionRef,
          paymentMethod
        })
      });
      if (res.ok) {
        setPaymentSuccess(true);
        notify('Your bank ledger receipt proof was successfully uploaded!', 'success');
        await fetchOrderDetails(orderId);
      } else {
        const d = await res.json();
        notify(d.error || 'Failed to submit payment receipt details.', 'error');
      }
    } catch(err) {
      notify('Network outage. Failed to upload transaction proof.', 'error');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const steps: { key: string; label: string; desc: string }[] = [
    { key: 'PENDING_REVIEW', label: t.PENDING_REVIEW, desc: 'Awaiting first evaluation from nail specialists.' },
    { key: 'WAITING_PAYMENT', label: t.WAITING_PAYMENT, desc: 'Bespoke price approved. Core pay channels unlocked.' },
    { key: 'PAYMENT_UPLOADED', label: t.PAYMENT_UPLOADED, desc: 'Receipt uploaded. Checking transaction matches bank balances.' },
    { key: 'IN_PRODUCTION', label: t.IN_PRODUCTION, desc: 'Hand painting and pearl/gel bonding in progress.' },
    { key: 'COMPLETED', label: t.COMPLETED, desc: 'Luxury boxed and courier scheduled.' }
  ];

  const getStepIndex = (status: string) => {
    if (status === 'ACCEPTED_WITH_DELAY') return 0; // customer is acting
    if (status === 'REJECTED') return -1;
    if (status === 'CANCELLED') return -1;
    
    if (status === 'PENDING_REVIEW') return 0;
    if (status === 'WAITING_PAYMENT') return 1;
    if (status === 'PAYMENT_UPLOADED') return 2;
    if (status === 'IN_PRODUCTION' || status === 'PAYMENT_VERIFIED') return 3;
    if (status === 'COMPLETED') return 4;
    return 1;
  };

  const currentStepIndex = orderData ? getStepIndex(orderData.status) : 0;

  return (
    <div className="max-w-4xl mx-auto space-y-6" id="order-tracking-workspace">
      
      {/* HEADER BAR */}
      <div className="p-8 bg-white border border-gray-105 rounded-3xl text-center">
        <span className="p-2.5 bg-gray-50 border border-gray-100 rounded-full inline-block text-[#FF5FA2] mb-3">
          <Activity className="w-5 h-5" />
        </span>
        <h2 className="font-serif text-2xl font-medium tracking-tight text-gray-900">{t.tracking}</h2>
        <p className="text-xs text-gray-500 mt-1.5 max-w-md mx-auto leading-relaxed">
          {language === 'km' 
            ? 'បញ្ចូលលេខសម្គាល់គណនីបញ្ជាទិញ (Order ID) ដើម្បីតាមដានស្ថានភាពផលិតក្រចកសិប្បនិមិត្តរបស់លោកអ្នក លម្អិតពីម្ចាស់ហាង' 
            : 'Check designer reviews, complete deposits, and monitor handcraft progress logs.'}
        </p>

        {/* SEARCH FORM */}
        <form onSubmit={handleSearchSubmit} className="mt-6 flex max-w-md mx-auto">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            placeholder="e.g. BT-ORD-12345"
            className="flex-1 px-4 py-2.5 text-xs font-semibold tracking-wider rounded-l-2xl border border-gray-200 focus:outline-[#FF5FA2] focus:border-[#FF5FA2] bg-stone-50/10"
            id="search-order-id-input"
          />
          <button
            type="submit"
            className="px-6 py-2.5 bg-gray-900 hover:bg-black text-white font-bold text-xs uppercase tracking-widest rounded-r-2xl transition-all cursor-pointer flex items-center space-x-1.5 shrink-0"
          >
            <Search className="w-4 h-4" />
            <span>Search</span>
          </button>
        </form>

        {statusMsg && (
          <div className="mt-4 text-xs font-semibold text-red-650 bg-red-50 border border-red-100 p-2.5 rounded-2xl flex items-center justify-center space-x-1 max-w-md mx-auto">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="flex flex-col items-center justify-center p-12 space-y-2 text-gray-400 font-mono text-xs">
          <RefreshCw className="w-6 h-6 animate-spin text-[#FF5FA2]" />
          <span>Synchronizing orders ledger...</span>
        </div>
      )}

      {orderData && (
        <div className="space-y-6 animate-fadeIn">
          
          {/* CRITICAL ORDER DECIISON: ACCEPTED_WITH_DELAY POPUP */}
          {orderData.status === 'ACCEPTED_WITH_DELAY' && (
            <div className="p-6 bg-amber-50 border border-amber-200 rounded-2xl shadow-md space-y-4" id="delay-decision-banner">
              <div className="flex items-start space-x-3 text-amber-800">
                <AlertCircle className="w-6 h-6 flex-shrink-0 mt-0.5 text-[#D4A373]" />
                <div>
                  <h4 className="font-bold text-stone-900">{t.acceptWithDelayNotice}</h4>
                  <p className="text-sm text-stone-700 mt-1">
                    {language === 'km' 
                      ? `ហាងបានគិតគួរម៉ូដក្រចករបស់អ្នករួចរាល់ ប៉ុន្តែកាលបរិច្ឆេទត្រូវការកែតម្រូវ៖` 
                      : `We completed your specifications assessment, but because of active workload or material waiting, delivery is modified to:`}
                  </p>
                  
                  <div className="mt-3 bg-white border border-amber-100 p-3.5 rounded-xl space-y-1.5 shadow-xs max-w-lg">
                    <div className="text-xs font-semibold text-stone-500 font-mono">ESTIMATED COMPLETION:</div>
                    <div className="text-base font-bold text-primary flex items-center space-x-1.5">
                      <Clock className="w-4 h-4" />
                      <span>{orderData.estimatedCompletionDate || '14 days'}</span>
                    </div>
                    <div className="text-xs text-stone-600 mt-1">
                      <b>Reason:</b> {orderData.sellerReasonType || 'DELAY'} ({orderData.sellerRemark || 'High order volume'})
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 pl-9">
                <button
                  onClick={() => handleDecisionResponse('ACCEPTED')}
                  className="px-5 py-2 bg-[#FF5FA2] hover:bg-pink-600 text-white font-bold text-xs rounded-full shadow-sm cursor-pointer transition-colors"
                  id="btn-confirm-delay"
                >
                  {t.confirmWait}
                </button>
                <button
                  onClick={() => handleDecisionResponse('CANCELLED')}
                  className="px-5 py-2 bg-stone-150 hover:bg-stone-200 text-stone-700 font-semibold text-xs rounded-full cursor-pointer transition-colors"
                  id="btn-cancel-on-delay"
                >
                  {t.cancelOrder}
                </button>
              </div>
            </div>
          )}

          {/* DYNAMIC TIMELINE STEPS */}
          <div className="p-8 bg-white border border-gray-105 rounded-3xl shadow-none">
            
            <div className="flex justify-between items-center pb-5 border-b border-stone-100">
              <div>
                <span className="text-[10px] font-mono tracking-wider text-stone-400">ORDER IDENTIFIER</span>
                <h3 className="text-sm font-bold text-stone-950 font-mono">#{orderData.id.slice(0, 8)} <span className="text-stone-300 font-normal">/</span> <span className="text-[#FF5FA2]">{orderData.customerName}</span></h3>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-mono tracking-wider text-stone-400">ORDER STATUS</span>
                <span className={`block px-2.5 py-0.5 mt-0.5 text-[10px] font-bold rounded-full uppercase tracking-wider ${
                  orderData.status === 'REJECTED' || orderData.status === 'CANCELLED'
                    ? 'bg-red-50 text-red-600 border border-red-100'
                    : getStepIndex(orderData.status) === 4
                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                    : 'bg-pink-50 text-[#FF5FA2] border border-pink-100'
                }`}>
                  {t[orderData.status as keyof typeof t] || orderData.status}
                </span>
              </div>
            </div>

            {orderData.deliveryOption === 'DELIVERY' && (
              <div className={`mt-4 p-3.5 rounded-2xl border text-xs flex items-center space-x-2.5 animate-fadeIn ${
                orderData.deliveryPayOption === 'EXCLUDE'
                  ? 'bg-amber-50/50 border-amber-200 text-amber-850'
                  : 'bg-emerald-50/50 border-emerald-200 text-emerald-850'
              }`}>
                {orderData.deliveryPayOption === 'EXCLUDE' ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping shrink-0" />
                    <div>
                      <strong>Delivery Info:</strong> You will pay the delivery fee of <strong>${orderData.deliveryFee.toFixed(2)}</strong> directly to the courier when the package arrives at your location.
                    </div>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <div>
                      <strong>Delivery Info:</strong> The delivery fee of <strong>${orderData.deliveryFee.toFixed(2)}</strong> has been pre-paid upfront with your order. You do not need to pay the courier on arrival.
                    </div>
                  </>
                )}
              </div>
            )}

            {/* TIMELINE RENDER */}
            {orderData.status === 'REJECTED' || orderData.status === 'CANCELLED' ? (
              <div className="py-8 text-center text-stone-400 max-w-sm mx-auto space-y-2">
                <X className="w-12 h-12 text-red-400 bg-red-50 border border-red-100 p-2.5 rounded-full mx-auto" />
                <h4 className="font-bold text-stone-800">
                  {orderData.status === 'REJECTED' ? 'Order Declined by Designer' : 'Order Cancelled'}
                </h4>
                <p className="text-xs">
                  {orderData.status === 'REJECTED' 
                    ? `Reason: ${orderData.sellerReasonType || 'None'} / "${orderData.sellerRemark || 'Material shortage'}"`
                    : 'This order was cancelled.'}
                </p>
              </div>
            ) : (
              <div className="py-8 grid grid-cols-1 sm:grid-cols-5 gap-6 relative">
                {/* Horizontal pipeline bar (desktop) */}
                <div className="hidden sm:block absolute top-[43px] left-[10%] right-[10%] h-0.5 bg-stone-100 z-0">
                  <div 
                    className="h-full bg-gradient-to-r from-[#FF5FA2] to-[#FFD6E7] transition-all duration-500"
                    style={{ width: `${(Math.max(0, currentStepIndex) / 4) * 100}%` }}
                  />
                </div>

                {steps.map((st, idx) => {
                  const isDone = currentStepIndex >= idx;
                  const isActive = currentStepIndex === idx;

                  return (
                    <div key={st.key} className="flex sm:flex-col items-center sm:text-center space-x-3 sm:space-x-0 sm:space-y-2 z-10">
                      
                      <div className={`p-2 rounded-full border-2 transition-all flex items-center justify-center w-10 h-10 ${
                        isDone 
                          ? 'bg-[#FF5FA2] border-[#FF5FA2] text-white shadow-md shadow-pink-100 scale-110'
                          : isActive 
                          ? 'border-[#FF5FA2] bg-pink-50 text-[#FF5FA2] scale-105 animate-pulse'
                          : 'bg-white border-stone-200 text-stone-400'
                      }`}>
                        {isDone ? (
                          <CheckCircle className="w-5 h-5 text-white" />
                        ) : idx === 3 ? (
                          <Sparkles className="w-5 h-5 text-[#D4A373]" />
                        ) : (
                          <Clock className="w-5 h-5" />
                        )}
                      </div>

                      <div>
                        <h4 className={`text-xs font-bold leading-tight ${isDone ? 'text-stone-900' : 'text-stone-400'}`}>
                          {st.label}
                        </h4>
                        <p className="text-[10px] text-stone-400 leading-snug hidden sm:block mt-1">
                          {st.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* UNLOCKED QR PAYMENT CONTAINER (status = WAITING_PAYMENT) */}
          {orderData.status === 'WAITING_PAYMENT' && (
            <div className="p-6 bg-white border border-pink-100 rounded-3xl shadow-xl space-y-6" id="qr-payment-gate-module">
              
              <div className="text-center max-w-md mx-auto space-y-2">
                <span className="p-2.5 bg-emerald-50 border border-emerald-100 rounded-full inline-block text-emerald-500">
                  <CreditCard className="w-6 h-6" />
                </span>
                <h3 className="font-serif text-xl font-bold text-stone-950">{t.paymentInstructions}</h3>
                <p className="text-xs text-stone-500">
                  {t.paymentSubtitle}
                </p>
              </div>

              {/* PAYMENT TOTAL BREAKDOWN */}
              <div className="bg-stone-50/70 p-4 rounded-2xl border border-stone-100 max-w-md mx-auto flex justify-between items-center">
                <div>
                  <span className="text-[10px] font-mono tracking-wider text-stone-400 block">TOTAL BESPOKE QUOTE</span>
                  <span className="text-lg font-bold text-stone-950 font-mono">${orderData.totalPrice.toFixed(2)}</span>
                </div>
                <div className="text-right text-xs">
                  <span className="text-stone-500">Handcraft sub: ${orderData.subtotal.toFixed(2)}</span>
                  <span className="block text-stone-400 font-medium">
                    Delivery: {orderData.deliveryOption === 'DELIVERY' ? (
                      orderData.deliveryPayOption === 'EXCLUDE' ? (
                        `$${orderData.deliveryFee.toFixed(2)} (Pay on Arrival)`
                      ) : (
                        `$${orderData.deliveryFee.toFixed(2)} (Pre-paid)`
                      )
                    ) : (
                      'Pickup ($0)'
                    )}
                  </span>
                </div>
              </div>

              {/* QR SELECTOR tabs */}
              <div className="max-w-md mx-auto">
                <div className="flex border-b border-stone-200">
                  {(['ABA', 'ACLEDA', 'WING'] as const).map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setPaymentMethod(method)}
                      className={`flex-1 py-2 text-xs font-semibold border-b-2 text-center transition-all ${
                        paymentMethod === method
                          ? 'border-primary text-[#FF5FA2] font-bold'
                          : 'border-transparent text-stone-400 hover:text-stone-600'
                      }`}
                    >
                      {method} Pay
                    </button>
                  ))}
                </div>

                {/* ACTIVE QR ACCREDIT DETAILS */}
                {settings && (
                  <div className="mt-6 border border-pink-50 p-6 bg-pink-50/20 rounded-2xl text-center flex flex-col items-center">
                    
                    {/* Simulated / Real QR Code representation */}
                    <div className="w-48 h-48 bg-white border border-stone-200 shadow-md rounded-xl overflow-hidden flex items-center justify-center p-2 block relative group">
                      <div className="absolute top-1 right-1 p-0.5 bg-primary rounded-full text-white">
                        <Smartphone className="w-3 h-3" />
                      </div>
                      <img
                        src={`https://picsum.photos/seed/${paymentMethod === 'ABA' ? settings.abaNumber : paymentMethod === 'ACLEDA' ? settings.acledaNumber : settings.wingNumber}/300/300`}
                        alt="Bank QR Merchant Code"
                        className="w-full h-full object-contain filter contrast-125"
                      />
                    </div>

                    <div className="mt-4 space-y-1">
                      <div className="text-xs font-bold text-stone-900 uppercase tracking-widest font-mono">
                        {paymentMethod === 'ABA' ? settings.abaHolder : paymentMethod === 'ACLEDA' ? settings.acledaHolder : settings.wingHolder}
                      </div>
                      <div className="text-sm font-bold text-[#FF5FA2] tracking-wider font-mono">
                        {paymentMethod === 'ABA' ? settings.abaNumber : paymentMethod === 'ACLEDA' ? settings.acledaNumber : settings.wingNumber}
                      </div>
                      <p className="text-[10px] text-stone-400 max-w-xs leading-relaxed italic mt-2">
                        {language === 'km' 
                          ? '* ទឹកប្រាក់សរុបគឺលុបលើកម្រៃបញ្ជាក់។ ស្កែនទូទាត់ភ្លាមៗ សារ Telegram នឹងផ្ញើទៅជាង។' 
                          : '* Ensure precise scan value matching original. Proof logs are automatically compiled.'}
                      </p>
                    </div>

                  </div>
                )}
              </div>

              {/* PROOF OF TRANSACTION SUBMISSION GRID */}
              <form onSubmit={submitPaymentProof} className="max-w-md mx-auto space-y-4 pt-4 border-t border-stone-100" id="receipt-upload-form">
                
                {/* File screenshot proof selection */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">{t.uploadReceipt} *</label>
                  
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-xl p-4 text-center cursor-pointer hover:bg-stone-50 transition-all ${
                      paymentScreenshot ? 'border-primary bg-pink-50/5' : 'border-stone-300'
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                      id="receipt-uploader"
                    />

                    {paymentScreenshot ? (
                      <div className="flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center space-x-2">
                          <img
                            src={paymentScreenshot}
                            alt="Screenshot Proof"
                            className="w-12 h-12 rounded object-cover border border-stone-200"
                          />
                          <span className="text-xs font-mono font-medium text-stone-500 truncate max-w-[200px]">
                            {imageName || 'bank_receipt.png'}
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentScreenshot('');
                            setImageName('');
                          }}
                          className="p-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-full transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 py-1 text-stone-500">
                        <Upload className="w-5 h-5 mx-auto text-[#FF5FA2]" />
                        <span className="block text-xs font-semibold text-[#FF5FA2]">{t.dragAndDrop}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reference Number */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-stone-700">{t.transactionRef}</label>
                  <input
                    type="text"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    placeholder="e.g. ABA-992384729"
                    className="w-full px-3 py-2 text-xs font-mono font-semibold rounded-lg border border-stone-200 focus:outline-[#FF5FA2]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingPayment}
                  className={`w-full py-2.5 rounded-lg text-white font-bold text-xs shadow-md shadow-pink-50 transition-all flex items-center justify-center space-x-1.5 ${
                    submittingPayment 
                      ? 'bg-pink-300 cursor-not-allowed' 
                      : 'bg-[#FF5FA2] hover:bg-pink-600 active:scale-[0.99] cursor-pointer'
                  }`}
                  id="btn-payment-dispatched"
                >
                  {submittingPayment ? (
                    <span>Uploading receipt...</span>
                  ) : (
                    <>
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>{t.submitPayment}</span>
                    </>
                  )}
                </button>

              </form>
            </div>
          )}

          {/* ORDER LIFETIME TIMELINE TRACKING LOGS */}
          <div className="p-6 bg-white border border-stone-200 rounded-2xl shadow-md">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-500 pb-3 border-b border-stone-100 flex items-center space-x-1">
              <Activity className="w-4 h-4 text-[#FF5FA2]" />
              <span>Studio Timeline History</span>
            </h4>
            
            <div className="mt-4 space-y-4 font-sans">
              {history.length === 0 ? (
                <div className="text-xs text-stone-400 py-4 italic">No timeline entries recorded yet.</div>
              ) : (
                history.map((log, index) => {
                  return (
                    <div key={log.id} className="flex space-x-3 items-start relative pb-2 group">
                      {/* Vertical connector line */}
                      {index < history.length - 1 && (
                        <div className="absolute left-[7px] top-[16px] bottom-0 w-0.5 bg-stone-100 group-hover:bg-pink-100 transition-colors" />
                      )}
                      
                      <div className={`w-4.5 h-4.5 rounded-full border-2 mt-1 z-10 flex-shrink-0 flex items-center justify-center ${
                        index === 0
                          ? 'border-[#FF5FA2] bg-white '
                          : 'border-stone-200 bg-stone-50'
                      }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${index === 0 ? 'bg-[#FF5FA2]' : 'bg-stone-300'}`} />
                      </div>

                      <div className="flex-1 space-y-0.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-stone-800">{t[log.status as keyof typeof t] || log.status}</span>
                          <span className="text-[10px] font-mono text-stone-400">{new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                        </div>
                        <p className="text-stone-600 font-medium pb-2 text-[11px] leading-relaxed">
                          {log.remark}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>
      )}

      {/* INITIAL PROMPT CASE */}
      {!orderData && (
        <div className="p-12 text-center bg-stone-50 border-2 border-dashed border-stone-200 rounded-2xl max-w-md mx-auto space-y-3">
          <Activity className="w-10 h-10 text-stone-300 mx-auto" />
          <h4 className="font-bold text-stone-700">Awaiting Search Input</h4>
          <p className="text-xs text-stone-400 max-w-xs mx-auto">
            Input your custom order identification code from checkout or Telegram link tracking parameters above to visualize your nail handcraft lifecycle.
          </p>
        </div>
      )}

    </div>
  );
}
