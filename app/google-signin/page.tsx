'use client';

import React, { useState } from 'react';
import { Mail, Shield, User, Loader2 } from 'lucide-react';

export default function GoogleSignInPopup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [step, setStep] = useState<'account-select' | 'password-entry'>('account-select');
  const [loading, setLoading] = useState(false);

  const handleSimulatedSelect = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setStep('password-entry');
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setStep('password-entry');
  };

  const handleFinalSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate Network Latency
    setTimeout(() => {
      let displayName = 'Google User';
      let avatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(email)}`;

      if (email.toLowerCase().includes('sophy')) {
        displayName = 'Sophy Chhim';
        avatar = 'https://picsum.photos/seed/sophy_avatar/200/200';
      } else if (email.toLowerCase().includes('phanith')) {
        displayName = 'Phanith Vatanak';
        avatar = 'https://picsum.photos/seed/phanith_avatar/200/200';
      } else {
        const parts = email.split('@')[0];
        displayName = parts.charAt(0).toUpperCase() + parts.slice(1);
      }

      if (window.opener) {
        window.opener.postMessage(
          {
            type: 'GOOGLE_SIGNIN_SUCCESS',
            user: {
              email: email.toLowerCase(),
              name: displayName,
              avatar: avatar,
            },
          },
          window.location.origin
        );
        window.close();
      } else {
        alert('Parent window reference lost. Please try logging in again.');
        setLoading(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-[#F0F4F9] flex items-center justify-center p-4 font-sans selection:bg-blue-100">
      <div className="w-full max-w-[450px] bg-white rounded-3xl p-8 sm:p-10 border border-gray-200/80 shadow-[0_4px_24px_rgba(0,0,0,0.04)] flex flex-col justify-between min-h-[500px]">
        
        {/* Upper Brand Section */}
        <div className="text-center space-y-4">
          {/* Google Multi-color G Symbol Mock */}
          <div className="flex justify-center items-center">
            <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.85z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.85c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl text-gray-905 font-normal tracking-tight">Sign in with Google</h1>
            <p className="text-sm text-gray-500">to continue to <span className="font-medium text-pink-600">Beauty Things</span></p>
          </div>
        </div>

        {/* Dynamic Inner Step Panels */}
        <div className="flex-1 my-6 flex flex-col justify-center">
          
          {loading ? (
            <div className="flex flex-col items-center justify-center space-y-4 py-8 animate-fadeIn">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="text-xs text-gray-400 font-medium">Verifying authorization token...</p>
            </div>
          ) : step === 'account-select' ? (
            <div className="space-y-5 animate-fadeIn">
              {/* Manual Email Input Form */}
              <form onSubmit={handleNextStep} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Enter Google Email</label>
                  <div className="relative">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="e.g. customized.nailart@gmail.com"
                      className="w-full pl-9 pr-4 py-3 text-xs border border-gray-250 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                    />
                    <Mail className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={!email}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </form>
            </div>
          ) : (
            <form onSubmit={handleFinalSignIn} className="space-y-5 animate-fadeIn">
              <div className="bg-gray-50 border border-gray-150 p-3 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2.5 truncate">
                  <span className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                    {email.charAt(0).toUpperCase()}
                  </span>
                  <span className="text-gray-600 font-mono truncate">{email}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('account-select')}
                  className="text-blue-600 hover:underline text-[10px] font-semibold shrink-0 cursor-pointer"
                >
                  Change
                </button>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">Enter password</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 text-xs border border-gray-250 rounded-xl focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                <label className="flex items-center space-x-1.5 cursor-pointer">
                  <input type="checkbox" defaultChecked className="rounded border-gray-300 accent-blue-600" />
                  <span>Show password</span>
                </label>
                <a href="#forgot" className="text-blue-600 hover:underline">Forgot password?</a>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Sign In
              </button>
            </form>
          )}
        </div>

        {/* Footer legalities */}
        <div className="flex justify-between items-center text-[10px] text-gray-400 mt-4 border-t border-gray-100 pt-4">
          <div className="flex space-x-2.5">
            <span className="cursor-pointer hover:text-gray-650">English (United States)</span>
          </div>
          <div className="flex space-x-3.5">
            <span className="cursor-pointer hover:text-gray-650">Help</span>
            <span className="cursor-pointer hover:text-gray-650">Privacy</span>
            <span className="cursor-pointer hover:text-gray-650">Terms</span>
          </div>
        </div>

      </div>
    </div>
  );
}
