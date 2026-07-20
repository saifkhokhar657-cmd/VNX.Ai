/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Sparkles, Layers, Image as ImageIcon, Video, Code, FileCode, Sliders, Settings2, 
  HelpCircle, ShieldCheck, LogOut, Globe, Wallet, Coins, RefreshCw, PanelLeftClose, 
  PanelLeftOpen, BarChart2, Folder, Lock, CheckCircle, Smartphone, Monitor
} from "lucide-react";

import { AIModule, User, GeneratedAsset, Transaction, LanguageCode } from "./types";
import { translations } from "./localization";
import AuthModal from "./components/AuthModal";
import ImageStudio from "./components/ImageStudio";
import AnimationStudio from "./components/AnimationStudio";
import VideoStudio from "./components/VideoStudio";
import SvgStudio from "./components/SvgStudio";
import FileConverter from "./components/FileConverter";
import TemplatesLibrary from "./components/TemplatesLibrary";
import WalletView from "./components/WalletView";
import ProfileCompletionModal from "./components/ProfileCompletionModal";
import AccountSettings from "./components/AccountSettings";
import { BRAND_ASSETS } from "./assets";
import { logoutUser } from "./lib/firebase";

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const localUserStr = localStorage.getItem("vx_active_user");
    if (localUserStr) {
      try {
        const parsed = JSON.parse(localUserStr);
        if (parsed && parsed.isLoggedIn) {
          return parsed;
        }
      } catch (e) {
        return null;
      }
    }
    return null;
  });
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [currentTab, setCurrentTab] = useState<AIModule | "dashboard" | "settings">("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recentAssets, setRecentAssets] = useState<GeneratedAsset[]>([]);
  const [activeProvider, setActiveProvider] = useState("gemini");
  
  const text = translations[language];

  // Fetch initial state / Sync with Express database
  useEffect(() => {
    if (user && user.isLoggedIn) {
      syncDatabaseData();
    }
  }, [user?.id]);

  const syncDatabaseData = async () => {
    try {
      // First, sync the client-side user account state to the server for perfect backend alignment
      const localUserStr = localStorage.getItem("vx_active_user");
      if (localUserStr) {
        try {
          const parsed = JSON.parse(localUserStr);
          if (parsed && parsed.isLoggedIn) {
            await fetch("/api/user/sync", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ user: parsed })
            });
          }
        } catch (e) {
          console.error("Local user JSON parse error inside syncDatabaseData:", e);
        }
      }

      const uRes = await fetch("/api/user");
      const uData = await uRes.json();
      
      setUser(prevUser => {
        if (!prevUser) {
          localStorage.setItem("vx_active_user", JSON.stringify(uData.user));
          return uData.user;
        }
        const merged = {
          ...prevUser,
          credits: uData.user.credits !== undefined ? uData.user.credits : prevUser.credits,
          coins: uData.user.coins !== undefined ? uData.user.coins : prevUser.coins,
          plan: uData.user.plan || prevUser.plan,
          role: uData.user.role || prevUser.role,
        };
        localStorage.setItem("vx_active_user", JSON.stringify(merged));
        return merged;
      });

      const aRes = await fetch("/api/assets");
      const aData = await aRes.json();
      setRecentAssets(aData.assets);

      const tRes = await fetch("/api/transactions");
      const tData = await tRes.json();
      setTransactions(tData.transactions);
    } catch (err) {
      console.log("Failed to sync backend state:", err);
    }
  };

  // Auth Handler
  const handleLoginSuccess = (authenticatedUser: User) => {
    setUser(authenticatedUser);
  };

  const handleLogout = () => {
    logoutUser();
    setUser(null);
    setCurrentTab("dashboard");
  };

  // API Route proxied calls
  const handleGenerateImage = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const responseData = await res.json();
      if (responseData.success) {
        await syncDatabaseData();
        return responseData.asset;
      } else {
        throw new Error(responseData.error || "Generation failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateSVG = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate/svg", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const responseData = await res.json();
      if (responseData.success) {
        await syncDatabaseData();
        return responseData.asset;
      } else {
        throw new Error(responseData.error || "SVG Generation failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateAnimation = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate/animation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const responseData = await res.json();
      if (responseData.success) {
        await syncDatabaseData();
        return responseData.asset;
      } else {
        throw new Error(responseData.error || "Animation failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateVideo = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/generate/video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const responseData = await res.json();
      if (responseData.success) {
        await syncDatabaseData();
        return responseData.asset;
      } else {
        throw new Error(responseData.error || "Video generation failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileConvert = async (data: any) => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const responseData = await res.json();
      if (responseData.success) {
        await syncDatabaseData();
        return responseData;
      } else {
        throw new Error(responseData.error || "File conversion failed");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleBuyCredits = async (data: any) => {
    try {
      const res = await fetch("/api/user/buy-credits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      const responseData = await res.json();
      if (responseData.success) {
        await syncDatabaseData();
        alert("Wallet tokens credited successfully!");
      }
    } catch (err) {
      console.log(err);
    }
  };

  // Authenticate user check
  if (!user || !user.isLoggedIn) {
    return <AuthModal onLoginSuccess={handleLoginSuccess} />;
  }

  // Force profile completion for registered users
  if (!user.isGuest && !user.profileCompleted) {
    return (
      <ProfileCompletionModal 
        user={user} 
        onCompleted={(updatedUser) => setUser(updatedUser)} 
      />
    );
  }

  return (
    <div id="visionx-app-shell" className="min-h-screen bg-brand-bg text-white flex flex-col font-sans select-none antialiased">
      {/* Upper Universal Navigation HUD */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/10 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-xl border border-white/10 transition hidden md:block cursor-pointer"
          >
            {sidebarOpen ? <PanelLeftClose className="w-4 h-4 text-white/60" /> : <PanelLeftOpen className="w-4 h-4 text-white" />}
          </button>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg overflow-hidden border border-white/10 shadow-lg shadow-blue-500/10 flex items-center justify-center">
              <img src={BRAND_ASSETS.logo} alt="VisionX AI Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div>
              <h1 className="text-base font-display font-bold tracking-tight text-white">{text.title}</h1>
              <p className="text-[9px] text-white/40 font-mono tracking-widest uppercase">SoulVerse Apps Suite</p>
            </div>
          </div>
        </div>

        {/* Global actions: Language selector, credits balance, and account logout */}
        <div className="flex items-center gap-4">
          {/* Credits Display */}
          <div className="hidden sm:flex items-center gap-3 bg-white/5 border border-white/10 rounded-full px-3.5 py-1.5 text-xs font-semibold">
            <span className="flex items-center gap-1.5 text-blue-400 font-mono">
              <Wallet className="w-3.5 h-3.5" />
              {user.credits} <span className="text-[9px] text-white/40 uppercase">{text.credits}</span>
            </span>
            <span className="h-3 w-px bg-white/10" />
            <span className="flex items-center gap-1.5 text-purple-400 font-mono">
              <Coins className="w-3.5 h-3.5" />
              {user.coins} <span className="text-[9px] text-white/40 uppercase">{text.coins}</span>
            </span>
          </div>

          {/* Localized multi language picker */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-2.5 py-1">
            <Globe className="w-3.5 h-3.5 text-white/60" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as LanguageCode)}
              className="bg-transparent text-xs text-white/80 outline-none border-none cursor-pointer focus:text-white"
            >
              <option value="en" className="bg-[#0a0a0f] text-white">English (EN)</option>
              <option value="ur" className="bg-[#0a0a0f] text-white">Urdu (اردو)</option>
              <option value="ar" className="bg-[#0a0a0f] text-white">Arabic (العربية)</option>
              <option value="hi" className="bg-[#0a0a0f] text-white">Hindi (हिन्दी)</option>
            </select>
          </div>

          {/* User Account avatar & actions */}
          <div className="flex items-center gap-2.5">
            <button 
              onClick={() => setCurrentTab("settings")}
              className="flex items-center gap-2.5 text-left group hover:opacity-85 transition cursor-pointer"
              title="View Profile Settings"
            >
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.name} className="w-8 h-8 rounded-full border border-blue-500/30 object-cover group-hover:border-blue-400/60 transition" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600/10 text-blue-400 border border-blue-500/30 flex items-center justify-center font-bold text-xs uppercase group-hover:border-blue-400/60 transition">
                  {user.name.charAt(0)}
                </div>
              )}
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-white group-hover:text-blue-400 transition truncate max-w-[100px]">{user.name}</p>
                <span className="text-[9px] font-mono text-purple-400 uppercase tracking-widest">{user.plan}</span>
              </div>
            </button>
            <button
              onClick={handleLogout}
              className="p-2 hover:bg-red-950/20 hover:text-red-400 rounded-xl border border-transparent transition text-white/60 cursor-pointer"
              title="Logout session"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Layout Workspace Wrapper */}
      <div className="flex-grow flex relative">
        {/* Collapsible Left Side panel */}
        <aside
          className={`bg-[#0a0a0f] border-r border-white/10 transition-all duration-300 z-30 flex flex-col justify-between ${
            sidebarOpen ? "w-64" : "w-0 md:w-20"
          } overflow-hidden md:relative absolute inset-y-0 left-0`}
        >
          <div className="py-6 px-4 space-y-6">
            <div className="space-y-1.5">
              <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest px-3">Primary Gateways</span>
              {[
                { tab: "dashboard", label: text.dashboard, icon: <BarChart2 className="w-4 h-4" /> },
                { tab: AIModule.IMAGE, label: text.imageStudio, icon: <ImageIcon className="w-4 h-4" /> },
                { tab: AIModule.ANIMATION, label: text.animationStudio, icon: <Video className="w-4 h-4" /> },
                { tab: AIModule.VIDEO, label: text.videoStudio, icon: <Video className="w-4 h-4 text-purple-400" /> },
                { tab: AIModule.SVG, label: text.svgStudio, icon: <Code className="w-4 h-4" /> },
                { tab: AIModule.CONVERTER, label: text.fileConverter, icon: <FileCode className="w-4 h-4" /> },
                { tab: AIModule.TEMPLATES, label: text.templates, icon: <Folder className="w-4 h-4" /> }
              ].map((item) => (
                <button
                  key={item.tab}
                  onClick={() => {
                    setCurrentTab(item.tab as any);
                    // On mobile, close sidebar after clicking
                    if (window.innerWidth < 768) setSidebarOpen(false);
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${
                    currentTab === item.tab
                      ? "bg-blue-600/10 border border-blue-500/30 text-blue-400"
                      : "text-white/60 hover:text-white border border-transparent hover:bg-white/5"
                  }`}
                >
                  {item.icon}
                  {sidebarOpen && <span>{item.label}</span>}
                </button>
              ))}
            </div>

            <div className="space-y-1.5">
              <span className="text-[9px] font-mono font-bold text-white/40 uppercase tracking-widest px-3">Ecosystem & Settings</span>
              <button
                onClick={() => { setCurrentTab(AIModule.WALLET); if (window.innerWidth < 768) setSidebarOpen(false); }}
                className={`w-full py-2 px-3 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${
                  currentTab === AIModule.WALLET
                    ? "bg-purple-600/10 border border-purple-500/30 text-purple-400"
                    : "text-white/60 hover:text-white border border-transparent hover:bg-white/5"
                }`}
              >
                <Wallet className="w-4 h-4" />
                {sidebarOpen && <span>{text.wallet}</span>}
              </button>

              <button
                onClick={() => { setCurrentTab("settings"); if (window.innerWidth < 768) setSidebarOpen(false); }}
                className={`w-full py-2 px-3 rounded-xl text-left text-xs font-semibold flex items-center gap-3 transition cursor-pointer ${
                  currentTab === "settings"
                    ? "bg-blue-600/10 border border-blue-500/30 text-blue-400"
                    : "text-white/60 hover:text-white border border-transparent hover:bg-white/5"
                }`}
              >
                <Settings2 className="w-4 h-4" />
                {sidebarOpen && <span>Account Settings</span>}
              </button>
            </div>
          </div>

          <div className="p-4 border-t border-white/10 text-center">
            {sidebarOpen ? (
              <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
                PWA Installable • Ready
              </p>
            ) : (
              <Smartphone className="w-4 h-4 text-white/40 mx-auto" />
            )}
          </div>
        </aside>

        {/* Content workspace window */}
        <main className="flex-grow p-6 md:p-8 overflow-y-auto max-h-[88vh] bg-brand-bg">
          <AnimatePresence mode="wait">
            {currentTab === "dashboard" ? (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="space-y-8"
              >
                {/* Greeting banner */}
                <div className="bg-[#0b0c14] border border-white/10 rounded-3xl p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 glow-glow">
                  <div className="absolute inset-0 bg-gradient-to-r from-[#030712] via-[#030712]/85 to-transparent z-10" />
                  <img src={BRAND_ASSETS.banner} alt="VisionX Banner" className="absolute right-0 top-0 h-full w-2/3 object-cover opacity-40 pointer-events-none z-0" referrerPolicy="no-referrer" />
                  <div className="space-y-2 text-center md:text-left relative z-20">
                    <h2 className="text-2xl md:text-3xl font-display font-black tracking-tight text-white">
                      Welcome Back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">{user.name}</span>!
                    </h2>
                    <p className="text-sm text-white/50 max-w-md leading-relaxed">
                      Select any generative module below to start designing high-fidelity imagery, responsive vector SVGs, or physics-based vector animation loops.
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setCurrentTab(AIModule.IMAGE)}
                      className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/15 transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      Create New Artwork
                    </button>
                  </div>
                </div>

                {/* Quick actions grids */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    { tab: AIModule.IMAGE, title: text.imageStudio, desc: "Text to image, remove BG, upscale, face enhance & customized logo/banners.", color: "border-blue-500/30 text-blue-400 bg-blue-500/5", icon: <ImageIcon className="w-6 h-6" /> },
                    { tab: AIModule.ANIMATION, title: text.animationStudio, desc: "Physics and CSS vector animations based on SVGA & Lottie codecs.", color: "border-purple-500/30 text-purple-400 bg-purple-500/5", icon: <Video className="w-6 h-6" /> },
                    { tab: AIModule.SVG, title: text.svgStudio, desc: "Symmetrical layout vectors, responsive modern illustration elements.", color: "border-emerald-500/30 text-emerald-400 bg-emerald-500/5", icon: <Code className="w-6 h-6" /> }
                  ].map((act) => (
                    <div
                      key={act.tab}
                      onClick={() => setCurrentTab(act.tab)}
                      className="bg-[#0a0a0f] border border-white/10 hover:border-white/20 p-6 rounded-3xl cursor-pointer transition-all hover:scale-[1.01] flex flex-col justify-between group min-h-[180px] relative overflow-hidden"
                    >
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600/5 to-purple-600/5 rounded-3xl blur opacity-0 group-hover:opacity-100 transition duration-500" />
                      <div className="space-y-3 relative z-10">
                        <div className={`p-3 rounded-2xl w-fit border ${act.color}`}>
                          {act.icon}
                        </div>
                        <h4 className="text-base font-display font-bold text-white group-hover:text-blue-400 transition">{act.title}</h4>
                        <p className="text-xs text-white/60 leading-relaxed">{act.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Generations Gallery */}
                <div className="bg-[#0a0a0f] border border-white/10 p-6 rounded-3xl space-y-4">
                  <h3 className="text-base font-display font-bold text-white flex items-center gap-2">
                    <Folder className="w-5 h-5 text-purple-400" />
                    Recent Sandbox Workspace Generations
                  </h3>
                  {recentAssets.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                      {recentAssets.slice(0, 4).map((asset) => (
                        <div key={asset.id} className="bg-[#0d0d14] border border-white/5 rounded-xl overflow-hidden p-3 space-y-2 relative group hover:border-white/15 transition-all">
                          <div className="aspect-square rounded-lg bg-[#050508] overflow-hidden flex items-center justify-center border border-white/10">
                            {asset.svgCode ? (
                              <div className="w-full h-full" dangerouslySetInnerHTML={{ __html: asset.svgCode }} />
                            ) : (
                              <img src={asset.url} alt={asset.prompt} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                            )}
                          </div>
                          <div>
                            <span className="text-[8px] font-mono font-bold text-blue-400 uppercase tracking-wider">{asset.module}</span>
                            <p className="text-xs font-semibold text-white/90 truncate">{asset.prompt}</p>
                            <p className="text-[10px] text-white/40 font-mono mt-0.5">{new Date(asset.timestamp).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <div className="w-20 h-20 mb-3.5 rounded-2xl overflow-hidden border border-white/10 shadow-xl bg-[#030712] p-0.5 flex items-center justify-center">
                        <img src={BRAND_ASSETS.emptyState} alt="Empty Sandbox" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
                      </div>
                      <p className="text-xs font-semibold text-white/80">Your Creative Sandbox is Empty</p>
                      <p className="text-[10px] text-white/40 mt-1 max-w-[260px] leading-relaxed">Your generated vectors, high-res images, and animation assets will synchronize and display here.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            ) : currentTab === AIModule.IMAGE ? (
              <motion.div key="image" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <ImageStudio onGenerate={handleGenerateImage} isLoading={isLoading} userCredits={user.credits} />
              </motion.div>
            ) : currentTab === AIModule.ANIMATION ? (
              <motion.div key="animation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AnimationStudio onGenerate={handleGenerateAnimation} isLoading={isLoading} />
              </motion.div>
            ) : currentTab === AIModule.VIDEO ? (
              <motion.div key="video" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <VideoStudio onGenerate={handleGenerateVideo} isLoading={isLoading} />
              </motion.div>
            ) : currentTab === AIModule.SVG ? (
              <motion.div key="svg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <SvgStudio onGenerate={handleGenerateSVG} isLoading={isLoading} />
              </motion.div>
            ) : currentTab === AIModule.CONVERTER ? (
              <motion.div key="converter" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <FileConverter onConvert={handleFileConvert} isLoading={isLoading} />
              </motion.div>
            ) : currentTab === AIModule.TEMPLATES ? (
              <motion.div key="templates" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <TemplatesLibrary />
              </motion.div>
            ) : currentTab === AIModule.WALLET ? (
              <motion.div key="wallet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <WalletView user={user} onBuyCredits={handleBuyCredits} transactions={transactions} />
              </motion.div>
            ) : currentTab === "settings" ? (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <AccountSettings user={user} onUserUpdate={(updated) => setUser(updated)} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </main>
      </div>

      {/* Touch friendly bottom nav for mobile responsiveness */}
      <footer className="md:hidden bg-[#0a0a0f] border-t border-white/10 px-4 py-2 flex justify-around items-center sticky bottom-0 z-40">
        {[
          { tab: "dashboard", label: "Home", icon: <BarChart2 className="w-5 h-5" /> },
          { tab: AIModule.IMAGE, label: "Image", icon: <ImageIcon className="w-5 h-5" /> },
          { tab: AIModule.ANIMATION, label: "Motion", icon: <Video className="w-5 h-5" /> },
          { tab: AIModule.SVG, label: "Vectors", icon: <Code className="w-5 h-5" /> },
          { tab: "settings", label: "Settings", icon: <Settings2 className="w-5 h-5" /> }
        ].map((item) => (
          <button
            key={item.tab}
            onClick={() => setCurrentTab(item.tab as any)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl text-[10px] font-semibold cursor-pointer ${
              currentTab === item.tab ? "text-blue-400" : "text-white/40 hover:text-white/60"
            }`}
          >
            {item.icon}
            <span className="mt-1">{item.label}</span>
          </button>
        ))}
      </footer>
    </div>
  );
}
