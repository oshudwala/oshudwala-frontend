import React, { useState } from 'react';
import { Gift, Copy, Check, Share2, Wallet, Users, Award, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Button from '../components/common/Button';

export const RefersPage = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);

  const referralCode = user?.referralCode || 'OSHUD-CARE-99';
  const referralLink = `https://oshudwala.com/register?ref=${referralCode}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    addToast('Referral code copied to clipboard!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralLink);
    addToast('Referral link copied to clipboard!', 'success');
  };

  const handleShareWhatsApp = () => {
    const text = `Hey! Order genuine medicines and book doctor appointments with Oshud Wala. Use my referral code ${referralCode} to get ₹50 off your first medicine order: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const referralHistory = [
    {
      id: 'ref-1',
      friendName: 'Tanvir Rahman',
      date: '12 Nov 2026',
      status: 'Delivered & Credited',
      reward: '+50 Coins',
      amount: '₹50.00'
    },
    {
      id: 'ref-2',
      friendName: 'Farhana Sultana',
      date: '08 Nov 2026',
      status: 'Delivered & Credited',
      reward: '+50 Coins',
      amount: '₹50.00'
    },
    {
      id: 'ref-3',
      friendName: 'Mahmudul Hasan',
      date: '02 Nov 2026',
      status: 'Delivered & Credited',
      reward: '+50 Coins',
      amount: '₹50.00'
    }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-forest-800 via-forest-900 to-[#092F25] text-white p-8 sm:p-12 shadow-floating">
        <div className="relative z-10 max-w-2xl space-y-4">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
            <Gift className="w-3.5 h-3.5" />
            Oshud Wala Rewards Program
          </span>
          <h1 className="text-3xl sm:text-4xl font-heading font-extrabold tracking-tight">
            Refer Friends & Earn <br />
            <span className="text-emerald-300">50 Oshud Coins</span> on Every Invite
          </h1>
          <p className="text-xs sm:text-sm text-forest-200 leading-relaxed max-w-lg">
            Share your love for genuine medicines and reliable healthcare. Your friends get ₹50 discount on their first order, and you earn ₹50 in wallet credits.
          </p>
        </div>

        {/* Decorative Circle Motif */}
        <div className="absolute -right-16 -bottom-16 w-80 h-80 rounded-full bg-emerald-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* Referral Code & Wallet Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Referral Code Box */}
        <div className="lg:col-span-7 bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-subtle space-y-6">
          <div>
            <h2 className="text-lg sm:text-xl font-heading font-bold text-forest-800">
              Your Exclusive Referral Code
            </h2>
            <p className="text-xs text-brandText-secondary mt-1">
              Give this code to your friends or share your invite link directly.
            </p>
          </div>

          {/* Code Box */}
          <div className="p-4 rounded-2xl bg-forest-50 border-2 border-dashed border-forest-300 flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] uppercase font-bold text-forest-600 tracking-wider">
                REFERRAL CODE
              </p>
              <p className="text-2xl sm:text-3xl font-mono font-extrabold text-forest-900 tracking-wider">
                {referralCode}
              </p>
            </div>

            <Button
              variant={copied ? 'secondary' : 'primary'}
              size="md"
              leftIcon={copied ? Check : Copy}
              onClick={handleCopyCode}
              className="flex-shrink-0 font-bold"
            >
              {copied ? 'Copied' : 'Copy Code'}
            </Button>
          </div>

          {/* Social Share Buttons */}
          <div className="space-y-3 pt-2">
            <p className="text-xs font-semibold text-brandText-main">
              Share directly with friends:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="py-3 px-4 rounded-2xl bg-[#E8F8EE] hover:bg-[#D4F4DF] text-[#128C7E] font-bold text-xs flex items-center justify-center gap-2 border border-[#25D366]/30 transition-all shadow-sm"
              >
                <Share2 className="w-4 h-4 text-[#25D366]" />
                <span>Share on WhatsApp</span>
              </button>
              <button
                type="button"
                onClick={handleCopyLink}
                className="py-3 px-4 rounded-2xl bg-surface-warm hover:bg-forest-50 text-forest-800 font-bold text-xs flex items-center justify-center gap-2 border border-brandBorder-subtle transition-all"
              >
                <Copy className="w-4 h-4 text-forest-600" />
                <span>Copy Invite Link</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right: Wallet Summary */}
        <div className="lg:col-span-5 bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-subtle space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-forest-100 text-forest-700">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-heading font-bold text-forest-800">
                Oshud Coin Balance
              </h2>
              <p className="text-xs text-brandText-secondary">
                1 Oshud Coin = ₹1.00 INR
              </p>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-forest-800 text-white shadow-card space-y-2">
            <p className="text-xs text-forest-200">Available Wallet Balance</p>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                {user?.walletBalance || 250}
              </span>
              <span className="text-xs font-bold text-emerald-300 uppercase">Coins (₹{user?.walletBalance || 250})</span>
            </div>
            <p className="text-[11px] text-forest-200 pt-1">
              Coins automatically apply as cash discounts during medicine checkout.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
              <p className="text-brandText-secondary">Total Friends Invited</p>
              <p className="text-lg font-bold text-forest-800 mt-1">5 Patients</p>
            </div>
            <div className="p-3.5 rounded-2xl bg-surface-warm border border-brandBorder-subtle">
              <p className="text-brandText-secondary">Total Earned</p>
              <p className="text-lg font-bold text-forest-800 mt-1">₹250.00</p>
            </div>
          </div>
        </div>
      </div>

      {/* How Referrals Work (3 Steps) */}
      <div className="bg-surface-pure rounded-3xl p-6 sm:p-8 border border-brandBorder-subtle shadow-subtle space-y-6">
        <h3 className="font-heading font-bold text-lg text-forest-800 text-center">
          How Referral Rewards Work
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-2xl bg-surface-warm border border-brandBorder-subtle text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-forest-600 text-white font-bold text-sm mx-auto flex items-center justify-center">
              1
            </div>
            <h4 className="font-heading font-bold text-sm text-forest-800">
              Share Your Referral Code
            </h4>
            <p className="text-xs text-brandText-secondary leading-relaxed">
              Send your personal invite code to friends, family, or colleagues across Kolkata & West Bengal.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-warm border border-brandBorder-subtle text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-forest-600 text-white font-bold text-sm mx-auto flex items-center justify-center">
              2
            </div>
            <h4 className="font-heading font-bold text-sm text-forest-800">
              Friend Places First Order
            </h4>
            <p className="text-xs text-brandText-secondary leading-relaxed">
              They receive ₹50 off instantly on their first medicine order using your code.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-surface-warm border border-brandBorder-subtle text-center space-y-2">
            <div className="w-10 h-10 rounded-full bg-forest-600 text-white font-bold text-sm mx-auto flex items-center justify-center">
              3
            </div>
            <h4 className="font-heading font-bold text-sm text-forest-800">
              You Earn 50 Oshud Coins
            </h4>
            <p className="text-xs text-brandText-secondary leading-relaxed">
              As soon as their medicines are delivered safely, 50 Coins get credited into your wallet!
            </p>
          </div>
        </div>
      </div>

      {/* Referral History Table */}
      <div className="bg-surface-pure rounded-3xl p-6 border border-brandBorder-subtle shadow-subtle space-y-4">
        <h3 className="font-heading font-bold text-base text-forest-800">
          Referral Activity & Rewards History
        </h3>

        <div className="divide-y divide-brandBorder-subtle">
          {referralHistory.map((item) => (
            <div key={item.id} className="py-3.5 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-forest-800">{item.friendName}</p>
                <p className="text-[11px] text-brandText-secondary">{item.date}</p>
              </div>

              <div className="flex items-center gap-4">
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  {item.status}
                </span>
                <span className="font-bold text-emerald-700 text-sm">{item.reward}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RefersPage;
