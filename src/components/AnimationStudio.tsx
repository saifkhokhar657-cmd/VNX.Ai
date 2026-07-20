/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, RotateCcw, Video, Sparkles, Sliders, Layers, Film, Download, Plus, Timer, Code } from "lucide-react";
import { AIModule, GeneratedAsset } from "../types";

interface AnimationStudioProps {
  onGenerate: (data: {
    prompt: string;
    duration: number;
    type: string;
  }) => Promise<GeneratedAsset>;
  isLoading: boolean;
}

export default function AnimationStudio({ onGenerate, isLoading }: AnimationStudioProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedType, setSelectedType] = useState("Lottie Animation Generator");
  const [duration, setDuration] = useState(8);
  const [customDuration, setCustomDuration] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const [generatedAsset, setGeneratedAsset] = useState<GeneratedAsset | null>(null);
  const [timelineProgress, setTimelineProgress] = useState(0);

  const animationTypes = [
    "Prompt to Animation", "Image to Animation", "Logo to Animation",
    "SVG Animation Generator", "SVGA Animation Generator", "Lottie Animation Generator",
    "GIF Generator", "MP4 Animation", "WebM Animation"
  ];

  const durations = [3, 5, 6, 8, 10, 15, 20];

  // Timeline playback simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && generatedAsset) {
      interval = setInterval(() => {
        setTimelineProgress((prev) => {
          if (prev >= 100) return 0;
          return prev + (100 / (duration * 10)); // increment based on ticks per second
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, generatedAsset, duration]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const finalDuration = customDuration ? parseInt(customDuration) : duration;
    const asset = await onGenerate({
      prompt,
      duration: finalDuration,
      type: selectedType
    });
    setGeneratedAsset(asset);
    setTimelineProgress(0);
    setIsPlaying(true);
  };

  return (
    <div id="animation-studio-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-white">
      {/* Settings Panel */}
      <div className="lg:col-span-4 bg-brand-card border border-white/10 rounded-3xl p-6 overflow-y-auto max-h-[82vh] space-y-6 scrollbar-thin">
        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-3 flex items-center gap-2">
            <Film className="w-4 h-4 text-purple-400" />
            Animation Core
          </h3>
          <div className="grid grid-cols-1 gap-1.5">
            {animationTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`py-2.5 px-3 rounded-xl text-left text-xs transition border cursor-pointer ${
                  selectedType === type
                    ? "bg-purple-600/10 border-purple-500/30 text-purple-400 shadow-lg"
                    : "bg-brand-item border-white/5 hover:bg-white/5 text-white/70"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-2">Prompt Engine</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A sleek modern cybernetic orb spinning fluidly while glowing with hot neon flares..."
            className="w-full h-24 bg-brand-bg border border-white/10 rounded-2xl p-3 text-sm text-white placeholder-white/20 focus:border-blue-500 outline-none transition resize-none"
          />
        </div>

        {/* Animation Durations */}
        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-3 flex items-center gap-2">
            <Timer className="w-4 h-4 text-emerald-400" />
            Animation Duration (seconds)
          </h3>
          <div className="grid grid-cols-4 gap-2">
            {durations.map((d) => (
              <button
                key={d}
                onClick={() => {
                  setDuration(d);
                  setCustomDuration("");
                }}
                className={`py-2 rounded-xl text-xs font-mono border transition cursor-pointer ${
                  duration === d && !customDuration
                    ? "bg-emerald-600/20 border-emerald-500 text-emerald-400"
                    : "bg-brand-item border-white/5 text-white/40 hover:text-white"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
          <div className="mt-2.5">
            <input
              type="number"
              placeholder="Custom Duration (e.g. 30)"
              value={customDuration}
              onChange={(e) => {
                setCustomDuration(e.target.value);
                setDuration(parseInt(e.target.value) || 5);
              }}
              className="w-full bg-brand-item border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-white/20 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <RotateCcw className="w-5 h-5 animate-spin" />
              <span>Generating Vector Keyframes...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Animate Asset (-10 Coins)</span>
            </>
          )}
        </button>
      </div>

      {/* Playback workspace */}
      <div className="lg:col-span-8 flex flex-col justify-between bg-brand-card border border-white/10 rounded-3xl p-6 min-h-[500px]">
        {/* Workspace Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse" />
            <h4 className="text-sm font-display font-bold text-white flex items-center gap-2">
              <Video className="w-4 h-4 text-purple-400" />
              Real-time High Performance Animation player
            </h4>
          </div>
          {generatedAsset && (
            <button
              onClick={() => {
                const element = document.createElement("a");
                const file = new Blob([generatedAsset.svgCode || ""], { type: "image/svg+xml" });
                element.href = URL.createObjectURL(file);
                element.download = "visionx_animation.svg";
                document.body.appendChild(element);
                element.click();
              }}
              className="p-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Export Animated SVG/SVGA
            </button>
          )}
        </div>

        {/* Player State Canvas */}
        <div className="flex-grow flex items-center justify-center relative bg-[#050508] rounded-2xl p-6 border border-white/10">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4 max-w-xs"
              >
                <div className="w-16 h-16 rounded-full border-4 border-purple-500/10 border-t-purple-500 animate-spin mx-auto" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Generating Vector Node Paths</h4>
                  <p className="text-xs text-white/40 mt-1 font-mono uppercase tracking-wider">Rendering format: {selectedType.split(" ")[0]}</p>
                </div>
              </motion.div>
            ) : generatedAsset ? (
              <motion.div
                key="render"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md aspect-square flex items-center justify-center overflow-hidden"
              >
                {/* Embedded SVG with code rendering */}
                <div 
                  className="w-full h-full"
                  dangerouslySetInnerHTML={{ __html: generatedAsset.svgCode || "" }} 
                />
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-white/40"
              >
                <div className="inline-flex p-4 bg-white/5 rounded-full border border-white/10 mb-3">
                  <Video className="w-8 h-8 text-white/20" />
                </div>
                <h5 className="text-sm font-semibold text-white/60">Animation Sandbox</h5>
                <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto font-sans">
                  Choose a style and input a motion prompt to synthesize keyframed vectors instantly.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Timeline Controller Interface */}
        <div className="mt-4 border-t border-white/10 pt-4 space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={!generatedAsset}
              className="p-3 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-full transition shadow-lg cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <button
              onClick={() => setTimelineProgress(0)}
              disabled={!generatedAsset}
              className="p-3 bg-brand-item hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed rounded-full text-white transition cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <div className="flex-grow flex items-center gap-3">
              <span className="text-xs font-mono text-white/40">0.0s</span>
              {/* Timeline Track */}
              <div className="flex-grow h-3 bg-brand-bg rounded-full overflow-hidden relative border border-white/10">
                <div
                  className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-full transition-all duration-100"
                  style={{ width: `${timelineProgress}%` }}
                />
              </div>
              <span className="text-xs font-mono text-purple-400 font-bold">{((timelineProgress / 100) * duration).toFixed(1)}s</span>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/40">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1"><Code className="w-3.5 h-3.5 text-purple-400" /> Canvas Acceleration: Enabled</span>
              <span>•</span>
              <span className="font-mono text-[10px]">TIME_SCALE: 1.0 (REAL_TIME)</span>
            </div>
            <p>PWA Native Service Worker Synced</p>
          </div>
        </div>
      </div>
    </div>
  );
}
