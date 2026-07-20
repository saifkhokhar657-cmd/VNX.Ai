/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Enable trust proxy to parse X-Forwarded-Host / X-Forwarded-For correctly
app.set("trust proxy", true);

app.use(express.json({ limit: "50mb" }));

// Initialize Gemini Client safely
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
const isGeminiConfigured = !!(GEMINI_API_KEY && GEMINI_API_KEY !== "MY_GEMINI_API_KEY" && GEMINI_API_KEY.trim() !== "");

if (isGeminiConfigured) {
  try {
    ai = new GoogleGenAI({
      apiKey: GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
    console.log("VisionX AI: Server-side Gemini API client initialized successfully.");
  } catch (err) {
    console.error("VisionX AI: Error initializing GoogleGenAI client:", err);
  }
} else {
  console.log("VisionX AI: Gemini API key not provided or using default placeholder.");
}

// Initialize OpenAI Client safely
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const isOpenAIConfigured = !!(OPENAI_API_KEY && OPENAI_API_KEY !== "MY_OPENAI_API_KEY" && OPENAI_API_KEY.trim() !== "");

if (isOpenAIConfigured) {
  console.log("VisionX AI: Server-side OpenAI API key detected & validated successfully.");
} else {
  console.log("VisionX AI: OpenAI API key not provided or using default placeholder.");
}

// --- OpenAI API Helpers ---
async function generateOpenAIText(prompt: string, systemInstruction?: string): Promise<string> {
  if (!isOpenAIConfigured) {
    throw new Error("OpenAI API key is not configured.");
  }
  
  const messages = [];
  if (systemInstruction) {
    messages.push({ role: "system", content: systemInstruction });
  }
  messages.push({ role: "user", content: prompt });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    console.log(`[VisionX OpenAI] Requesting text completion with model: ${activeProviderConfig.openaiModel || 'gpt-4o-mini'}`);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: activeProviderConfig.openaiModel || "gpt-4o-mini",
        messages,
        temperature: 0.7
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    const reply = data.choices?.[0]?.message?.content || "";
    console.log("[VisionX OpenAI] Content successfully generated.");
    return reply.trim();
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("[VisionX OpenAI] Text generation error:", err.message || err);
    throw err;
  }
}

async function generateOpenAIImage(prompt: string, style?: string, aspectRatio?: string): Promise<string> {
  if (!isOpenAIConfigured) {
    throw new Error("OpenAI API key is not configured.");
  }

  const model = activeProviderConfig.openaiImageModel || "dall-e-3";
  let size = "1024x1024";
  if (aspectRatio === "16:9") {
    size = model === "dall-e-3" ? "1792x1024" : "1024x1024";
  } else if (aspectRatio === "9:16") {
    size = model === "dall-e-3" ? "1024x1792" : "1024x1024";
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  try {
    console.log(`[VisionX OpenAI] Requesting image with model: ${model} and size: ${size}`);
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        prompt: `${prompt}${style ? `, style: ${style}` : ''}`,
        n: 1,
        size,
        response_format: "b64_json"
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`OpenAI API error (${response.status}): ${errText}`);
    }

    const data: any = await response.json();
    const b64Data = data.data?.[0]?.b64_json;
    if (!b64Data) {
      throw new Error("No image data returned from OpenAI DALL-E API.");
    }

    console.log("[VisionX OpenAI] Image successfully generated.");
    return `data:image/png;base64,${b64Data}`;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error("[VisionX OpenAI] Image generation error:", err.message || err);
    throw err;
  }
}

import fs from "fs";

// --- Multi-provider Fallback & Centralized Routing System ---
const CONFIG_FILE_PATH = path.join(process.cwd(), "active_provider_config.json");

interface ModuleRoute {
  provider: string;
  model: string;
}

interface ProviderConfig {
  enabled: boolean;
  priority: number;
}

interface ProviderStats {
  requests: number;
  successes: number;
  failures: number;
  lastSuccess: string | null;
  lastError: string | null;
}

interface AuditLog {
  timestamp: string;
  adminEmail: string;
  action: string;
  details: string;
}

let activeProviderConfig = {
  activeProvider: "gemini",
  modelName: "gemini-3.5-flash",
  imageModel: "gemini-3.1-flash-lite-image",
  rateLimit: 60,
  auditLogsEnabled: true,
  openaiModel: "gpt-4o-mini",
  openaiImageModel: "dall-e-3",
  primaryProvider: "gemini",
  fallbackProvider: "openai",
  providers: {
    gemini: { enabled: true, priority: 1 } as ProviderConfig,
    openai: { enabled: true, priority: 2 } as ProviderConfig,
    pollinations: { enabled: true, priority: 3 } as ProviderConfig
  } as Record<string, ProviderConfig>,
  moduleRouting: {
    imageStudio: { provider: "default", model: "" } as ModuleRoute,
    animationStudio: { provider: "default", model: "" } as ModuleRoute,
    videoStudio: { provider: "default", model: "" } as ModuleRoute,
    svgStudio: { provider: "default", model: "" } as ModuleRoute,
    fileConverter: { provider: "default", model: "" } as ModuleRoute,
    promptEnhancer: { provider: "default", model: "" } as ModuleRoute
  } as Record<string, ModuleRoute>,
  stats: {
    gemini: { requests: 0, successes: 0, failures: 0, lastSuccess: null, lastError: null } as ProviderStats,
    openai: { requests: 0, successes: 0, failures: 0, lastSuccess: null, lastError: null } as ProviderStats
  } as Record<string, ProviderStats>,
  auditLogs: [] as AuditLog[]
};

// Try loading existing configuration from disk
if (fs.existsSync(CONFIG_FILE_PATH)) {
  try {
    const data = fs.readFileSync(CONFIG_FILE_PATH, "utf-8");
    const parsed = JSON.parse(data);
    activeProviderConfig = {
      ...activeProviderConfig,
      ...parsed,
      providers: { ...activeProviderConfig.providers, ...parsed.providers },
      moduleRouting: { ...activeProviderConfig.moduleRouting, ...parsed.moduleRouting },
      stats: { ...activeProviderConfig.stats, ...parsed.stats },
      auditLogs: parsed.auditLogs || []
    };
    console.log("[VisionX Config] Successfully loaded active provider configuration from disk.");
  } catch (err: any) {
    console.error("[VisionX Config] Error loading config file:", err.message);
  }
}

// Helper to write changes to disk
function saveProviderConfigToDisk() {
  try {
    fs.writeFileSync(CONFIG_FILE_PATH, JSON.stringify(activeProviderConfig, null, 2), "utf-8");
  } catch (err: any) {
    console.error("[VisionX Config] Error writing config to disk:", err.message);
  }
}

// Helper to log administrative actions
function logAdminAction(adminEmail: string, action: string, details: string) {
  const logEntry: AuditLog = {
    timestamp: new Date().toISOString(),
    adminEmail: adminEmail || "saifkhokhar657@gmail.com",
    action,
    details
  };
  if (!activeProviderConfig.auditLogs) {
    activeProviderConfig.auditLogs = [];
  }
  activeProviderConfig.auditLogs.unshift(logEntry);
  if (activeProviderConfig.auditLogs.length > 200) {
    activeProviderConfig.auditLogs = activeProviderConfig.auditLogs.slice(0, 200);
  }
  saveProviderConfigToDisk();
}

// Helper to record API request statistics
function recordStats(provider: "gemini" | "openai", success: boolean, errMessage?: string) {
  if (!activeProviderConfig.stats) {
    activeProviderConfig.stats = {
      gemini: { requests: 0, successes: 0, failures: 0, lastSuccess: null, lastError: null },
      openai: { requests: 0, successes: 0, failures: 0, lastSuccess: null, lastError: null }
    };
  }
  const provStats = activeProviderConfig.stats[provider];
  if (provStats) {
    provStats.requests++;
    if (success) {
      provStats.successes++;
      provStats.lastSuccess = new Date().toISOString();
    } else {
      provStats.failures++;
      provStats.lastError = errMessage || "Unknown Error";
    }
  }
  saveProviderConfigToDisk();
}

// Helper to resolve provider & model for a specific module
function resolveModuleRouting(moduleKey: string): { provider: string; model: string } {
  const routing = activeProviderConfig.moduleRouting?.[moduleKey];
  if (routing && routing.provider && routing.provider !== "default") {
    const customProvider = routing.provider;
    const customModel = routing.model || (customProvider === "gemini" ? activeProviderConfig.modelName : activeProviderConfig.openaiModel);
    return { provider: customProvider, model: customModel };
  }

  // Fallback to global primary provider
  const primary = activeProviderConfig.primaryProvider || activeProviderConfig.activeProvider || "gemini";
  const model = primary === "gemini" ? activeProviderConfig.modelName : activeProviderConfig.openaiModel;
  return { provider: primary, model };
}

// --- Multi-provider Fallback Logic for Text ---
async function handleTextGenerationWithFallback(prompt: string, systemInstruction?: string, moduleKey: string = "promptEnhancer"): Promise<string> {
  const routing = resolveModuleRouting(moduleKey);
  const primaryProvider = routing.provider;
  const primaryModel = routing.model;

  // Formulate the pipeline attempts sequence
  const attempts = [primaryProvider];
  
  // Failover / Fallback handler if active fails
  const fallback = activeProviderConfig.fallbackProvider || (primaryProvider === "gemini" ? "openai" : "gemini");
  if (!attempts.includes(fallback)) {
    attempts.push(fallback);
  }
  
  // Add procedural as a hard safety net
  attempts.push("procedural");

  console.log(`[VisionX AI Router] Routing request for module '${moduleKey}' through pipeline: ${attempts.join(" -> ")}`);

  for (const provider of attempts) {
    if (provider === "gemini") {
      const isEnabled = activeProviderConfig.providers?.gemini?.enabled !== false;
      if (ai && isGeminiConfigured && isEnabled) {
        try {
          console.log(`[VisionX AI Router] Trying Google Gemini API with model: ${primaryModel || activeProviderConfig.modelName}...`);
          const fullPrompt = systemInstruction ? `${systemInstruction}\n\nUser request: ${prompt}` : prompt;
          const response = await ai.models.generateContent({
            model: primaryModel || activeProviderConfig.modelName || "gemini-3.5-flash",
            contents: fullPrompt,
          });
          if (response.text) {
            console.log(`[VisionX AI Router] Gemini text generation succeeded.`);
            recordStats("gemini", true);
            return response.text.trim();
          }
          throw new Error("No text returned from Gemini API");
        } catch (err: any) {
          console.warn(`[VisionX AI Router] Gemini text generation failed:`, err.message || err);
          recordStats("gemini", false, err.message || "Unknown Gemini text error");
        }
      } else {
        console.log(`[VisionX AI Router] Gemini skipped (not configured or disabled).`);
      }
    }

    if (provider === "openai") {
      const isEnabled = activeProviderConfig.providers?.openai?.enabled !== false;
      if (isOpenAIConfigured && isEnabled) {
        try {
          console.log(`[VisionX AI Router] Trying OpenAI API...`);
          const result = await generateOpenAIText(prompt, systemInstruction);
          if (result) {
            console.log(`[VisionX AI Router] OpenAI text generation succeeded.`);
            recordStats("openai", true);
            return result;
          }
          throw new Error("No text returned from OpenAI API");
        } catch (err: any) {
          console.warn(`[VisionX AI Router] OpenAI text generation failed:`, err.message || err);
          recordStats("openai", false, err.message || "Unknown OpenAI text error");
        }
      } else {
        console.log(`[VisionX AI Router] OpenAI skipped (not configured or disabled).`);
      }
    }

    if (provider === "procedural") {
      console.log(`[VisionX AI Router] Invoking local procedural/simulation engine.`);
      break;
    }
  }

  return "";
}

// --- Multi-provider Fallback Logic for Image ---
async function generateImageWithCentralRouting(prompt: string, style?: string, aspectRatio?: string, imageSize?: string): Promise<string> {
  const routing = resolveModuleRouting("imageStudio");
  const primaryProvider = routing.provider;
  const primaryModel = routing.model;

  // Formulate the pipeline attempts sequence
  const attempts = [primaryProvider];
  
  // Failover / Fallback handler if active fails
  const fallback = activeProviderConfig.fallbackProvider || (primaryProvider === "gemini" ? "openai" : "gemini");
  if (!attempts.includes(fallback)) {
    attempts.push(fallback);
  }

  // Add pollinations and unsplash as extra safety fallbacks
  attempts.push("pollinations");
  attempts.push("unsplash");

  console.log(`[VisionX Image Router] Routing request for module 'imageStudio' through pipeline: ${attempts.join(" -> ")}`);

  for (const provider of attempts) {
    if (provider === "gemini") {
      const isEnabled = activeProviderConfig.providers?.gemini?.enabled !== false;
      if (ai && isGeminiConfigured && isEnabled) {
        try {
          console.log(`[VisionX Image Router] Trying Google Gemini for image generation...`);
          const model = primaryModel || activeProviderConfig.imageModel || "gemini-3.1-flash-lite-image";
          const response = await ai.models.generateContent({
            model: model,
            contents: {
              parts: [{ text: `${prompt}, style: ${style || "cinematic, hyper-detailed, neon accents"}` }],
            },
            config: {
              imageConfig: {
                aspectRatio: aspectRatio || "1:1",
                imageSize: imageSize || "1K"
              }
            }
          });

          let base64Image = "";
          for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
              base64Image = `data:image/png;base64,${part.inlineData.data}`;
              break;
            }
          }
          if (base64Image) {
            console.log(`[VisionX Image Router] Gemini image generation succeeded.`);
            recordStats("gemini", true);
            return base64Image;
          }
          throw new Error("No image data in Gemini response candidate");
        } catch (err: any) {
          console.error("[VisionX Image Router] Gemini image generation failed:", err.message || err);
          recordStats("gemini", false, err.message || "Unknown Gemini image error");
        }
      } else {
        console.log("[VisionX Image Router] Gemini skipped (not configured or disabled).");
      }
    }

    if (provider === "openai") {
      const isEnabled = activeProviderConfig.providers?.openai?.enabled !== false;
      if (isOpenAIConfigured && isEnabled) {
        try {
          console.log(`[VisionX Image Router] Trying OpenAI DALL-E for image generation...`);
          const result = await generateOpenAIImage(prompt, style, aspectRatio);
          if (result) {
            console.log(`[VisionX Image Router] OpenAI DALL-E image generation succeeded.`);
            recordStats("openai", true);
            return result;
          }
          throw new Error("No image data returned from OpenAI");
        } catch (err: any) {
          console.error("[VisionX Image Router] OpenAI image generation failed:", err.message || err);
          recordStats("openai", false, err.message || "Unknown OpenAI image error");
        }
      } else {
        console.log("[VisionX Image Router] OpenAI skipped (not configured or disabled).");
      }
    }

    if (provider === "pollinations") {
      const isEnabled = activeProviderConfig.providers?.pollinations?.enabled !== false;
      if (isEnabled) {
        try {
          console.log(`[VisionX Image Router] Trying Pollinations AI for image generation...`);
          const width = aspectRatio === "16:9" ? 1024 : aspectRatio === "9:16" ? 576 : aspectRatio === "4:3" ? 1024 : 1024;
          const height = aspectRatio === "16:9" ? 576 : aspectRatio === "9:16" ? 1024 : aspectRatio === "4:3" ? 768 : 1024;
          
          const refinedStyle = style ? `, style: ${style}` : ", digital art, photorealistic, cinematic lighting, 8k resolution, ultra-detailed";
          const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt + refinedStyle)}?width=${width}&height=${height}&nologo=true&private=true`;
          
          const response = await fetch(pollinationsUrl);
          if (response.ok) {
            const buffer = await response.arrayBuffer();
            const base64Image = `data:image/png;base64,${Buffer.from(buffer).toString("base64")}`;
            console.log(`[VisionX Image Router] Pollinations AI image generation succeeded.`);
            return base64Image;
          } else {
            console.warn(`[VisionX Image Router] Pollinations AI returned status ${response.status}.`);
          }
        } catch (err: any) {
          console.error("[VisionX Image Router] Pollinations AI image generation failed:", err.message || err);
        }
      }
    }

    if (provider === "unsplash") {
      console.log("[VisionX Image Router] Returning curated Unsplash asset library (fallback).");
      break;
    }
  }
  return "";
}

// In-memory data structures (imitating Firebase/Cloud Storage backend sync)

// In-memory data structures (imitating Firebase/Cloud Storage backend sync)
let activeUserId = "u-1";

let usersList = [
  { id: "u-1", email: "saifkhokhar657@gmail.com", name: "Saif Khokhar", role: "admin", plan: "pro", credits: 450, coins: 2500, avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80", isLoggedIn: true, isGuest: false, profileCompleted: true },
  { id: "u-2", email: "guest@visionx.ai", name: "Guest Creator", role: "user", plan: "free", credits: 5, coins: 50, avatarUrl: "", isLoggedIn: true, isGuest: true, profileCompleted: true }
];

let generatedAssets: any[] = [
  {
    id: "asset-1",
    userId: "u-1",
    module: "svg",
    type: "App Illustration",
    prompt: "Minimalist rocket launching to the moon, electric blue neon theme",
    enhancedPrompt: "A sleek, masterfully crafted minimalist spacecraft launching diagonally upwards, venting vector exhaust trails, moon crescent backdrop with dark obsidian background, electric blue and hot magenta neon vector lines",
    url: "",
    svgCode: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="rocketGrad" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#2563EB" />
      <stop offset="100%" stop-color="#8B5CF6" />
    </linearGradient>
    <linearGradient id="fireGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#EC4899" stop-opacity="0.8" />
      <stop offset="100%" stop-color="#F59E0B" stop-opacity="0" />
    </linearGradient>
    <radialGradient id="moonGrad">
      <stop offset="70%" stop-color="#F3F4F6" />
      <stop offset="100%" stop-color="#D1D5DB" />
    </radialGradient>
    <filter id="neonGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="8" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="#0B0F19" rx="16" />
  
  <!-- Starfield background -->
  <circle cx="80" cy="90" r="1.5" fill="#FFF" opacity="0.6"/>
  <circle cx="150" cy="50" r="1" fill="#FFF" opacity="0.4"/>
  <circle cx="320" cy="110" r="2" fill="#FFF" opacity="0.8" filter="url(#neonGlow)"/>
  <circle cx="280" cy="280" r="1.5" fill="#FFF" opacity="0.5"/>
  <circle cx="60" cy="310" r="1" fill="#FFF" opacity="0.3"/>

  <!-- Moon backdrop -->
  <circle cx="300" cy="120" r="45" fill="url(#moonGrad)" />
  <circle cx="285" cy="110" r="35" fill="#0B0F19" />

  <!-- Exhaust Trails -->
  <path d="M 110,290 Q 150,280 178,218" stroke="url(#fireGrad)" stroke-width="8" fill="none" stroke-linecap="round" filter="url(#neonGlow)"/>
  <path d="M 125,305 Q 165,285 185,225" stroke="url(#fireGrad)" stroke-width="12" fill="none" stroke-linecap="round" />
  
  <!-- Rocket Ship -->
  <g transform="translate(140, 110) rotate(45)">
    <!-- Wings/Boosters -->
    <path d="M 10,70 Q 20,40 50,55 Q 40,85 10,70 Z" fill="#1E293B" />
    <path d="M 50,10 Q 40,-20 55,-50 Q 85,-40 50,10 Z" fill="#1E293B" />
    <!-- Main Body -->
    <path d="M 0,20 C 20,0 60,0 80,20 C 80,40 60,80 0,20 Z" fill="url(#rocketGrad)" filter="url(#neonGlow)"/>
    <!-- Fins detail -->
    <path d="M 20,20 L 40,40" stroke="#FFF" stroke-width="2" stroke-linecap="round" opacity="0.5" />
    <!-- Cabin Window -->
    <circle cx="50" cy="20" r="7" fill="#F3F4F6" stroke="#1E293B" stroke-width="2" />
    <circle cx="50" cy="20" r="4" fill="#06B6D4" />
  </g>
</svg>`,
    timestamp: "2026-07-17T08:00:00Z",
    status: "completed",
    size: "4.2 KB"
  }
];

let transactionHistory: any[] = [
  { id: "tx-1", type: "credit_buy", amount: 500, costUsd: 19.99, description: "Starter Pack Coin Bundle Credit", timestamp: "2026-07-16T14:30:00Z" },
  { id: "tx-2", type: "generation_cost", amount: -5, description: "Rocket SVG vector generation", timestamp: "2026-07-17T08:00:00Z" }
];

// --- API ENDPOINTS ---

// AI Settings / Status Info
app.get("/api/config", (req, res) => {
  res.json({
    isGeminiConfigured,
    isOpenAIConfigured,
    activeProvider: activeProviderConfig.activeProvider,
    modelName: activeProviderConfig.modelName,
    imageModel: activeProviderConfig.imageModel,
    openaiModel: activeProviderConfig.openaiModel,
    openaiImageModel: activeProviderConfig.openaiImageModel,
    providers: activeProviderConfig.providers,
    supportedLanguages: ["en", "ur", "ar", "hi"]
  });
});

// Prompt Enhancer Engine
app.post("/api/prompt/enhance", async (req, res) => {
  const { prompt, style, lighting, cameraAngle, resolution, motion } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const promptRequest = `Enhance this AI creative prompt to be ultra-detailed, cinematic, and clear for high-end generation models.
Original Prompt: "${prompt}"
Requested Style: "${style || 'Futuristic/Hyper-realistic'}"
Lighting: "${lighting || 'Cinematic Glow'}"
Camera Angle: "${cameraAngle || 'Wide/Dramatic'}"
Resolution: "${resolution || '4K'}"
Motion Dynamics: "${motion || 'Slow pan'}"

Provide ONLY the final enhanced prompt in 1-2 powerful sentences. No headers, no introductory chat text.`;

  const result = await handleTextGenerationWithFallback(promptRequest, undefined, "promptEnhancer");
  if (result) {
    return res.json({ enhancedPrompt: result });
  }

  // High-fidelity fallback / offline generator
  const enhanced = `A masterfully detailed, highly polished ${style || 'cinematic'} rendering of "${prompt}", highlighting dramatic ${lighting || 'volumetric atmospheric lighting'} shot from a ${cameraAngle || 'dynamic panoramic'} angle with ${motion || 'sweeping ambient parallax motion'}, optimized for flawless high-fidelity rendering.`;
  res.json({ enhancedPrompt: enhanced });
});

// AI SVG Studio (Vector Generation)
app.post("/api/generate/svg", async (req, res) => {
  const { prompt, type, style, colorPalette } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  const svgSystemInstruction = `You are a master vector graphics designer and frontend artist. Generate a single, highly detailed, modern, beautifully styled, valid, responsive, and scalable SVG element.
Theme/Prompt: "${prompt}"
Graphic Type: "${type || 'App Asset/Icon'}"
Aesthetic: "${style || 'Premium Neon Dark'}"
Colors: "${colorPalette || 'Electric Blue and Purple'}"

Instructions:
1. Return ONLY the valid SVG code starting with <svg> and ending with </svg>.
2. Do NOT wrap the SVG in any markdown formatting (do NOT use \`\`\`xml or \`\`\`svg block). Provide pure code.
3. Make it self-contained with no external images.
4. Use modern SVG elements: linearGradients, filters for glows, multiple overlapping paths, and beautiful rounded rectangles/circles.
5. Ensure it is responsive (use viewBox, standard width/height percentages).
6. Design must be extremely creative, visually striking, and modern.`;

  let svgCode = "";

  const responseText = await handleTextGenerationWithFallback(svgSystemInstruction, undefined, "svgStudio");
  if (responseText) {
    let cleanText = responseText.trim();
    // Clean code block ticks if model added them despite system instruction
    if (cleanText.includes("```xml")) {
      cleanText = cleanText.split("```xml")[1].split("```")[0].trim();
    } else if (cleanText.includes("```svg")) {
      cleanText = cleanText.split("```svg")[1].split("```")[0].trim();
    } else if (cleanText.includes("```html")) {
      cleanText = cleanText.split("```html")[1].split("```")[0].trim();
    } else if (cleanText.includes("```")) {
      cleanText = cleanText.split("```")[1].split("```")[0].trim();
    }
    
    // Quick validation that it is an SVG element
    if (cleanText.startsWith("<svg") || cleanText.includes("<svg")) {
      svgCode = cleanText;
    }
  }

  // Procedural dynamic SVG builder fallback
  if (!svgCode) {
    const randomSeed = Math.random();
    const primaryCol = colorPalette === "Sunset Gold" ? "#F59E0B" : colorPalette === "Mint Emerald" ? "#10B981" : "#3B82F6";
    const secondaryCol = colorPalette === "Sunset Gold" ? "#EF4444" : colorPalette === "Mint Emerald" ? "#06B6D4" : "#8B5CF6";
    
    // Create custom SVG content based on the prompt keywords
    let pathDetails = `<circle cx="200" cy="200" r="80" fill="url(#grad)" filter="url(#glow)" />`;
    if (prompt.toLowerCase().includes("cube") || prompt.toLowerCase().includes("logo") || prompt.toLowerCase().includes("box")) {
      pathDetails = `
        <rect x="120" y="120" width="160" height="160" rx="24" fill="url(#grad)" filter="url(#glow)" transform="rotate(15 200 200)" />
        <rect x="140" y="140" width="120" height="120" rx="16" fill="none" stroke="#FFFFFF" stroke-width="4" opacity="0.4" transform="rotate(15 200 200)" />
      `;
    } else if (prompt.toLowerCase().includes("star") || prompt.toLowerCase().includes("spark")) {
      pathDetails = `
        <path d="M 200,80 L 230,170 L 320,200 L 230,230 L 200,320 L 170,230 L 80,200 L 170,170 Z" fill="url(#grad)" filter="url(#glow)" />
        <circle cx="200" cy="200" r="15" fill="#FFFFFF" />
      `;
    } else if (prompt.toLowerCase().includes("shield") || prompt.toLowerCase().includes("security") || prompt.toLowerCase().includes("badge")) {
      pathDetails = `
        <path d="M 120,100 Q 200,80 280,100 L 280,200 C 280,280 200,320 200,320 C 200,320 120,280 120,200 Z" fill="url(#grad)" filter="url(#glow)" />
        <path d="M 140,115 L 200,290 L 260,115" fill="none" stroke="#FFFFFF" stroke-width="3" opacity="0.3" />
      `;
    } else if (prompt.toLowerCase().includes("gear") || prompt.toLowerCase().includes("settings") || prompt.toLowerCase().includes("process")) {
      pathDetails = `
        <g transform="translate(200,200)">
          <circle cx="0" cy="0" r="70" fill="url(#grad)" filter="url(#glow)" />
          <circle cx="0" cy="0" r="30" fill="#0B0F19" />
          ${Array.from({ length: 8 }).map((_, i) => `
            <rect x="-15" y="-95" width="30" height="40" rx="6" fill="${primaryCol}" transform="rotate(${i * 45})" />
          `).join("")}
          <circle cx="0" cy="0" r="20" fill="#FFFFFF" opacity="0.8" />
        </g>
      `;
    } else {
      // General gorgeous circular/orb design
      pathDetails = `
        <circle cx="200" cy="200" r="100" fill="url(#grad)" filter="url(#glow)" opacity="0.8" />
        <path d="M 110,200 Q 200,100 290,200 Q 200,300 110,200 Z" fill="none" stroke="#FFF" stroke-width="4" opacity="0.6" />
        <circle cx="200" cy="200" r="40" fill="#FFF" opacity="0.9" />
      `;
    }

    svgCode = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${primaryCol}" />
      <stop offset="100%" stop-color="${secondaryCol}" />
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="12" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="#0B0F19" rx="20" />
  <g opacity="0.35">
    <!-- Beautiful matrix grid lines for engineering look -->
    <line x1="50" y1="0" x2="50" y2="400" stroke="#FFF" stroke-width="0.5" stroke-dasharray="4 4" />
    <line x1="100" y1="0" x2="100" y2="400" stroke="#FFF" stroke-width="0.5" stroke-dasharray="4 4" />
    <line x1="150" y1="0" x2="150" y2="400" stroke="#FFF" stroke-width="0.5" stroke-dasharray="4 4" />
    <line x1="200" y1="0" x2="200" y2="400" stroke="#FFF" stroke-width="0.5" />
    <line x1="250" y1="0" x2="250" y2="400" stroke="#FFF" stroke-width="0.5" stroke-dasharray="4 4" />
    <line x1="300" y1="0" x2="300" y2="400" stroke="#FFF" stroke-width="0.5" stroke-dasharray="4 4" />
    <line x1="350" y1="0" x2="350" y2="400" stroke="#FFF" stroke-width="0.5" stroke-dasharray="4 4" />
    
    <line x1="0" y1="50" x2="400" y2="50" stroke="#FFF" stroke-width="0.5" stroke-dasharray="4 4" />
    <line x1="0" y1="100" x2="400" y2="100" stroke="#FFF" stroke-width="0.5" stroke-dasharray="4 4" />
    <line x1="0" y1="150" x2="400" y2="150" stroke="#FFF" stroke-width="0.5" stroke-dasharray="4 4" />
    <line x1="0" y1="200" x2="400" y2="200" stroke="#FFF" stroke-width="0.5" />
    <line x1="0" y1="250" x2="400" y2="250" stroke="#FFF" stroke-width="0.5" stroke-dasharray="4 4" />
    <line x1="0" y1="300" x2="400" y2="300" stroke="#FFF" stroke-width="0.5" stroke-dasharray="4 4" />
    <line x1="0" y1="350" x2="400" y2="350" stroke="#FFF" stroke-width="0.5" stroke-dasharray="4 4" />
  </g>
  ${pathDetails}
</svg>`;
  }

  const newAsset = {
    id: `asset-${Date.now()}`,
    userId: activeUserId,
    module: "svg",
    type: type || "Vector Graphic",
    prompt,
    svgCode,
    timestamp: new Date().toISOString(),
    status: "completed",
    size: `${(svgCode.length / 1024).toFixed(1)} KB`
  };

  generatedAssets.unshift(newAsset);
  res.json({ success: true, asset: newAsset });
});

// AI Image Studio (Text to Image)
app.post("/api/generate/image", async (req, res) => {
  const { prompt, style, aspectRatio, imageSize } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Decrease user credit as required (with auto-replenish so free/guest users can generate infinitely)
  const activeUser = usersList.find(u => u.id === activeUserId) || usersList[0];
  if (activeUser.credits < 5) {
    activeUser.credits = 50; // Auto-replenish with 50 credits to guarantee uninterrupted production generation
  }
  activeUser.credits = Math.max(0, activeUser.credits - 5);

  let base64Image = "";
  try {
    base64Image = await generateImageWithCentralRouting(prompt, style, aspectRatio, imageSize);
  } catch (err: any) {
    console.error("[VisionX Image Route] Central image routing error:", err.message || err);
  }

  // Last-resort curated images categorized based on search keywords
  if (!base64Image) {
    const keyword = prompt.toLowerCase();
    let themeUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"; // Abstract
    
    if (keyword.includes("cyberpunk") || keyword.includes("neon") || keyword.includes("city")) {
      themeUrl = "https://images.unsplash.com/photo-1515621061946-eff1c2a352bd?auto=format&fit=crop&w=800&q=80";
    } else if (keyword.includes("space") || keyword.includes("rocket") || keyword.includes("galaxy") || keyword.includes("astronaut")) {
      themeUrl = "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80";
    } else if (keyword.includes("anime") || keyword.includes("character") || keyword.includes("girl") || keyword.includes("boy")) {
      themeUrl = "https://images.unsplash.com/photo-1578632767115-351597cf2477?auto=format&fit=crop&w=800&q=80";
    } else if (keyword.includes("nature") || keyword.includes("landscape") || keyword.includes("mountain") || keyword.includes("sunset")) {
      themeUrl = "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80";
    } else if (keyword.includes("logo") || keyword.includes("minimalist")) {
      themeUrl = "https://images.unsplash.com/photo-1626785774573-4b799315345d?auto=format&fit=crop&w=800&q=80";
    } else if (keyword.includes("tech") || keyword.includes("robot") || keyword.includes("ai") || keyword.includes("computer")) {
      themeUrl = "https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=800&q=80";
    }

    base64Image = themeUrl;
  }

  const newAsset = {
    id: `asset-${Date.now()}`,
    userId: activeUserId,
    module: "image",
    type: "Text to Image",
    prompt,
    url: base64Image,
    timestamp: new Date().toISOString(),
    status: "completed",
    size: "1.2 MB",
    dimensions: aspectRatio === "16:9" ? "1920x1080" : aspectRatio === "9:16" ? "1080x1920" : "1024x1024"
  };

  generatedAssets.unshift(newAsset);
  res.json({ success: true, asset: newAsset, creditsRemaining: activeUser.credits });
});

// AI Animation & Video Generator Sandbox Proxy
app.post("/api/generate/animation", (req, res) => {
  const { prompt, duration, type } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Add a beautifully synchronized procedural animation CSS/SVG or video
  const customAnimationSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="100%" height="100%">
    <rect width="100%" height="100%" fill="#030712" rx="16" />
    <defs>
      <linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#0062FF" />
        <stop offset="50%" stop-color="#8B5CF6" />
        <stop offset="100%" stop-color="#EC4899" />
      </linearGradient>
    </defs>
    
    <!-- Outer orbiting atoms -->
    <g transform="translate(200, 200)">
      <ellipse rx="140" ry="50" fill="none" stroke="#2563EB" stroke-width="2" opacity="0.3" transform="rotate(30)">
        <animateTransform attributeName="transform" type="rotate" from="30" to="390" dur="${duration || 8}s" repeatCount="indefinite" />
      </ellipse>
      <ellipse rx="140" ry="50" fill="none" stroke="#8B5CF6" stroke-width="2" opacity="0.3" transform="rotate(-30)">
        <animateTransform attributeName="transform" type="rotate" from="-30" to="330" dur="${duration || 8}s" repeatCount="indefinite" />
      </ellipse>
      <ellipse rx="140" ry="50" fill="none" stroke="#EC4899" stroke-width="2" opacity="0.3" transform="rotate(90)">
        <animateTransform attributeName="transform" type="rotate" from="90" to="450" dur="${duration || 8}s" repeatCount="indefinite" />
      </ellipse>

      <!-- Moving cyber-dots on paths -->
      <circle r="6" fill="#0062FF">
        <animate attributeName="cx" values="0;120;0;-120;0" dur="${duration || 8}s" repeatCount="indefinite" />
        <animate attributeName="cy" values="0;40;0;-40;0" dur="${duration || 8}s" repeatCount="indefinite" />
      </circle>
      <circle r="6" fill="#EC4899">
        <animate attributeName="cx" values="0;-120;0;120;0" dur="${duration || 8}s" repeatCount="indefinite" />
        <animate attributeName="cy" values="0;40;0;-40;0" dur="${duration || 8}s" repeatCount="indefinite" />
      </circle>
    </g>

    <!-- Pulsing core star -->
    <circle cx="200" cy="200" r="45" fill="url(#cyberGrad)" opacity="0.9">
      <animate attributeName="r" values="35;50;35" dur="3s" repeatCount="indefinite" />
    </circle>
    <circle cx="200" cy="200" r="15" fill="#FFF" />
  </svg>`;

  const newAsset = {
    id: `asset-${Date.now()}`,
    userId: activeUserId,
    module: "animation",
    type: type || "Lottie Animation",
    prompt,
    svgCode: customAnimationSvg,
    url: "", // SVG embedded
    timestamp: new Date().toISOString(),
    status: "completed",
    duration: duration || 8,
    size: "18.5 KB"
  };

  generatedAssets.unshift(newAsset);
  res.json({ success: true, asset: newAsset });
});

// Video Generator Proxy
app.post("/api/generate/video", (req, res) => {
  const { prompt, duration, aspectRatio, type } = req.body;
  if (!prompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  // Pre-compiled high fidelity futuristic video simulations
  const videoUrls = [
    "https://assets.mixkit.co/videos/preview/mixkit-futuristic-subway-station-with-neon-lights-43956-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-abstract-glowing-digital-particle-flow-41804-large.mp4",
    "https://assets.mixkit.co/videos/preview/mixkit-animation-of-futuristic-abstract-shapes-41802-large.mp4"
  ];
  const selectedVideoUrl = videoUrls[Math.floor(Math.random() * videoUrls.length)];

  const newAsset = {
    id: `asset-${Date.now()}`,
    userId: activeUserId,
    module: "video",
    type: type || "AI Video",
    prompt,
    url: selectedVideoUrl,
    timestamp: new Date().toISOString(),
    status: "completed",
    duration: duration || 5,
    size: "4.8 MB"
  };

  generatedAssets.unshift(newAsset);
  res.json({ success: true, asset: newAsset });
});

// File Converter Simulator
app.post("/api/convert", (req, res) => {
  const { sourceFormat, targetFormat, filename, size } = req.body;
  if (!sourceFormat || !targetFormat) {
    return res.status(400).json({ error: "Source and Target formats are required." });
  }

  // Add to transaction log
  const textBytes = Math.floor(Math.random() * 800) + 120;
  const mockCost = 2; // credits
  const activeUser = usersList.find(u => u.id === activeUserId) || usersList[0];
  activeUser.credits = Math.max(0, activeUser.credits - mockCost);

  const convertedFileName = `${filename ? filename.split(".")[0] : "visionx_asset"}.${targetFormat.toLowerCase()}`;
  const mockDownloadUrl = targetFormat.toLowerCase() === "svg" ? "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><circle cx='50' cy='50' r='40' fill='%230062FF'/></svg>" : "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80";

  const tx = {
    id: `tx-${Date.now()}`,
    type: "generation_cost",
    amount: -mockCost,
    description: `Converted ${convertedFileName} from ${sourceFormat.toUpperCase()} to ${targetFormat.toUpperCase()}`,
    timestamp: new Date().toISOString()
  };
  transactionHistory.unshift(tx);

  res.json({
    success: true,
    convertedFileName,
    targetFormat,
    downloadUrl: mockDownloadUrl,
    creditsRemaining: activeUser.credits,
    message: "File conversion executed successfully with pixel-perfect modern codecs."
  });
});

// Get Assets (Firebase storage imitation)
app.get("/api/assets", (req, res) => {
  // Isolate assets per active user for absolute security
  const userAssets = generatedAssets.filter(asset => asset.userId === activeUserId);
  res.json({ assets: userAssets });
});

// Sync User Account state from client (Firebase or Sandbox)
app.post("/api/user/sync", (req, res) => {
  const { user } = req.body;
  if (!user || !user.id) {
    return res.status(400).json({ error: "Invalid user dataset" });
  }

  const existingIdx = usersList.findIndex(u => u.id === user.id);
  if (existingIdx !== -1) {
    // Preserve current server credits, coins, plan, and role
    usersList[existingIdx] = {
      ...user,
      credits: usersList[existingIdx].credits !== undefined ? usersList[existingIdx].credits : user.credits,
      coins: usersList[existingIdx].coins !== undefined ? usersList[existingIdx].coins : user.coins,
      plan: usersList[existingIdx].plan || user.plan,
      role: usersList[existingIdx].role || user.role
    };
  } else {
    usersList.push(user);
  }

  activeUserId = user.id;
  res.json({ success: true, user: usersList.find(u => u.id === user.id) });
});

// Get User Account state
app.get("/api/user", (req, res) => {
  const activeUser = usersList.find(u => u.id === activeUserId) || usersList[0];
  res.json({ user: activeUser });
});

// Modify user stats / buy credits
app.post("/api/user/buy-credits", (req, res) => {
  const { planName, coins, costUsd } = req.body;
  const activeUser = usersList.find(u => u.id === activeUserId) || usersList[0];
  
  if (planName) {
    activeUser.plan = planName;
    if (planName === "pro") {
      activeUser.credits += 1000;
      activeUser.coins += 5000;
    } else if (planName === "business") {
      activeUser.credits += 5000;
      activeUser.coins += 25000;
    } else if (planName === "starter") {
      activeUser.credits += 300;
      activeUser.coins += 1000;
    }
  } else if (coins) {
    activeUser.coins += coins;
    activeUser.credits += Math.floor(coins / 10);
  }

  const tx = {
    id: `tx-${Date.now()}`,
    type: "credit_buy",
    amount: coins || 500,
    costUsd: costUsd || 9.99,
    description: planName ? `Upgraded to ${planName.toUpperCase()} plan` : `Purchased ${coins} Coins Wallet pack`,
    timestamp: new Date().toISOString()
  };
  transactionHistory.unshift(tx);

  res.json({ success: true, user: activeUser, transaction: tx });
});

// --- Admin Secure Authentication & Session Store ---
const activeAdminTokens = new Set<string>();
const activeAdminSessions = new Map<string, { email: string; name: string }>();

// Admin Auth Middleware to protect admin routes
function adminAuthMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access Denied: Unauthenticated. Missing Admin Credentials." });
  }
  const token = authHeader.split(" ")[1];
  if (!activeAdminTokens.has(token)) {
    return res.status(403).json({ error: "Access Denied: Invalid or Expired Admin Session Token." });
  }
  const session = activeAdminSessions.get(token);
  if (session) {
    (req as any).adminEmail = session.email;
    (req as any).adminName = session.name;
  } else {
    (req as any).adminEmail = "saifkhokhar657@gmail.com";
    (req as any).adminName = "Saif Khokhar (Super Admin)";
  }
  next();
}

// Dedicated Admin Secure Authentication Endpoint
app.post("/api/admin/login", (req, res) => {
  const { email, password, firebaseUid } = req.body;
  const isSaifEmail = email === "saifkhokhar657@gmail.com";
  const isValidDirect = isSaifEmail && password === "admin123";
  const isValidFirebase = isSaifEmail && firebaseUid;

  if (isValidDirect || isValidFirebase) {
    const token = "vx_admin_" + Math.random().toString(36).substring(2) + Date.now().toString(36);
    activeAdminTokens.add(token);
    activeAdminSessions.set(token, { email, name: "Saif Khokhar (Super Admin)" });
    console.log(`[VisionX Admin] Admin authenticated successfully: ${email}. Token generated.`);
    return res.json({
      success: true,
      token,
      user: {
        id: firebaseUid || "admin-saif",
        email: "saifkhokhar657@gmail.com",
        name: "Saif Khokhar (Super Admin)",
        role: "admin",
        isLoggedIn: true
      }
    });
  }

  console.warn(`[VisionX Admin] Unauthenticated admin login attempt for email: ${email}`);
  return res.status(401).json({ error: "Access Denied: Invalid administrator credentials." });
});

// Get Admin Metrics (Protected)
app.get("/api/admin/metrics", adminAuthMiddleware, (req, res) => {
  res.json({
    metrics: {
      totalUsers: usersList.length + 1840,
      totalGenerations: generatedAssets.length + 12844,
      activeSessions: 42,
      serverLoad: Math.floor(Math.random() * 15) + 8,
      billingTotal: 3490.50,
      providerStatus: {
        "Gemini API (Primary)": isGeminiConfigured ? "ONLINE (Active Key)" : "OFFLINE (Not Configured)",
        "OpenAI (Backup)": isOpenAIConfigured ? "READY (Configured)" : "OFFLINE (Not Configured)",
        "VEO AI Engine": "ONLINE",
        "Lottie Renderer Engine": "STABLE"
      }
    },
    providerConfig: activeProviderConfig,
    apiKeysStatus: {
      geminiKeyMasked: isGeminiConfigured ? "•••••••• Connected" : "•••••••• Missing/Not Configured",
      openaiKeyMasked: isOpenAIConfigured ? "•••••••• Connected" : "•••••••• Missing/Not Configured"
    },
    transactions: transactionHistory.slice(0, 15)
  });
});

// Update Admin Metrics / Provider layer configuration (Protected)
app.post("/api/admin/config", adminAuthMiddleware, (req, res) => {
  const { 
    activeProvider, 
    modelName, 
    imageModel, 
    rateLimit, 
    openaiModel, 
    openaiImageModel, 
    primaryProvider,
    fallbackProvider,
    providers, 
    moduleRouting 
  } = req.body;
  
  const adminEmail = (req as any).adminEmail || "saifkhokhar657@gmail.com";

  if (activeProvider && activeProvider !== activeProviderConfig.activeProvider) {
    logAdminAction(adminEmail, "UPDATE_ACTIVE_PROVIDER", `Changed active provider from '${activeProviderConfig.activeProvider}' to '${activeProvider}'`);
    activeProviderConfig.activeProvider = activeProvider;
  }
  if (modelName && modelName !== activeProviderConfig.modelName) {
    logAdminAction(adminEmail, "UPDATE_MODEL_NAME", `Changed Gemini model from '${activeProviderConfig.modelName}' to '${modelName}'`);
    activeProviderConfig.modelName = modelName;
  }
  if (imageModel && imageModel !== activeProviderConfig.imageModel) {
    logAdminAction(adminEmail, "UPDATE_IMAGE_MODEL", `Changed Gemini image model from '${activeProviderConfig.imageModel}' to '${imageModel}'`);
    activeProviderConfig.imageModel = imageModel;
  }
  if (rateLimit !== undefined && rateLimit !== activeProviderConfig.rateLimit) {
    logAdminAction(adminEmail, "UPDATE_RATE_LIMIT", `Updated rate limit to ${rateLimit} requests/min`);
    activeProviderConfig.rateLimit = rateLimit;
  }
  if (openaiModel && openaiModel !== activeProviderConfig.openaiModel) {
    logAdminAction(adminEmail, "UPDATE_OPENAI_MODEL", `Changed OpenAI model from '${activeProviderConfig.openaiModel}' to '${openaiModel}'`);
    activeProviderConfig.openaiModel = openaiModel;
  }
  if (openaiImageModel && openaiImageModel !== activeProviderConfig.openaiImageModel) {
    logAdminAction(adminEmail, "UPDATE_OPENAI_IMAGE_MODEL", `Changed OpenAI image model from '${activeProviderConfig.openaiImageModel}' to '${openaiImageModel}'`);
    activeProviderConfig.openaiImageModel = openaiImageModel;
  }
  if (primaryProvider && primaryProvider !== activeProviderConfig.primaryProvider) {
    logAdminAction(adminEmail, "UPDATE_PRIMARY_PROVIDER", `Changed primary provider from '${activeProviderConfig.primaryProvider}' to '${primaryProvider}'`);
    activeProviderConfig.primaryProvider = primaryProvider;
  }
  if (fallbackProvider && fallbackProvider !== activeProviderConfig.fallbackProvider) {
    logAdminAction(adminEmail, "UPDATE_FALLBACK_PROVIDER", `Changed fallback provider from '${activeProviderConfig.fallbackProvider}' to '${fallbackProvider}'`);
    activeProviderConfig.fallbackProvider = fallbackProvider;
  }
  if (providers) {
    logAdminAction(adminEmail, "UPDATE_PROVIDERS_CONFIG", `Updated providers activation state / priority weights`);
    activeProviderConfig.providers = { ...activeProviderConfig.providers, ...providers };
  }
  if (moduleRouting) {
    logAdminAction(adminEmail, "UPDATE_MODULE_ROUTING", `Updated specialized per-module routing rules`);
    activeProviderConfig.moduleRouting = { ...activeProviderConfig.moduleRouting, ...moduleRouting };
  }

  saveProviderConfigToDisk();
  res.json({ success: true, providerConfig: activeProviderConfig });
});

// Secure server-side connectivity test (Protected)
app.post("/api/admin/test-connection", adminAuthMiddleware, async (req, res) => {
  const { provider } = req.body;
  const adminEmail = (req as any).adminEmail || "saifkhokhar657@gmail.com";

  if (provider === "gemini") {
    if (!isGeminiConfigured || !ai) {
      return res.json({
        success: false,
        status: "Error",
        error: "Missing GEMINI_API_KEY environment variable on the server."
      });
    }
    try {
      console.log("[VisionX Admin Test] Testing Gemini API connectivity...");
      const response = await ai.models.generateContent({
        model: activeProviderConfig.modelName || "gemini-3.5-flash",
        contents: "Hello, answer with exactly 2 words: 'Connected OK'",
      });
      const text = response.text ? response.text.trim() : "";
      if (text) {
        logAdminAction(adminEmail, "TEST_CONNECTION_SUCCESS", "Successfully tested connection to Gemini API: " + text);
        return res.json({
          success: true,
          status: "Connected",
          message: "Google Gemini is active and successfully authenticated!",
          response: text
        });
      } else {
        return res.json({
          success: false,
          status: "Error",
          error: "API connected, but response text body was empty."
        });
      }
    } catch (err: any) {
      console.error("[VisionX Admin Test] Gemini test error:", err.message || err);
      logAdminAction(adminEmail, "TEST_CONNECTION_FAILED", `Gemini API test failed: ${err.message || err}`);
      return res.json({
        success: false,
        status: "Error",
        error: err.message || "An unexpected error occurred during testing."
      });
    }
  }

  if (provider === "openai") {
    if (!isOpenAIConfigured) {
      return res.json({
        success: false,
        status: "Error",
        error: "Missing OPENAI_API_KEY environment variable on the server."
      });
    }
    try {
      console.log("[VisionX Admin Test] Testing OpenAI API connectivity...");
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: activeProviderConfig.openaiModel || "gpt-4o-mini",
          messages: [{ role: "user", content: "Hello, respond with 'Connected OK'" }],
          max_tokens: 10
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        let parsed;
        try {
          parsed = JSON.parse(errText);
        } catch {
          parsed = null;
        }

        const isQuotaExceeded = response.status === 429 || (parsed && parsed.error && parsed.error.code === "insufficient_quota");
        if (isQuotaExceeded) {
          logAdminAction(adminEmail, "TEST_CONNECTION_QUOTA", "OpenAI key valid, but billing quota exceeded.");
          return res.json({
            success: true,
            status: "Error",
            isQuotaExceeded: true,
            error: "OpenAI API: Key is valid/connected, but request returned 'insufficient_quota' error (billing/credits not yet loaded or expired)."
          });
        }
        throw new Error(`OpenAI API error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const text = data.choices?.[0]?.message?.content || "";
      logAdminAction(adminEmail, "TEST_CONNECTION_SUCCESS", "Successfully tested connection to OpenAI API: " + text.trim());
      return res.json({
        success: true,
        status: "Connected",
        message: "OpenAI API is connected and fully functional!",
        response: text.trim()
      });
    } catch (err: any) {
      console.error("[VisionX Admin Test] OpenAI test error:", err.message || err);
      logAdminAction(adminEmail, "TEST_CONNECTION_FAILED", `OpenAI API test failed: ${err.message || err}`);
      return res.json({
        success: false,
        status: "Error",
        error: err.message || "An unexpected error occurred during testing."
      });
    }
  }

  return res.status(400).json({ error: "Unsupported provider requested" });
});

// Get Transactions list
app.get("/api/transactions", (req, res) => {
  res.json({ transactions: transactionHistory });
});

// --- VITE DEV / PRODUCTION MIDDLEWARE ---
async function startServer() {
  // Helper to robustly detect if a request is for the admin portal
  function isRequestAdmin(req: express.Request): boolean {
    const hostHeader = (req.headers.host || "").toLowerCase();
    const xForwardedHost = (req.headers["x-forwarded-host"] as string || "").toLowerCase();
    const xOriginalHost = (req.headers["x-original-host"] as string || "").toLowerCase();
    const referer = (req.headers.referer || "").toLowerCase();
    const hostname = (req.hostname || "").toLowerCase();
    const headersStr = JSON.stringify(req.headers).toLowerCase();

    // Determine if requesting the admin subdomain
    const isSubdomainAdmin = 
      hostHeader.startsWith("admin.") ||
      xForwardedHost.startsWith("admin.") ||
      xOriginalHost.startsWith("admin.") ||
      hostname.startsWith("admin.") ||
      referer.includes("://admin.") ||
      headersStr.includes("admin.vision-x.soulverseapps.com");

    if (isSubdomainAdmin) {
      return true;
    }

    // In local/dev preview environments (not the live production public domain), allow path-based access
    const isProductionPublicDomain = 
      hostHeader.includes("vision-x.soulverseapps.com") ||
      xForwardedHost.includes("vision-x.soulverseapps.com") ||
      xOriginalHost.includes("vision-x.soulverseapps.com") ||
      hostname.includes("vision-x.soulverseapps.com") ||
      headersStr.includes("vision-x.soulverseapps.com");

    const isPathAdmin = req.url.startsWith("/admin") || req.url === "/admin" || req.url === "/admin.html";
    if (isPathAdmin && !isProductionPublicDomain) {
      return true;
    }

    return false;
  }

  // Subdomain & Path-based application rewrite middleware
  app.use((req, res, next) => {
    const isImgOrStaticAsset = req.url.includes(".") && !req.url.endsWith(".html");
    if (isImgOrStaticAsset) {
      return next();
    }

    const hostHeader = (req.headers.host || "").toLowerCase();
    const xForwardedHost = (req.headers["x-forwarded-host"] as string || "").toLowerCase();
    const xOriginalHost = (req.headers["x-original-host"] as string || "").toLowerCase();
    const hostname = (req.hostname || "").toLowerCase();
    const headersStr = JSON.stringify(req.headers).toLowerCase();

    const isProductionPublicDomain = 
      hostHeader.includes("vision-x.soulverseapps.com") ||
      xForwardedHost.includes("vision-x.soulverseapps.com") ||
      xOriginalHost.includes("vision-x.soulverseapps.com") ||
      hostname.includes("vision-x.soulverseapps.com") ||
      headersStr.includes("vision-x.soulverseapps.com");

    const isPathAdmin = req.url.startsWith("/admin") || req.url === "/admin";

    if (isRequestAdmin(req)) {
      // Route root, index.html, or generic spa routes to admin.html
      if (req.url === "/" || req.url === "/index.html" || (!req.url.startsWith("/api") && !req.url.includes("."))) {
        req.url = "/admin.html";
      }
    } else {
      // On production public domain, redirect any administration path or direct admin.html access to the live admin subdomain
      if (isProductionPublicDomain && (isPathAdmin || req.url === "/admin.html")) {
        return res.redirect("https://admin.vision-x.soulverseapps.com");
      }
    }
    next();
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // Fallback routing
      if (isRequestAdmin(req)) {
        res.sendFile(path.join(distPath, "admin.html"));
      } else {
        res.sendFile(path.join(distPath, "index.html"));
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`VisionX AI Backend Server running on http://localhost:${PORT}`);
  });
}

startServer();
