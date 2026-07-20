/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  LogIn, Mail, ShieldAlert, KeyRound, Sparkles, AlertCircle, 
  ArrowRight, ChevronRight, ChevronLeft, ShieldCheck, HelpCircle, UserPlus 
} from "lucide-react";
import { User } from "../types";
import { BRAND_ASSETS } from "../assets";
import { loginWithEmail, registerWithEmail, loginWithGoogle } from "../lib/firebase";

interface AuthModalProps {
  onLoginSuccess: (user: User) => void;
  onCancel?: () => void;
}

export default function AuthModal({ onLoginSuccess }: AuthModalProps) {
  // Navigation Steps: "splash" | "onboarding" | "auth"
  const [step, setStep] = useState<"splash" | "onboarding" | "auth">("splash");
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const [progress, setProgress] = useState(0);

  // Form Fields
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  // 2FA Security Demonstration Flow
  const [twoFactorStep, setTwoFactorStep] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState("");
  const [tempUser, setTempUser] = useState<User | null>(null);

  // Splash Screen Loading Bar Effect
  useEffect(() => {
    if (step === "splash") {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep("onboarding"), 400);
            return 100;
          }
          return prev + 4;
        });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [step]);

  const onboardingSlides = [
    {
      title: "VisionX Creative Sandboxes",
      subtitle: "Temporal Render Engines",
      desc: "Harness the power of premium text-to-image generators, dynamic animation studios, and real-time panoramic video synthesis.",
      image: BRAND_ASSETS.loginIllustration,
      accent: "from-blue-500/20 to-purple-500/20"
    },
    {
      title: "Real-Time Vector Precision",
      subtitle: "SVG Design Sandbox",
      desc: "Generate perfectly symmetrical custom shapes, design responsive illustrations, and export layered vector packages with instant hot reload.",
      image: BRAND_ASSETS.banner,
      accent: "from-purple-500/20 to-pink-500/20"
    },
    {
      title: "SoulVerse Unified Ecosystem",
      subtitle: "AI Gateway & Token Ledger",
      desc: "Synchronize multi-provider LLM gateways, purchase credit bundles, and track your active subscription tiers securely across decentralized nodes.",
      image: BRAND_ASSETS.emptyState,
      accent: "from-blue-500/20 to-indigo-500/20"
    }
  ];

  const handleNextSlide = () => {
    if (onboardingIndex < onboardingSlides.length - 1) {
      setOnboardingIndex((prev) => prev + 1);
    } else {
      setStep("auth");
    }
  };

  const handlePrevSlide = () => {
    if (onboardingIndex > 0) {
      setOnboardingIndex((prev) => prev - 1);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in all credentials.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      if (isSignUp) {
        const user = await registerWithEmail(email, password);
        localStorage.setItem("vx_active_user", JSON.stringify(user));
        onLoginSuccess(user as any);
      } else {
        const user = await loginWithEmail(email, password);
        localStorage.setItem("vx_active_user", JSON.stringify(user));
        onLoginSuccess(user as any);
      }
    } catch (err: any) {
      setError(err.message || "Authentication credentials failed.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!twoFactorCode) {
      setError("Please enter the 2FA security code.");
      return;
    }
    setError("");
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      if (tempUser) {
        onLoginSuccess(tempUser);
      }
    }, 1000);
  };

  const handleOAuth = async (provider: "Google" | "Apple") => {
    setIsLoading(true);
    setError("");
    try {
      if (provider === "Google") {
        const user = await loginWithGoogle();
        onLoginSuccess(user as any);
      } else {
        // Apple Sign-In Mock Architecture for future packaging
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess({
            id: "apple-user-99",
            email: "apple.user@visionx.ai",
            name: "Apple Creator",
            role: "user",
            plan: "pro",
            credits: 200,
            coins: 1000,
            isLoggedIn: true,
            isGuest: false,
            profileCompleted: false
          });
        }, 1000);
      }
    } catch (err: any) {
      setError(err.message || "Federated login failed.");
      setIsLoading(false);
    }
  };

  const handleGuestMode = () => {
    onLoginSuccess({
      id: "u-guest",
      email: "guest@visionx.ai",
      name: "Guest Creator",
      role: "user",
      plan: "free",
      credits: 5,
      coins: 50,
      isLoggedIn: true,
      isGuest: true,
      profileCompleted: true
    });
  };

  return (
    <div id="auth-root-container" className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712] overflow-hidden font-sans">
      {/* Universal Ambient Glowing Core */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-[120px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {/* STEP 1: SPLASH SCREEN */}
        {step === "splash" && (
          <motion.div
            key="splash-screen"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="flex flex-col items-center justify-center text-center p-6 z-10 w-full max-w-sm"
          >
            {/* Pulsing Crystal V Logo Container */}
            <motion.div 
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="relative w-28 h-28 mb-8 rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0f] p-1 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 animate-pulse" />
              <img 
                src={BRAND_ASSETS.logo} 
                alt="VisionX AI Logo" 
                className="w-full h-full object-cover rounded-2xl relative z-10"
                referrerPolicy="no-referrer"
              />
            </motion.div>

            {/* Title / Description */}
            <h2 className="text-3xl font-display font-black tracking-tight text-white mb-1">
              VISION<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">X</span> AI
            </h2>
            <p className="text-xs font-mono tracking-widest text-white/40 uppercase mb-8">
              Premium AI Creative Suite
            </p>

            {/* Loader Ingress */}
            <div className="w-48 bg-white/5 h-1.5 rounded-full overflow-hidden border border-white/5 relative mb-3">
              <motion.div 
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-[9px] font-mono tracking-wider text-white/30 uppercase animate-pulse">
              Initializing Core Sandboxes... {progress}%
            </span>
          </motion.div>
        )}

        {/* STEP 2: PREMIUM ONBOARDING SCREENS */}
        {step === "onboarding" && (
          <motion.div
            key="onboarding-screen"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-12 gap-8 p-6 md:p-10 z-10 items-center"
          >
            {/* Left Column: Widescreen Cinematic Image Showcase */}
            <div className="md:col-span-7 relative aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0f] flex items-center justify-center group">
              <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent z-10 opacity-70" />
              
              <AnimatePresence mode="wait">
                <motion.img
                  key={onboardingIndex}
                  src={onboardingSlides[onboardingIndex].image}
                  alt={onboardingSlides[onboardingIndex].title}
                  initial={{ opacity: 0, scale: 1.05 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </AnimatePresence>

              {/* Float Badge */}
              <span className="absolute top-4 left-4 z-20 py-1 px-3 bg-[#0a0a0f]/80 backdrop-blur-md border border-white/10 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider text-purple-400">
                {onboardingSlides[onboardingIndex].subtitle}
              </span>
            </div>

            {/* Right Column: Slide Text Details and Steppers */}
            <div className="md:col-span-5 flex flex-col justify-between h-full py-4 space-y-8">
              <div className="space-y-4">
                {/* Visual Indicators */}
                <div className="flex gap-1.5">
                  {onboardingSlides.map((_, idx) => (
                    <span 
                      key={idx}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        idx === onboardingIndex ? "w-6 bg-blue-500" : "w-1.5 bg-white/10"
                      }`}
                    />
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={onboardingIndex}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-3"
                  >
                    <h3 className="text-2xl font-display font-black text-white tracking-tight leading-none">
                      {onboardingSlides[onboardingIndex].title}
                    </h3>
                    <p className="text-xs text-white/50 leading-relaxed">
                      {onboardingSlides[onboardingIndex].desc}
                    </p>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Onboarding Controls */}
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => setStep("auth")}
                  className="text-xs font-semibold text-white/40 hover:text-white transition cursor-pointer"
                >
                  Skip
                </button>

                <div className="flex gap-2">
                  {onboardingIndex > 0 && (
                    <button
                      onClick={handlePrevSlide}
                      className="p-2.5 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 text-white transition cursor-pointer"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={handleNextSlide}
                    className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-xl text-xs font-bold text-white shadow-lg shadow-blue-500/10 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>{onboardingIndex === onboardingSlides.length - 1 ? "Enter Sandbox" : "Continue"}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 3: LOGIN / AUTH PORTAL */}
        {step === "auth" && (
          <motion.div
            key="auth-panel"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-md bg-gradient-to-b from-[#0e121e] to-[#04060b] border border-white/10 rounded-3xl p-8 shadow-2xl relative overflow-hidden z-10"
          >
            {/* Logo and Greeting */}
            <div className="text-center mb-6">
              <div className="inline-flex p-1 bg-white/5 border border-white/10 rounded-2xl shadow-lg mb-3 w-12 h-12 overflow-hidden">
                <img 
                  src={BRAND_ASSETS.logo} 
                  alt="VisionX Logo" 
                  className="w-full h-full object-cover rounded-xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="text-2xl font-display font-black tracking-tight text-white">VISION<span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400">X</span> AI</h2>
              <p className="text-[10px] font-mono tracking-widest text-white/30 uppercase mt-0.5">Premium Creative Suite Gateway</p>
            </div>

            {/* Tab Swapper for Login vs Sign Up */}
            {!twoFactorStep && !isForgotPassword && (
              <div className="grid grid-cols-2 bg-white/5 border border-white/5 p-1 rounded-xl mb-6">
                <button
                  type="button"
                  onClick={() => { setIsSignUp(false); setError(""); }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    !isSignUp ? "bg-blue-600 text-white shadow" : "text-white/50 hover:text-white"
                  }`}
                >
                  Sign In Gateway
                </button>
                <button
                  type="button"
                  onClick={() => { setIsSignUp(true); setError(""); }}
                  className={`py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                    isSignUp ? "bg-blue-600 text-white shadow" : "text-white/50 hover:text-white"
                  }`}
                >
                  Create Account
                </button>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl flex items-center gap-2 text-xs text-red-200">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {!twoFactorStep ? (
              <>
                {isForgotPassword ? (
                  <form onSubmit={(e) => { e.preventDefault(); alert("Reset password link emailed!"); setIsForgotPassword(false); }} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
                        <input
                          type="email"
                          required
                          placeholder="saifkhokhar657@gmail.com"
                          className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-white/20 outline-none transition"
                        />
                      </div>
                    </div>
                    <button
                      type="submit"
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      Send Password Reset Link <ArrowRight className="w-4 h-4" />
                    </button>
                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={() => setIsForgotPassword(false)}
                        className="text-[10px] font-semibold text-blue-400 hover:underline cursor-pointer"
                      >
                        Back to Auth Portal
                      </button>
                    </div>
                  </form>
                ) : (
                  <form onSubmit={handleAuthSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Email Address</label>
                      <div className="relative">
                        <Mail className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="saifkhokhar657@gmail.com"
                          className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-white/20 outline-none transition"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between items-center mb-1.5">
                        <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Password</label>
                        {!isSignUp && (
                          <button
                            type="button"
                            onClick={() => setIsForgotPassword(true)}
                            className="text-[10px] font-bold text-purple-400 hover:underline cursor-pointer"
                          >
                            Forgot password?
                          </button>
                        )}
                      </div>
                      <div className="relative">
                        <KeyRound className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
                        <input
                          type="password"
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-white/20 outline-none transition"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isLoading ? (
                        <span>Deploying Cloud Credentials...</span>
                      ) : isSignUp ? (
                        <span className="flex items-center gap-1.5">
                          <UserPlus className="w-4 h-4" /> Register Creative Profile
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5">
                          <LogIn className="w-4 h-4" /> Authorize System Access
                        </span>
                      )}
                    </button>

                    <div className="relative flex py-1 items-center">
                      <div className="flex-grow border-t border-white/5"></div>
                      <span className="flex-shrink mx-4 text-[9px] text-white/30 font-mono uppercase tracking-widest">or federated gateway</span>
                      <div className="flex-grow border-t border-white/5"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => handleOAuth("Google")}
                        className="flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs text-white font-semibold transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12.24 10.285V13.4h6.887C18.2 15.614 15.645 18 12.24 18c-3.86 0-7-3.14-7-7s3.14-7 7-7c1.7 0 3.3.6 4.6 1.7l2.42-2.42C17.185 1.514 14.88 1 12.24 1 6.58 1 2 5.58 2 11.24s4.58 10.24 10.24 10.24c5.795 0 10.24-4.065 10.24-10.24 0-.625-.05-1.22-.16-1.785H12.24z"/>
                        </svg>
                        Google Sync
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOAuth("Apple")}
                        className="flex items-center justify-center gap-2 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 rounded-xl text-xs text-white font-semibold transition-all cursor-pointer"
                      >
                        <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-.96.04-2.13.64-2.82 1.45-.6.69-1.12 1.84-.98 2.94.1.08.21.12.32.12.9 0 2-.6 2.49-1.45z"/>
                        </svg>
                        Apple ID
                      </button>
                    </div>

                    <div className="text-center pt-2">
                      <button
                        type="button"
                        onClick={handleGuestMode}
                        className="text-[10px] text-white/40 hover:text-white transition underline underline-offset-4 cursor-pointer font-sans"
                      >
                        Launch Guest Sandbox (No Account Required)
                      </button>
                    </div>
                  </form>
                )}
              </>
            ) : (
              <form onSubmit={handleVerify2FA} className="space-y-4">
                <div className="p-3 bg-blue-950/20 border border-blue-500/20 rounded-xl flex gap-2 text-xs text-blue-200">
                  <ShieldAlert className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-white">2FA Verification Code</p>
                    <p className="text-white/40 mt-0.5 text-[11px]">Enter the security code dispatched to your synchronized device key.</p>
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Security Code</label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={twoFactorCode}
                    onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ""))}
                    placeholder="000 000"
                    className="w-full text-center tracking-[1em] text-lg font-mono bg-white/[0.02] border border-white/10 focus:border-blue-500 rounded-xl py-3 text-white placeholder-white/20 outline-none transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer"
                >
                  {isLoading ? "Verifying Token..." : "Confirm Secure Identity"}
                </button>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => setTwoFactorStep(false)}
                    className="text-[10px] font-semibold text-white/40 hover:text-white cursor-pointer"
                  >
                    Back to Auth Portal
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
