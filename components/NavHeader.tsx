'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ShoppingBag, Heart, Sparkles, Activity, Settings, Languages, LogIn, LogOut, User, ClipboardCheck, Bell } from 'lucide-react';
import { Language, TRANSLATIONS } from '@/lib/translations';

interface NavHeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
  language: Language;
  onToggleLanguage: () => void;
  cartCount: number;
  wishlistCount: number;
  currentUser: any;
  onGoogleSignIn: () => void;
  onSignOut: () => void;
  notifications: any[];
  onMarkNotificationRead: (id: string) => void;
}

export default function NavHeader({
  currentView,
  onNavigate,
  language,
  onToggleLanguage,
  cartCount,
  wishlistCount,
  currentUser,
  onGoogleSignIn,
  onSignOut,
  notifications = [],
  onMarkNotificationRead
}: NavHeaderProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const t = TRANSLATIONS[language];

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const getInitials = (firstName: string, lastName: string) => {
    const f = firstName ? firstName.trim().charAt(0).toUpperCase() : '';
    const l = lastName ? lastName.trim().charAt(0).toUpperCase() : '';
    return f + l || 'U';
  };

  const renderAvatar = (user: any, sizeClass = "w-6.5 h-6.5 sm:w-7 sm:h-7", textClass = "text-[10px]") => {
    if (user.avatar && !user.avatar.includes('api.dicebear.com')) {
      return (
        <img
          src={user.avatar}
          alt={user.firstName}
          className={`${sizeClass} rounded-full object-cover border border-stone-200`}
        />
      );
    }
    return (
      <div className={`${sizeClass} rounded-full bg-[#FF5FA2] text-white flex items-center justify-center font-bold font-serif ${textClass} border border-stone-200 uppercase select-none`}>
        {getInitials(user.firstName, user.lastName)}
      </div>
    );
  };

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Logo Brand Title */}
          <div 
            onClick={() => onNavigate('home')} 
            className="flex items-center space-x-3 cursor-pointer group"
            id="header-brand-logo"
          >
            <div className="w-10 h-10 bg-[#FF5FA2] rounded-full flex items-center justify-center text-white font-serif italic text-lg font-bold group-hover:rotate-12 transition-transform duration-300">
              B
            </div>
            <div className="flex flex-col">
              <h1 className="font-sans text-xl sm:text-2xl font-semibold tracking-tight text-gray-900 group-hover:text-[#FF5FA2] transition-colors">
                {t.brand}
              </h1>
              <span className="font-serif italic text-[11px] tracking-tight text-[#D4A373] -mt-1">
                Modern Korean Aesthetics
              </span>
            </div>
          </div>

          {/* Desktop Nav Actions */}
          <nav className="hidden md:flex items-center space-x-8">
            <button
              id="nav-home"
              onClick={() => onNavigate('home')}
              className={`text-xs font-bold uppercase tracking-widest transition-colors duration-200 cursor-pointer ${
                currentView === 'home' ? 'text-[#FF5FA2]' : 'text-gray-500 hover:text-[#FF5FA2]'
              }`}
            >
              {t.home}
            </button>
            <button
              id="nav-shop"
              onClick={() => onNavigate('shop')}
              className={`text-xs font-bold uppercase tracking-widest transition-colors duration-200 cursor-pointer ${
                currentView === 'shop' ? 'text-[#FF5FA2]' : 'text-gray-500 hover:text-[#FF5FA2]'
              }`}
            >
              {t.shop}
            </button>
            <button
              id="nav-custom"
              onClick={() => onNavigate('custom')}
              className={`text-xs font-bold uppercase tracking-widest flex items-center space-x-1.5 transition-colors duration-200 cursor-pointer ${
                currentView === 'custom' ? 'text-[#FF5FA2]' : 'text-gray-500 hover:text-[#FF5FA2]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4A373]" />
              <span>{t.customNails}</span>
            </button>
            <button
              id="nav-tracking"
              onClick={() => onNavigate('tracking')}
              className={`text-xs font-bold uppercase tracking-widest flex items-center space-x-1 transition-colors duration-200 cursor-pointer ${
                currentView === 'tracking' ? 'text-[#FF5FA2]' : 'text-gray-500 hover:text-[#FF5FA2]'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>{t.tracking}</span>
            </button>
          </nav>

          {/* Interactions Side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            
            {/* Language Switch Ribbon */}
            <button
              id="btn-lang-toggle"
              onClick={onToggleLanguage}
              className="p-1.5 sm:p-2 rounded-full text-stone-500 hover:bg-stone-50 hover:text-primary transition-colors flex items-center space-x-1 cursor-pointer"
              title="Switch Language / ប្តូរភាសា"
            >
              <Languages className="w-4 h-4 sm:w-5 sm:h-5 text-[#D4A373]" />
              <span className="hidden sm:inline text-xs font-mono font-medium text-stone-600">
                {language === 'km' ? 'EN' : 'ខ្មែរ'}
              </span>
            </button>

            {/* Wishlist Icon */}
            <button
              id="btn-wishlist-view"
              onClick={() => onNavigate('wishlist')}
              className="relative p-1.5 sm:p-2 rounded-full text-stone-600 hover:bg-stone-50 hover:text-[#FF5FA2] transition-colors cursor-pointer"
            >
              <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${currentView === 'wishlist' ? 'fill-primary text-primary' : ''}`} />
              {wishlistCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#FF5FA2] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-pulse">
                  {wishlistCount}
                </span>
              )}
            </button>

            {/* Orders Icon Button */}
            <button
              id="btn-orders-view"
              onClick={() => onNavigate(currentUser ? 'orders' : 'tracking')}
              className="relative p-1.5 sm:p-2 rounded-full text-stone-600 hover:bg-stone-50 hover:text-[#FF5FA2] transition-colors cursor-pointer"
              title={language === 'km' ? 'ការបញ្ជាទិញរបស់ខ្ញុំ' : 'My Orders'}
            >
              <ClipboardCheck className={`w-4 h-4 sm:w-5 sm:h-5 ${currentView === 'tracking' || currentView === 'orders' ? 'text-primary' : ''}`} />
            </button>

            {/* Cart Icon */}
            <button
              id="btn-cart-view"
              onClick={() => onNavigate('cart')}
              className="relative p-1.5 sm:p-2 rounded-full text-stone-600 hover:bg-stone-50 hover:text-[#FF5FA2] transition-colors cursor-pointer"
            >
              <ShoppingBag className={`w-4 h-4 sm:w-5 sm:h-5 ${currentView === 'cart' ? 'text-primary' : ''}`} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#FF5FA2] text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>

            {/* Notification Bell Icon */}
            <div className="relative" ref={notifRef}>
              <button
                id="btn-notification-bell"
                onClick={() => {
                  setIsNotifOpen(!isNotifOpen);
                  setIsDropdownOpen(false);
                }}
                className={`relative p-1.5 sm:p-2 rounded-full transition-colors cursor-pointer ${
                  isNotifOpen ? 'bg-pink-50 text-primary' : 'text-stone-605 hover:bg-stone-50 hover:text-[#FF5FA2]'
                }`}
                title={language === 'km' ? 'ការជូនដំណឹង' : 'Notifications'}
              >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {notifications.filter((n: any) => !n.read).length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#FF5FA2] text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                    {notifications.filter((n: any) => !n.read).length}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2.5 w-72 bg-white border border-stone-150 rounded-2xl shadow-xl py-2.5 z-50 animate-fadeIn text-xs max-h-[350px] overflow-y-auto">
                  <div className="px-4 py-2 border-b border-stone-100 font-bold text-stone-850 flex justify-between items-center">
                    <span>{language === 'km' ? 'ការជូនដំណឹង' : 'Notifications'}</span>
                    {notifications.filter((n: any) => !n.read).length > 0 && (
                      <span className="text-[9px] bg-pink-100 text-primary px-2 py-0.5 rounded-full font-extrabold uppercase">
                        {notifications.filter((n: any) => !n.read).length} New
                      </span>
                    )}
                  </div>
                  {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-stone-400 italic">
                      {language === 'km' ? 'មិនមានការជូនដំណឹងថ្មីទេ' : 'No notifications yet.'}
                    </div>
                  ) : (
                    <div className="divide-y divide-stone-100">
                      {notifications.map((n: any) => (
                        <button
                          key={n.id}
                          onClick={() => {
                            onMarkNotificationRead(n.id);
                            setIsNotifOpen(false);
                            onNavigate('orders');
                          }}
                          className={`w-full text-left px-4 py-2.5 hover:bg-stone-50 transition-colors flex flex-col space-y-1 ${
                            !n.read ? 'bg-pink-50/20 font-medium' : ''
                          }`}
                        >
                          <span className="text-stone-800 leading-tight">{n.message}</span>
                          <span className="text-[9px] text-stone-450 font-mono">
                            {new Date(n.createdAt).toLocaleDateString()} {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* User Auth Controls / Profile Dropdown */}
            {!currentUser ? (
              <button
                id="btn-google-signin"
                onClick={onGoogleSignIn}
                className="p-1.5 sm:p-2.5 rounded-full flex items-center space-x-1.5 border border-stone-200 text-stone-600 hover:bg-stone-50 hover:text-stone-900 shadow-xs cursor-pointer"
                title="Sign In with Google"
              >
                <LogIn className="w-4 h-4 text-blue-600 sm:w-4.5 sm:h-4.5" />
                <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
                  Sign In
                </span>
              </button>
            ) : (
              <div className="relative" ref={profileRef}>
                <button
                  id="btn-profile-dropdown"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className={`p-1 sm:p-1.5 rounded-full flex items-center space-x-2 border transition-colors cursor-pointer ${
                    isDropdownOpen ? 'border-primary bg-pink-50' : 'border-stone-200 hover:bg-stone-50'
                  }`}
                  title={`${currentUser.firstName} ${currentUser.lastName} (${currentUser.role})`}
                >
                  {renderAvatar(currentUser, "w-6.5 h-6.5 sm:w-7 sm:h-7", "text-[10px]")}
                  <span className="hidden sm:inline text-xs font-bold text-stone-850">
                    {currentUser.firstName}
                  </span>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2.5 w-52 bg-white border border-stone-150 rounded-2xl shadow-xl py-2 z-50 animate-fadeIn text-xs">
                    <div className="px-4 py-2 border-b border-stone-100 mb-1">
                      <p className="font-bold text-stone-905 truncate">
                        {currentUser.firstName} {currentUser.lastName}
                      </p>
                      <p className="text-[10px] text-stone-400 font-mono truncate">{currentUser.email}</p>
                      <span className={`mt-1.5 inline-block text-[9px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-full ${
                        currentUser.role === 'admin' ? 'bg-pink-100 text-primary border border-pink-200' :
                        currentUser.role === 'manager' ? 'bg-purple-100 text-purple-700 border border-purple-200' :
                        currentUser.role === 'support' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' :
                        'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {currentUser.role === 'admin' ? 'HQ Admin' :
                         currentUser.role === 'manager' ? 'Manager' :
                         currentUser.role === 'support' ? 'Support' : 'Customer'}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        onNavigate('profile');
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-stone-50 text-stone-700 font-semibold cursor-pointer"
                    >
                      My Profile
                    </button>

                    {(currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.role === 'support') && (
                      <button
                        onClick={() => {
                          onNavigate('admin');
                          setIsDropdownOpen(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-pink-50 text-primary font-bold cursor-pointer border-t border-pink-50"
                      >
                        Admin HQ Console
                      </button>
                    )}

                    <hr className="my-1.5 border-stone-100" />
                    
                    <button
                      onClick={() => {
                        onSignOut();
                        setIsDropdownOpen(false);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-650 font-bold flex items-center space-x-1.5 cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Mobile/Tablet Sub-Navigation strip */}
        <div className="flex md:hidden items-center justify-around py-2.5 border-t border-gray-100 text-gray-500">
          <button
            onClick={() => onNavigate('home')}
            className={`text-xs font-bold uppercase tracking-wider cursor-pointer ${currentView === 'home' ? 'text-[#FF5FA2]' : 'hover:text-[#FF5FA2]'}`}
          >
            {t.home}
          </button>
          <button
            onClick={() => onNavigate('shop')}
            className={`text-xs font-bold uppercase tracking-wider cursor-pointer ${currentView === 'shop' ? 'text-[#FF5FA2]' : 'hover:text-[#FF5FA2]'}`}
          >
            {t.shop}
          </button>
          <button
            onClick={() => onNavigate('custom')}
            className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-0.5 cursor-pointer ${currentView === 'custom' ? 'text-[#FF5FA2]' : 'hover:text-[#FF5FA2]'}`}
          >
            <Sparkles className="w-3 h-3 text-[#D4A373]" />
            <span>{t.customNails}</span>
          </button>
          <button
            onClick={() => onNavigate('tracking')}
            className={`text-xs font-bold uppercase tracking-wider flex items-center space-x-0.5 cursor-pointer ${currentView === 'tracking' ? 'text-[#FF5FA2]' : 'hover:text-[#FF5FA2]'}`}
          >
            <Activity className="w-3 h-3" />
            <span>Track</span>
          </button>
        </div>

      </div>
    </header>
  );
}
