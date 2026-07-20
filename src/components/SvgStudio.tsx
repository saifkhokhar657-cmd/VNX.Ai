/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Copy, Download, Code, Eye, Sparkles, ZoomIn, ZoomOut, Check, Sliders, Palette, FileCode, PackageOpen } from "lucide-react";
import { AIModule, GeneratedAsset } from "../types";

interface SvgStudioProps {
  onGenerate: (data: {
    prompt: string;
    type: string;
    style: string;
    colorPalette: string;
  }) => Promise<GeneratedAsset>;
  isLoading: boolean;
}

export default function SvgStudio({ onGenerate, isLoading }: SvgStudioProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedType, setSelectedType] = useState("Vector Graphics");
  const [selectedStyle, setSelectedStyle] = useState("Premium Neon Dark");
  const [colorPalette, setColorPalette] = useState("Cyber Electric");
  const [generatedAsset, setGeneratedAsset] = useState<GeneratedAsset | null>(null);
  const [zoom, setZoom] = useState(1);
  const [isCopied, setIsCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<"visual" | "code">("visual");

  const svgTypes = [
    "SVG", "SVGA", "Lottie JSON", "Icons", "Vector Graphics", 
    "UI Assets", "Animated SVG", "Animated Buttons", "App Illustrations"
  ];

  const styles = [
    "Premium Neon Dark", "Minimalist Outline", "High Contrast Flat", 
    "Golden Era Islamic", "3D Metallic Vector", "Retro Comic Ink"
  ];

  const palettes = ["Cyber Electric", "Sunset Gold", "Mint Emerald", "Crimson Plasma", "Monochrome Slate"];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const asset = await onGenerate({
      prompt,
      type: selectedType,
      style: selectedStyle,
      colorPalette
    });
    setGeneratedAsset(asset);
    setZoom(1);
  };

  const handleCopyCode = () => {
    if (!generatedAsset?.svgCode) return;
    navigator.clipboard.writeText(generatedAsset.svgCode);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadFile = (format: string) => {
    if (!generatedAsset?.svgCode) return;
    
    const fileContent = generatedAsset.svgCode;
    const filename = `visionx_vector.${format.toLowerCase()}`;
    const file = new Blob([fileContent], { type: format === "json" ? "application/json" : "image/svg+xml" });
    
    const element = document.createElement("a");
    element.href = URL.createObjectURL(file);
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div id="svg-studio-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-white">
      {/* Parameter sidebar */}
      <div className="lg:col-span-4 bg-brand-card border border-white/10 rounded-3xl p-6 overflow-y-auto max-h-[82vh] space-y-6 scrollbar-thin">
        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-3 flex items-center gap-2">
            <FileCode className="w-4 h-4 text-emerald-400" />
            Vector Typologies
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {svgTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`py-2 px-3 rounded-xl text-left text-xs transition border cursor-pointer ${
                  selectedType === type
                    ? "bg-emerald-600/10 border-emerald-500/30 text-emerald-400 shadow-lg"
                    : "bg-brand-item border-white/5 hover:bg-white/5 text-white/70"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-2">Vector Prompt</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A highly detailed robotic mechanical core logo, concentric gears, circuit tracks..."
            className="w-full h-24 bg-brand-bg border border-white/10 rounded-2xl p-3 text-sm text-white placeholder-white/20 focus:border-blue-500 outline-none transition resize-none"
          />
        </div>

        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-3 flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-400" />
            Geometric Aesthetic
          </h3>
          <div className="grid grid-cols-1 gap-1.5">
            {styles.map((style) => (
              <button
                key={style}
                onClick={() => setSelectedStyle(style)}
                className={`py-2 px-3 rounded-xl text-left text-xs transition border cursor-pointer ${
                  selectedStyle === style
                    ? "bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-lg"
                    : "bg-brand-item border-white/5 hover:bg-white/5 text-white/70"
                }`}
              >
                {style}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-3 flex items-center gap-2">
            <Palette className="w-4 h-4 text-purple-400" />
            Color Palette Schema
          </h3>
          <div className="grid grid-cols-1 gap-1.5">
            {palettes.map((p) => (
              <button
                key={p}
                onClick={() => setColorPalette(p)}
                className={`py-2 px-3 rounded-xl text-left text-xs transition border cursor-pointer ${
                  colorPalette === p
                    ? "bg-purple-600/10 border-purple-500/30 text-purple-400 shadow-lg"
                    : "bg-brand-item border-white/5 hover:bg-white/5 text-white/70"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="w-full py-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-blue-600 hover:opacity-90 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Compiling Node Vectors...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate Pure Vector (-5 Credits)</span>
            </>
          )}
        </button>
      </div>

      {/* Vector Stage Workspace */}
      <div className="lg:col-span-8 flex flex-col justify-between bg-brand-card border border-white/10 rounded-3xl p-6 min-h-[500px]">
        {/* Toggle Workspace header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4 flex-wrap gap-2">
          <div className="flex bg-brand-item p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setActiveTab("visual")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === "visual" ? "bg-emerald-600 text-white" : "text-white/40 hover:text-white"
              }`}
            >
              <Eye className="w-3.5 h-3.5" />
              Visual Sandbox
            </button>
            <button
              onClick={() => setActiveTab("code")}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                activeTab === "code" ? "bg-emerald-600 text-white" : "text-white/40 hover:text-white"
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              Source XML Code
            </button>
          </div>

          {generatedAsset && (
            <div className="flex gap-2">
              <button
                onClick={handleCopyCode}
                className="p-2 bg-brand-item hover:bg-white/5 text-white rounded-xl text-xs flex items-center gap-1.5 transition border border-white/10 cursor-pointer"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                Copy Code
              </button>
              <button
                onClick={() => handleDownloadFile("svg")}
                className="p-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-4 h-4" />
                Export SVG
              </button>
              <button
                onClick={() => handleDownloadFile("json")}
                className="p-2 bg-brand-item hover:bg-white/5 text-white rounded-xl text-xs flex items-center gap-1.5 transition border border-white/10 cursor-pointer"
              >
                <PackageOpen className="w-4 h-4" />
                Lottie JSON
              </button>
            </div>
          )}
        </div>

        {/* Dynamic Display Canvas */}
        <div className="flex-grow flex items-center justify-center relative bg-[#050508] rounded-2xl border border-white/10 overflow-hidden p-6">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4 max-w-sm"
              >
                <div className="w-16 h-16 rounded-full border-4 border-emerald-500/10 border-t-emerald-500 animate-spin mx-auto" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Synthesizing Geometry Nodes</h4>
                  <p className="text-xs text-white/40 mt-1 font-mono uppercase tracking-wider">MIME: image/svg+xml • {selectedStyle}</p>
                </div>
              </motion.div>
            ) : generatedAsset ? (
              activeTab === "visual" ? (
                <motion.div
                  key="render"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="w-full h-full max-w-sm flex items-center justify-center transition-transform duration-200"
                  style={{ transform: `scale(${zoom})` }}
                >
                  <div 
                    className="w-full h-full"
                    dangerouslySetInnerHTML={{ __html: generatedAsset.svgCode || "" }} 
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="code"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="w-full h-full max-h-[380px] overflow-auto font-mono text-xs bg-[#0a0a0f] border border-white/10 p-4 rounded-xl text-emerald-400 select-all"
                >
                  <pre>{generatedAsset.svgCode}</pre>
                </motion.div>
              )
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-white/40"
              >
                <div className="inline-flex p-4 bg-white/5 rounded-full border border-white/10 mb-3">
                  <Code className="w-8 h-8 text-white/20" />
                </div>
                <h5 className="text-sm font-semibold text-white/60">Vector Canvas Sandbox</h5>
                <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto font-sans">
                  Type instructions to generate beautifully engineered responsive SVGs. Includes live zoom and real-time XML inspecting.
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Float Zoom Controllers */}
          {generatedAsset && activeTab === "visual" && (
            <div className="absolute bottom-4 right-4 flex bg-black/80 backdrop-blur-md border border-white/10 p-1.5 rounded-xl gap-1">
              <button
                onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
                className="p-1.5 hover:bg-white/5 rounded text-white/60 hover:text-white transition cursor-pointer"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="px-2 py-1 text-[10px] font-mono text-white/40 flex items-center justify-center select-none">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={() => setZoom(Math.min(3, zoom + 0.25))}
                className="p-1.5 hover:bg-white/5 rounded text-white/60 hover:text-white transition cursor-pointer"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Foot Stats */}
        <div className="mt-4 border-t border-white/10 pt-4 flex items-center justify-between text-xs text-white/40">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Responsive Scalable Vector Output (XML Format)</span>
          </div>
          <p>SVG and SVGA standards optimized</p>
        </div>
      </div>
    </div>
  );
}
