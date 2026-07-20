/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  User as UserIcon, Globe, Languages, Mail, Phone, Sparkles, Check, 
  ArrowRight, ShieldCheck, Camera, CheckCircle2 
} from "lucide-react";
import { User } from "../types";
import { BRAND_ASSETS } from "../assets";
import { updateUserProfileInFirebase } from "../lib/firebase";
import ProfilePictureUploader from "./ProfilePictureUploader";

interface ProfileCompletionModalProps {
  user: User;
  onCompleted: (updatedUser: User) => void;
}

const COUNTRIES = [
  "United States", "United Kingdom", "Canada", "Australia", "Germany", 
  "Pakistan", "India", "United Arab Emirates", "Saudi Arabia", "Singapore", 
  "Japan", "France", "Brazil", "South Africa"
];

const LANGUAGES = [
  "English", "Urdu", "Spanish", "French", "German", 
  "Arabic", "Hindi", "Japanese", "Mandarin", "Portuguese"
];

const SAMPLE_AVATARS = [
  "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80",
  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80"
];

export default function ProfileCompletionModal({ user, onCompleted }: ProfileCompletionModalProps) {
  const [firstName, setFirstName] = useState(user.firstName || "");
  const [lastName, setLastName] = useState(user.lastName || "");
  const [username, setUsername] = useState(user.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || BRAND_ASSETS.guestAvatar);
  const [country, setCountry] = useState(user.country || "United States");
  const [language, setLanguage] = useState(user.language || "English");
  const [phone, setPhone] = useState(user.phone || "");
  const [isEmailVerified, setIsEmailVerified] = useState(user.isEmailVerified || false);
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  
  const [step, setStep] = useState(1); // Step 1: Basics & Avatar, Step 2: Location & Verification, Step 3: Optional Details
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleVerifyEmail = () => {
    setVerifyingEmail(true);
    setTimeout(() => {
      setIsEmailVerified(true);
      setVerifyingEmail(false);
    }, 1500);
  };

  const validateStep1 = () => {
    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      setError("Please fill in first name, last name, and username.");
      return false;
    }
    if (username.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return false;
    }
    setError("");
    return true;
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (validateStep1()) setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleSaveProfile = async () => {
    setIsLoading(true);
    setError("");
    try {
      const dataToSave = {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`.trim(),
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
        avatarUrl,
        country,
        language,
        phone: phone.trim() || undefined,
        isEmailVerified,
        profileCompleted: true
      };

      const updated = await updateUserProfileInFirebase(user.id, dataToSave);
      onCompleted(updated);
    } catch (err: any) {
      setError(err.message || "An error occurred while saving your profile.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="profile-modal-root" className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/95 backdrop-blur-xl p-4 overflow-y-auto">
      {/* Dynamic Background Orbs */}
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-80 h-80 bg-purple-600/5 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-lg bg-gradient-to-b from-[#0e121e] to-[#04060b] border border-white/10 rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Banner/Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-1.5 py-1 px-3 bg-white/5 border border-white/10 rounded-full text-[9px] font-mono font-bold uppercase tracking-widest text-purple-400 mb-3">
            <Sparkles className="w-3 h-3 text-purple-400" /> Secure Profile Synchronization
          </div>
          <h2 className="text-xl md:text-2xl font-display font-black text-white tracking-tight">
            Complete Your VisionX Identity
          </h2>
          <p className="text-xs text-white/40 mt-1 max-w-sm mx-auto leading-relaxed">
            Synchronize your personal creative node profile across our global server cluster.
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-950/40 border border-red-500/30 rounded-xl text-xs text-red-200">
            {error}
          </div>
        )}

        {/* Wizard Steps indicator */}
        <div className="flex justify-between items-center mb-8 bg-white/[0.02] border border-white/5 rounded-2xl p-2.5 max-w-xs mx-auto">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center gap-2">
              <span className={`w-6 h-6 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center transition ${
                step === num 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : step > num ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-400" : "bg-white/5 border border-white/5 text-white/30"
              }`}>
                {step > num ? <Check className="w-3 h-3" /> : num}
              </span>
              {num < 3 && <div className={`w-6 h-0.5 rounded-full ${step > num ? "bg-emerald-500/30" : "bg-white/5"}`} />}
            </div>
          ))}
        </div>

        {/* STEP 1: BASICS & AVATAR SELECTION */}
        {step === 1 && (
          <div className="space-y-5">
            {/* Interactive Profile Photo Selection */}
            <div className="flex flex-col items-center gap-2">
              <label className="block text-[10px] font-mono font-bold text-white/40 uppercase tracking-widest mb-1">Set Profile Node Avatar</label>
              <ProfilePictureUploader
                userId={user.id}
                currentAvatarUrl={avatarUrl}
                onSaved={(newUrl) => setAvatarUrl(newUrl)}
              />
            </div>

            {/* First Name & Last Name */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">First Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    required
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Saif"
                    className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-white/20 outline-none transition"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Last Name</label>
                <div className="relative">
                  <UserIcon className="absolute left-3 top-2.5 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    required
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Khokhar"
                    className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-white/20 outline-none transition"
                  />
                </div>
              </div>
            </div>

            {/* Username */}
            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Unique Username</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2 text-xs font-mono text-purple-400 font-bold">@</span>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                  placeholder="saif_creative"
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 rounded-xl py-2 pl-8 pr-4 text-xs text-white placeholder-white/20 outline-none font-mono transition"
                />
              </div>
              <p className="text-[9px] text-white/30 mt-1 font-mono">Allowed: letters, numbers, and underscores.</p>
            </div>

            {/* Control */}
            <button
              onClick={handleNextStep}
              className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            >
              <span>Verify Core Coordinates</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: LOCATION & EMAIL VERIFICATION */}
        {step === 2 && (
          <div className="space-y-5">
            {/* Country Selector */}
            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Country / Region Node</label>
              <div className="relative">
                <Globe className="absolute left-3.5 top-2.5 w-4 h-4 text-white/30" />
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-white/10 focus:border-blue-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none transition cursor-pointer"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c} value={c} className="bg-[#030712]">{c}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Language Selector */}
            <div>
              <label className="block text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1.5">Primary Localization Language</label>
              <div className="relative">
                <Languages className="absolute left-3.5 top-2.5 w-4 h-4 text-white/30" />
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full bg-[#0a0a0f] border border-white/10 focus:border-blue-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white outline-none transition cursor-pointer"
                >
                  {LANGUAGES.map((l) => (
                    <option key={l} value={l} className="bg-[#030712]">{l}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Email Verification Component */}
            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-semibold text-white">Email Verification</span>
                </div>
                {isEmailVerified ? (
                  <span className="py-0.5 px-2 bg-emerald-500/10 border border-emerald-500/20 rounded-md text-[9px] font-bold text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle2 className="w-2.5 h-2.5" /> SECURE
                  </span>
                ) : (
                  <span className="py-0.5 px-2 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-[9px] font-bold text-yellow-400 font-mono">
                    PENDING
                  </span>
                )}
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed">
                Registered Email: <span className="text-white font-mono">{user.email}</span>. Please verify your identity to enable decentralized cloud hosting access.
              </p>
              {!isEmailVerified && (
                <button
                  type="button"
                  onClick={handleVerifyEmail}
                  disabled={verifyingEmail}
                  className="py-1.5 px-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  {verifyingEmail ? "Transmitting code..." : "Transmit Verification Code"}
                </button>
              )}
            </div>

            {/* Controls */}
            <div className="grid grid-cols-12 gap-3 pt-2">
              <button
                onClick={() => setStep(1)}
                className="col-span-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleNextStep}
                className="col-span-8 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Continue Configuration</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: OPTIONAL DETAILS & SYSTEM ENROLLMENT */}
        {step === 3 && (
          <div className="space-y-5">
            {/* Phone Number (Optional) */}
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-[10px] font-semibold text-white/40 uppercase tracking-wider">Mobile Contact (Optional)</label>
                <span className="text-[9px] font-mono text-white/30 uppercase">Can be skipped</span>
              </div>
              <div className="relative">
                <Phone className="absolute left-3.5 top-2.5 w-4 h-4 text-white/30" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 555 0199"
                  className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-white/20 outline-none font-mono transition"
                />
              </div>
              <p className="text-[9px] text-white/30 mt-1 font-mono">Used only for direct multi-factor security verification tunnels.</p>
            </div>

            {/* Ecosystem Confirmation Badge */}
            <div className="p-4 bg-blue-950/10 border border-blue-500/10 rounded-2xl flex gap-3 text-xs text-blue-200">
              <ShieldCheck className="w-5 h-5 text-blue-400 flex-shrink-0" />
              <div>
                <p className="font-semibold text-white">VisionX Active Enrollment</p>
                <p className="text-white/40 text-[10px] mt-0.5 leading-relaxed">
                  By finalizing your decentralized sandbox setup, you agree to secure creative telemetry encryption. 
                </p>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-12 gap-3 pt-2">
              <button
                onClick={() => setStep(2)}
                className="col-span-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Back
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={isLoading}
                className="col-span-8 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>{isLoading ? "Synchronizing Node..." : "Finalize Setup"}</span>
                <Check className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
