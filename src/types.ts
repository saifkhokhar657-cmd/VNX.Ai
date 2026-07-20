/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum AIModule {
  IMAGE = "image",
  ANIMATION = "animation",
  VIDEO = "video",
  SVG = "svg",
  CONVERTER = "converter",
  TEMPLATES = "templates",
  WALLET = "wallet",
  ADMIN = "admin"
}

export type LanguageCode = "en" | "ur" | "ar" | "hi";

export interface User {
  id: string;
  email: string;
  name: string;
  role: "user" | "admin";
  plan: "free" | "starter" | "pro" | "business";
  credits: number;
  coins: number;
  avatarUrl?: string;
  isLoggedIn: boolean;
  isGuest: boolean;
  firstName?: string;
  lastName?: string;
  username?: string;
  country?: string;
  language?: string;
  phone?: string;
  isEmailVerified?: boolean;
  profileCompleted?: boolean;
}

export interface GeneratedAsset {
  id: string;
  userId: string;
  module: AIModule;
  type: string; // e.g., "Text to Image", "Lottie JSON", "Intro Video"
  prompt: string;
  enhancedPrompt?: string;
  style?: string;
  aspectRatio?: string;
  duration?: number;
  url: string; // File URL or Data URL (base64 or procedural svg)
  svgCode?: string; // Optional raw SVG string
  timestamp: string;
  status: "pending" | "completed" | "failed";
  size?: string; // e.g. "1.2 MB", "256 KB"
  dimensions?: string; // e.g., "1024x1024"
}

export interface Transaction {
  id: string;
  type: "credit_buy" | "generation_cost" | "subscription" | "refund";
  amount: number; // e.g., +100 coins or -5 credits
  costUsd?: number;
  description: string;
  timestamp: string;
}

export interface AIProviderConfig {
  id: "gemini" | "openai" | "replicate";
  name: string;
  enabled: boolean;
  apiKeySet: boolean;
  status: "online" | "offline";
  priority: number;
}

export interface SystemMetrics {
  totalUsers: number;
  totalGenerations: number;
  activeSessions: number;
  serverLoad: number; // percentage
  billingTotal: number; // USD
  providerStatus: Record<string, string>;
}

export interface LanguageStrings {
  title: string;
  subtitle: string;
  dashboard: string;
  imageStudio: string;
  animationStudio: string;
  videoStudio: string;
  svgStudio: string;
  fileConverter: string;
  templates: string;
  wallet: string;
  adminPanel: string;
  generate: string;
  promptPlaceholder: string;
  freeLimitText: string;
  credits: string;
  coins: string;
  subscription: string;
  logout: string;
  login: string;
}
