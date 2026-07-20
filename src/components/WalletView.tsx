/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { Coins, ShieldCheck, CreditCard, Sparkles, Check, ArrowUpRight, History, Wallet, ChevronRight } from "lucide-react";
import { User, Transaction } from "../types";

interface WalletViewProps {
  user: User;
  onBuyCredits: (data: { planName?: string; coins?: number; costUsd?: number }) => Promise<void>;
  transactions: Transaction[];
}

export default function WalletView({ user, onBuyCredits, transactions }: WalletViewProps) {
  const [selectedPlan, setSelectedPlan] = useState("");
  const [buyLoading, setBuyLoading] = useState<string | null>(null);

  const plans = [
    {
      name: "free",
      title: "Free Tier",
      price: "$0",
      features: [
        "5 Images Daily",
        "2 Videos Daily",
        "Watermark Enabled",
        "Standard Speed Queue"
      ],
      color: "from-gray-700 to-gray-800",
      badge: "Active"
    },
    {
      name: "starter",
      title: "Starter Plan",
      price: "$9.99/mo",
      features: [
        "300 Images/mo",
        "20 Videos/mo",
        "No Watermarks",
        "Standard Vector SVG",
        "Priority Generation Queue"
      ],
      color: "from-blue-600 to-indigo-600",
      badge: "Popular"
    },
    {
      name: "pro",
      title: "Pro Platform",
      price: "$29.99/mo",
      features: [
        "Unlimited Images",
        "Higher Video Limits",
        "Premium Templates Access",
        "Full SVG/SVGA Support",
        "Lottie JSON Code Exports",
        "Dedicated VIP Nodes"
      ],
      color: "from-purple-600 to-indigo-600",
      badge: "Best Value"
    },
    {
      name: "business",
      title: "Business Workspace",
      price: "$99.99/mo",
      features: [
        "Unlimited Creative Output",
        "Team Shared Workspace",
        "VisionX AI API Access",
        "Commercial Licensing Right",
        "Top Priority Dedicated Queue",
        "24/7 Enterprise SLA Support"
      ],
      color: "from-emerald-600 to-teal-600",
      badge: "Enterprise"
    }
  ];

  const handlePurchase = async (planName: string, cost: number) => {
    setBuyLoading(planName);
    try {
      await onBuyCredits({ planName, costUsd: cost });
    } finally {
      setBuyLoading(null);
    }
  };

  const handleBuyCoins = async (coins: number, cost: number) => {
    setBuyLoading(`coins-${coins}`);
    try {
      await onBuyCredits({ coins, costUsd: cost });
    } finally {
      setBuyLoading(null);
    }
  };

  return (
    <div id="wallet-view-container" className="space-y-8 text-white font-sans">
      {/* Wallet Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-brand-card border border-white/10 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Available Credits</span>
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-4xl font-black text-white mt-2 font-mono">{user.credits}</h3>
            <p className="text-xs text-white/40 mt-1">Refreshes dynamically with active subscription tier.</p>
          </div>
        </div>

        <div className="bg-brand-card border border-white/10 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/5 rounded-full blur-2xl" />
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Vision Coins</span>
            <Coins className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-4xl font-black text-white mt-2 font-mono">{user.coins}</h3>
            <p className="text-xs text-white/40 mt-1">Earned via pack purchase or plan upgrades.</p>
          </div>
        </div>

        <div className="bg-brand-card border border-white/10 p-6 rounded-3xl relative overflow-hidden flex flex-col justify-between min-h-[160px]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-widest text-white/40">Current Plan</span>
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-3xl font-black text-white mt-2 uppercase tracking-wide">{user.plan}</h3>
            <p className="text-xs text-white/40 mt-1">Account active & synchronized across nodes.</p>
          </div>
        </div>
      </div>

      {/* Subscription Pricing Matrix */}
      <div>
        <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white/40 mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          SoulVerse Cloud Creative Subscriptions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {plans.map((plan) => {
            const isActive = user.plan.toLowerCase() === plan.name;
            const priceVal = plan.name === "pro" ? 29.99 : plan.name === "starter" ? 9.99 : plan.name === "business" ? 99.99 : 0;
            return (
              <div
                key={plan.name}
                className={`bg-brand-card border rounded-3xl p-5 flex flex-col justify-between relative ${
                  isActive ? "border-blue-500 bg-blue-500/[0.02] shadow-xl" : "border-white/10"
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/60 uppercase tracking-widest">{plan.title}</span>
                    <span className="py-0.5 px-2 bg-brand-item border border-white/5 rounded-md text-[9px] font-bold text-blue-400 uppercase font-mono">{plan.badge}</span>
                  </div>
                  <div>
                    <h4 className="text-3xl font-display font-black text-white">{plan.price}</h4>
                    <span className="text-[10px] text-white/30">per user / month billing</span>
                  </div>
                  <ul className="space-y-2 pt-2 border-t border-white/10">
                    {plan.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2 text-xs text-white/70">
                        <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-6">
                  {isActive ? (
                    <button className="w-full py-2.5 bg-blue-600/10 border border-blue-500/30 text-blue-400 font-bold rounded-xl text-xs cursor-default">
                      Active Account Tier
                    </button>
                  ) : (
                    <button
                      onClick={() => handlePurchase(plan.name, priceVal)}
                      disabled={buyLoading !== null}
                      className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      {buyLoading === plan.name ? "Provisioning..." : `Upgrade Workspace`}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Coin Packs & Transactions Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pt-4">
        {/* Quick purchase token packs */}
        <div className="lg:col-span-5 bg-brand-card border border-white/10 rounded-3xl p-6">
          <h4 className="text-xs font-display font-bold uppercase tracking-wider text-white/40 mb-4 flex items-center gap-2">
            <Coins className="w-4 h-4 text-purple-400" />
            Buy Coins Packs
          </h4>

          <div className="space-y-3">
            {[
              { coins: 1000, price: "$4.99", val: 4.99 },
              { coins: 2500, price: "$9.99", val: 9.99 },
              { coins: 6000, price: "$19.99", val: 19.99 }
            ].map((pack) => (
              <button
                key={pack.coins}
                onClick={() => handleBuyCoins(pack.coins, pack.val)}
                disabled={buyLoading !== null}
                className="w-full p-4 bg-brand-item hover:bg-white/5 border border-white/5 rounded-2xl flex items-center justify-between transition text-left cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-purple-600/10 rounded-xl text-purple-400 border border-purple-500/10">
                    <Coins className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-white font-display">+{pack.coins} Coins Bundle</h5>
                    <p className="text-[10px] text-white/40 mt-0.5">Instant credit injection</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-xs text-white font-bold">
                  {pack.price}
                  <ChevronRight className="w-4 h-4 text-white/20" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Audit Log / Transaction Ledger */}
        <div className="lg:col-span-7 bg-brand-card border border-white/10 rounded-3xl p-6">
          <h4 className="text-xs font-display font-bold uppercase tracking-wider text-white/40 mb-4 flex items-center gap-2">
            <History className="w-4 h-4 text-blue-400" />
            Transaction Ledger
          </h4>

          <div className="overflow-y-auto max-h-[220px] pr-2 space-y-2 scrollbar-thin">
            {transactions.map((tx) => (
              <div key={tx.id} className="p-3 bg-brand-item border border-white/5 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-white font-display">{tx.description}</p>
                  <p className="text-[10px] text-white/40 mt-0.5 font-mono">{new Date(tx.timestamp).toLocaleString()}</p>
                </div>
                <div className="text-right">
                  <span className={`font-mono font-bold ${tx.amount > 0 ? "text-emerald-400" : "text-purple-400"}`}>
                    {tx.amount > 0 ? `+${tx.amount}` : tx.amount} coins
                  </span>
                  {tx.costUsd && (
                    <p className="text-[10px] text-white/40 mt-0.5 font-mono">${tx.costUsd.toFixed(2)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
