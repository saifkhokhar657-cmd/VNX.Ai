/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion } from "motion/react";
import { 
  User as UserIcon, Globe, Languages, Mail, Phone, Sparkles, Check, 
  ShieldCheck, RefreshCw, AlertCircle, Coins, Award
} from "lucide-react";
import { User } from "../types";
import { updateUserProfileInFirebase } from "../lib/firebase";
import ProfilePictureUploader from "./ProfilePictureUploader";

interface AccountSettingsProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
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

export default function AccountSettings({ user, onUserUpdate }: AccountSettingsProps) {
  const [firstName, setFirstName] = useState(user.firstName || user.name.split(" ")[0] || "");
  const [lastName, setLastName] = useState(user.lastName || user.name.split(" ").slice(1).join(" ") || "");
  const [username, setUsername] = useState(user.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user.avatarUrl || "");
  const [country, setCountry] = useState(user.country || "United States");
  const [language, setLanguage] = useState(user.language || "English");
  const [phone, setPhone] = useState(user.phone || "");
  
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleAvatarSaved = async (newUrl: string) => {
    setAvatarUrl(newUrl);
    try {
      const updated = await updateUserProfileInFirebase(user.id, { avatarUrl: newUrl });
      onUserUpdate(updated);
      setMessage({ type: "success", text: "Profile picture synchronized successfully." });
    } catch (err: any) {
      setMessage({ type: "error", text: "Failed to update profile picture in database." });
    }
  };

  const handleSaveChanges = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage({ type: "", text: "" });

    if (!firstName.trim() || !lastName.trim() || !username.trim()) {
      setMessage({ type: "error", text: "Please fill in first name, last name, and username." });
      setIsSaving(false);
      return;
    }

    if (username.trim().length < 3) {
      setMessage({ type: "error", text: "Username must be at least 3 characters." });
      setIsSaving(false);
      return;
    }

    try {
      const dataToSave = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName} ${lastName}`.trim(),
        username: username.toLowerCase().replace(/[^a-z0-9_]/g, ""),
        country,
        language,
        phone: phone.trim() || undefined,
        profileCompleted: true
      };

      const updated = await updateUserProfileInFirebase(user.id, dataToSave);
      onUserUpdate(updated);
      setMessage({ type: "success", text: "Ecosystem identity successfully synchronized across nodes." });
    } catch (err: any) {
      setMessage({ type: "error", text: err.message || "An error occurred while saving." });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div id="account-settings-container" className="space-y-8 max-w-4xl mx-auto">
      {/* Settings Banner Header */}
      <div className="bg-[#0b0c14] border border-white/10 rounded-3xl p-6 relative overflow-hidden flex flex-col md:flex-row items-center gap-6 shadow-xl">
        <div className="absolute top-1/2 right-1/4 w-72 h-72 bg-blue-500/5 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/4 w-72 h-72 bg-purple-500/5 rounded-full blur-[90px] pointer-events-none" />

        {/* Real Dynamic Profile Picture Upload Area */}
        <div className="flex-shrink-0 z-10 flex flex-col items-center gap-2">
          <ProfilePictureUploader 
            userId={user.id} 
            currentAvatarUrl={avatarUrl || user.avatarUrl} 
            onSaved={handleAvatarSaved} 
          />
          <span className="text-[10px] text-white/40 font-mono font-bold uppercase tracking-widest mt-1">
            Active Identity Node
          </span>
        </div>

        {/* Account Details Quick Info */}
        <div className="text-center md:text-left space-y-1.5 flex-grow z-10">
          <div className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-blue-500/10 border border-blue-500/20 rounded-md text-[9px] font-mono font-bold text-blue-400 uppercase tracking-wider">
            <ShieldCheck className="w-3 h-3" /> Node Verified: User Applet
          </div>
          <h2 className="text-xl font-display font-black text-white tracking-tight">
            {user.name}
          </h2>
          <p className="text-xs text-white/50 font-mono">
            ID: <span className="text-purple-400 font-bold">{user.id.slice(0, 12)}...</span> • @{user.username || "unset"}
          </p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mt-3 pt-2 border-t border-white/5">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-yellow-400" />
              <span className="text-xs font-semibold text-white/80">Plan:</span>
              <span className="text-xs font-bold text-yellow-400 uppercase tracking-wider font-mono bg-yellow-400/5 border border-yellow-400/20 px-1.5 py-0.5 rounded-md">
                {user.plan}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Coins className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-semibold text-white/80">Credits:</span>
              <span className="text-xs font-bold text-purple-400 font-mono">
                {user.credits}
              </span>
            </div>
          </div>
        </div>
      </div>

      {message.text && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl flex items-center gap-3 text-xs border ${
            message.type === "success" 
              ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200" 
              : "bg-red-950/20 border-red-500/30 text-red-200"
          }`}
        >
          {message.type === "success" ? (
            <Check className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          )}
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSaveChanges} className="bg-[#0a0a0f] border border-white/10 rounded-3xl p-6 md:p-8 space-y-6">
        <h3 className="text-base font-display font-bold text-white border-b border-white/5 pb-3">
          Identity Profile Coordinates
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* First Name */}
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">First Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Saif"
                className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-white/20 outline-none transition"
              />
            </div>
          </div>

          {/* Last Name */}
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Last Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Khokhar"
                className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-white/20 outline-none transition"
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Unique Username</label>
            <div className="relative">
              <span className="absolute left-4 top-2.5 text-xs font-mono text-purple-400 font-bold">@</span>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="saif_creative"
                className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 rounded-xl py-2.5 pl-9 pr-4 text-xs text-white placeholder-white/20 font-mono outline-none transition"
              />
            </div>
            <p className="text-[9px] text-white/30 mt-1.5 font-mono">Only alphanumeric and underscores allowed.</p>
          </div>

          {/* Email (Read Only) */}
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Register Email Address (Immutable)</label>
            <div className="relative opacity-60">
              <Mail className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full bg-white/[0.01] border border-white/5 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white/50 font-mono outline-none cursor-not-allowed"
              />
            </div>
          </div>

          {/* Country */}
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Country / Region Node</label>
            <div className="relative">
              <Globe className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/10 focus:border-blue-500 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white outline-none transition cursor-pointer"
              >
                {COUNTRIES.map((c) => (
                  <option key={c} value={c} className="bg-[#030712]">{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Localization Language</label>
            <div className="relative">
              <Languages className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full bg-[#0a0a0f] border border-white/10 focus:border-blue-500 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white outline-none transition cursor-pointer"
              >
                {LANGUAGES.map((l) => (
                  <option key={l} value={l} className="bg-[#030712]">{l}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone (Optional) */}
          <div className="md:col-span-2">
            <label className="block text-[10px] font-bold text-white/40 uppercase tracking-wider mb-2">Mobile Contact (Optional)</label>
            <div className="relative">
              <Phone className="absolute left-3.5 top-3 w-4 h-4 text-white/30" />
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+1 555 0199"
                className="w-full bg-white/[0.02] border border-white/10 focus:border-blue-500 rounded-xl py-2.5 pl-11 pr-4 text-xs text-white placeholder-white/20 font-mono outline-none transition"
              />
            </div>
          </div>
        </div>

        {/* Save Controls */}
        <div className="flex justify-end pt-4 border-t border-white/5">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-xl text-xs shadow-lg shadow-blue-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
          >
            {isSaving ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Synchronizing Node...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                Synchronize Identity
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
