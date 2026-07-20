/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Sliders, Image, Eye, Download, EyeOff, Scissors, RefreshCw, Layers, ShieldCheck, HelpCircle } from "lucide-react";
import { AIModule, GeneratedAsset } from "../types";

interface ImageStudioProps {
  onGenerate: (data: {
    prompt: string;
    style: string;
    aspectRatio: string;
    lighting: string;
    cameraAngle: string;
    imageSize: string;
    mode: string;
  }) => Promise<GeneratedAsset>;
  isLoading: boolean;
  userCredits: number;
}

export default function ImageStudio({ onGenerate, isLoading, userCredits }: ImageStudioProps) {
  const [prompt, setPrompt] = useState("");
  const [activeTool, setActiveTool] = useState("Text to Image");
  const [selectedStyle, setSelectedStyle] = useState("Futuristic Cyberpunk");
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [lighting, setLighting] = useState("Cinematic Glow");
  const [cameraAngle, setCameraAngle] = useState("Wide Dramatic");
  const [resolution, setResolution] = useState("1K");
  const [generatedAsset, setGeneratedAsset] = useState<GeneratedAsset | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isResizing, setIsResizing] = useState(false);

  const tools = [
    "Text to Image", "Image to Image", "Background Remove", "Background Replace", 
    "Image Upscale", "Face Enhance", "AI Logo Generator", "AI Poster Generator", 
    "AI Banner Generator", "AI Thumbnail Generator"
  ];

  const styles = [
    { name: "Futuristic Cyberpunk", desc: "Neon glows, high contrast", color: "from-blue-600 to-purple-600" },
    { name: "High-End Photorealistic", desc: "8K octane rendering, lens flares", color: "from-gray-600 to-slate-800" },
    { name: "Modern Anime", desc: "Shinkai aesthetic, gorgeous colors", color: "from-pink-500 to-indigo-500" },
    { name: "3D Isometric Cartoon", desc: "Clay render style, soft lighting", color: "from-orange-400 to-amber-600" },
    { name: "Minimalist Vector", desc: "Crisp shapes, clean lines", color: "from-emerald-400 to-teal-600" },
    { name: "Golden Era Islamic", desc: "Intricate geometric arabesque", color: "from-yellow-600 to-emerald-700" }
  ];

  const aspectRatios = [
    { ratio: "1:1", label: "Square (1:1)", icon: "■" },
    { ratio: "16:9", label: "Landscape (16:9)", icon: "▬" },
    { ratio: "9:16", label: "Portrait (9:16)", icon: "▮" },
    { ratio: "4:3", label: "Standard (4:3)", icon: "▰" },
    { ratio: "3:4", label: "Classic (3:4)", icon: "▵" }
  ];

  const lightings = ["Cinematic Glow", "Volumetric Ambient", "Vibrant Neon", "Muted Soft", "High Contrast Chiaroscuro"];
  const cameraAngles = ["Wide Dramatic", "Macro Close-Up", "Drone Panoramic", "Cinematic Eye-Level", "Dutch Angle Dynamic"];
  const resolutions = ["512px", "1K", "2K", "4K"];

  const handleGenerateClick = async () => {
    if (!prompt.trim()) return;
    const asset = await onGenerate({
      prompt,
      style: selectedStyle,
      aspectRatio,
      lighting,
      cameraAngle,
      imageSize: resolution,
      mode: activeTool
    });
    setGeneratedAsset(asset);
  };

  const handleSliderDrag = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    const container = e.currentTarget.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const offset = ((clientX - container.left) / container.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, offset)));
  };

  return (
    <div id="image-studio-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-white">
      {/* Parameter Control Panel */}
      <div className="lg:col-span-4 bg-brand-card border border-white/10 rounded-3xl p-6 overflow-y-auto max-h-[82vh] space-y-6 scrollbar-thin">
        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-3 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-400" />
            Studio Core Tools
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {tools.map((tool) => (
              <button
                key={tool}
                onClick={() => {
                  setActiveTool(tool);
                  if (tool === "Background Remove" || tool === "Face Enhance" || tool === "Image Upscale") {
                    setPrompt(`Process current image: execute ${tool.toLowerCase()} feature`);
                  } else {
                    setPrompt("");
                  }
                }}
                className={`py-2.5 px-3 rounded-xl text-left text-xs font-medium transition border cursor-pointer ${
                  activeTool === tool
                    ? "bg-blue-600 border-blue-500/30 text-white shadow-lg shadow-blue-600/10"
                    : "bg-brand-item border-white/5 hover:bg-white/5 text-white/70 hover:text-white"
                }`}
              >
                {tool}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Prompt Field */}
        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            AI Prompt Engine
          </h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            disabled={activeTool === "Background Remove" || activeTool === "Face Enhance" || activeTool === "Image Upscale"}
            placeholder={
              activeTool === "Background Remove" 
                ? "Upload or generate an image first, background removal is automated."
                : "A futuristic floating island with waterfalls cascading into neon space, cybernetic temples..."
            }
            className="w-full h-24 bg-brand-bg border border-white/10 rounded-2xl p-3 text-sm text-white placeholder-white/20 focus:border-blue-500 outline-none transition resize-none"
          />
        </div>

        {/* Aesthetic Styles */}
        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-pink-400" />
            Creative Art Styles
          </h3>
          <div className="grid grid-cols-1 gap-2.5">
            {styles.map((style) => (
              <button
                key={style.name}
                onClick={() => setSelectedStyle(style.name)}
                className={`flex items-center gap-3 p-2.5 rounded-2xl border text-left transition cursor-pointer ${
                  selectedStyle === style.name
                    ? "bg-gradient-to-r from-blue-950/20 to-purple-950/20 border-purple-500/50 shadow-lg"
                    : "bg-brand-item border-white/5 hover:bg-white/5"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-tr ${style.color} flex items-center justify-center font-bold text-lg shadow-inner`}>
                  V
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">{style.name}</p>
                  <p className="text-[10px] text-white/40">{style.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Aspect Ratio Selector */}
        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-3">Aspect Ratio</h3>
          <div className="flex flex-wrap gap-2">
            {aspectRatios.map((item) => (
              <button
                key={item.ratio}
                onClick={() => setAspectRatio(item.ratio)}
                className={`py-2 px-3 rounded-xl flex items-center gap-2 text-xs font-medium transition border cursor-pointer ${
                  aspectRatio === item.ratio
                    ? "bg-blue-600/10 border-blue-500 text-blue-400"
                    : "bg-brand-item border-white/5 text-white/60 hover:text-white"
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Advanced Settings */}
        <div className="space-y-4 pt-4 border-t border-white/10">
          <div>
            <label className="block text-[10px] font-mono font-semibold text-white/40 uppercase mb-1.5">Lighting Environment</label>
            <select
              value={lighting}
              onChange={(e) => setLighting(e.target.value)}
              className="w-full bg-brand-item border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-blue-500 transition cursor-pointer"
            >
              {lightings.map((l) => (
                <option key={l} value={l} className="bg-[#0a0a0f]">{l}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-semibold text-white/40 uppercase mb-1.5">Camera Composition</label>
            <select
              value={cameraAngle}
              onChange={(e) => setCameraAngle(e.target.value)}
              className="w-full bg-brand-item border border-white/10 rounded-xl py-2 px-3 text-xs text-white outline-none focus:border-blue-500 transition cursor-pointer"
            >
              {cameraAngles.map((c) => (
                <option key={c} value={c} className="bg-[#0a0a0f]">{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-mono font-semibold text-white/40 uppercase mb-1.5">Model Resolution</label>
            <div className="grid grid-cols-4 gap-2">
              {resolutions.map((res) => (
                <button
                  key={res}
                  onClick={() => setResolution(res)}
                  className={`py-1.5 rounded-lg text-xs font-mono border transition cursor-pointer ${
                    resolution === res
                      ? "bg-purple-600/20 border-purple-500 text-purple-400"
                      : "bg-brand-item border-white/5 text-white/40 hover:text-white"
                  }`}
                >
                  {res}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Generation Action Button */}
        <button
          onClick={handleGenerateClick}
          disabled={isLoading || !prompt.trim()}
          className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:opacity-90 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/10 flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-5 h-5 animate-spin" />
              <span>Tuning AI Generative Engine...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Synthesize Artwork (-5 Credits)</span>
            </>
          )}
        </button>
      </div>

      {/* Interactive Render Canvas */}
      <div className="lg:col-span-8 flex flex-col justify-between bg-brand-card border border-white/10 rounded-3xl p-6 min-h-[500px]">
        {/* Workspace Toolbar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
            <h4 className="text-sm font-display font-bold tracking-tight text-white flex items-center gap-2">
              <Eye className="w-4 h-4 text-blue-400" />
              Sandbox Workspace (Before/After Comparative Slider)
            </h4>
          </div>
          {generatedAsset && (
            <div className="flex gap-2">
              <button
                onClick={() => setCompareMode(!compareMode)}
                className={`p-2 rounded-xl border text-xs transition flex items-center gap-1.5 cursor-pointer ${
                  compareMode ? "bg-purple-600/10 border-purple-500 text-purple-400" : "border-white/10 text-white/60 hover:bg-white/5"
                }`}
              >
                <Scissors className="w-4 h-4" />
                Before/After
              </button>
              <a
                href={generatedAsset.url}
                download={`visionx_${Date.now()}.png`}
                className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export Ultra HD
              </a>
            </div>
          )}
        </div>

        {/* Active Stage Panel */}
        <div className="flex-grow flex items-center justify-center relative overflow-hidden rounded-2xl bg-[#050508] p-4 border border-white/10">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4 max-w-sm"
              >
                <div className="relative inline-block">
                  <div className="w-20 h-20 rounded-full border-4 border-blue-500/10 border-t-purple-500 animate-spin" />
                  <Sparkles className="w-8 h-8 text-blue-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Quantum Diffusion Model Processing</h4>
                  <p className="text-xs text-white/40 mt-1 font-sans">
                    Generating pixels using deep learning models on server cluster nodes. Rendering aspect ratio: {aspectRatio}.
                  </p>
                </div>
              </motion.div>
            ) : generatedAsset ? (
              compareMode ? (
                // Interactive comparative slider
                <div
                  className="relative w-full max-w-lg aspect-square select-none overflow-hidden rounded-xl border border-white/10 cursor-ew-resize"
                  onMouseMove={handleSliderDrag}
                  onTouchMove={handleSliderDrag}
                >
                  {/* Before state (Draft rendering / original outline) */}
                  <div className="absolute inset-0 bg-[#0d0d14] flex flex-col items-center justify-center text-center p-6 text-white/20">
                    <div className="opacity-10 font-mono text-7xl select-none mb-4">DRAFT</div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40">Before Enhancement Model</p>
                  </div>

                  {/* After state (High-fidelity asset) */}
                  <div
                    className="absolute inset-0 bg-cover bg-center"
                    style={{
                      backgroundImage: `url(${generatedAsset.url})`,
                      clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
                    }}
                  />

                  {/* Slider Divider Bar */}
                  <div
                    className="absolute top-0 bottom-0 w-1 bg-white shadow-xl pointer-events-none"
                    style={{ left: `${sliderPosition}%` }}
                  >
                    <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs select-none shadow-2xl">
                      ↔
                    </div>
                  </div>
                </div>
              ) : (
                <motion.div
                  key="asset"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="relative w-full max-w-lg aspect-square flex items-center justify-center overflow-hidden rounded-xl border border-white/10"
                >
                  <img
                    src={generatedAsset.url}
                    alt={generatedAsset.prompt}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-contain"
                  />
                  {/* Floating Specs HUD */}
                  <div className="absolute bottom-4 left-4 right-4 bg-black/80 backdrop-blur-md border border-white/10 p-3 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <p className="font-semibold text-white truncate max-w-[200px]">{generatedAsset.prompt}</p>
                      <p className="text-white/40 text-[10px] mt-0.5 font-mono">{generatedAsset.dimensions || "1024x1024"} • {generatedAsset.size || "1.2 MB"}</p>
                    </div>
                    <span className="py-1 px-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 rounded-lg text-[10px] font-mono uppercase">
                      Ready
                    </span>
                  </div>
                </motion.div>
              )
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-white/40 p-8"
              >
                <div className="inline-flex p-4 bg-white/5 rounded-full border border-white/10 mb-3">
                  <Image className="w-8 h-8 text-white/20" />
                </div>
                <h5 className="text-sm font-semibold text-white/60">Workspace Empty</h5>
                <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto font-sans">
                  Provide custom instructions on the left panel to configure weights and generate.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Workspace Footer Specs */}
        <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-white/40 gap-2 border-t border-white/10 pt-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-400" />
              Material 3 Standard Design
            </span>
            <span className="flex items-center gap-1.5 font-mono text-[10px]">
              ENGINE_NODE: PRO_DIFFUSION_V3
            </span>
          </div>
          <p className="text-white/40">
            Powered by primary neural layer. Credits left: <span className="text-white font-bold">{userCredits}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
