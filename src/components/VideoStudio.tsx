/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, Video, Sparkles, Sliders, Film, Download, Timer, Volume2, Maximize, AlertCircle } from "lucide-react";
import { AIModule, GeneratedAsset } from "../types";

interface VideoStudioProps {
  onGenerate: (data: {
    prompt: string;
    duration: number;
    aspectRatio: string;
    type: string;
  }) => Promise<GeneratedAsset>;
  isLoading: boolean;
}

export default function VideoStudio({ onGenerate, isLoading }: VideoStudioProps) {
  const [prompt, setPrompt] = useState("");
  const [selectedType, setSelectedType] = useState("Prompt to Video");
  const [duration, setDuration] = useState(5);
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [isPlaying, setIsPlaying] = useState(false);
  const [generatedAsset, setGeneratedAsset] = useState<GeneratedAsset | null>(null);
  const [videoProgress, setVideoProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const videoTypes = [
    "Prompt to Video", "Image to Video", "Product Video",
    "Intro Generator", "Outro Generator", "Reel Generator",
    "Story Generator", "Short Video Generator"
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    const asset = await onGenerate({
      prompt,
      duration,
      aspectRatio,
      type: selectedType
    });
    setGeneratedAsset(asset);
    setVideoProgress(0);
    setIsPlaying(false);
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play().catch(err => console.log(err));
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;
    const progress = (videoRef.current.currentTime / videoRef.current.duration) * 100;
    setVideoProgress(progress || 0);
  };

  return (
    <div id="video-studio-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-white">
      {/* Control Configuration */}
      <div className="lg:col-span-4 bg-brand-card border border-white/10 rounded-3xl p-6 overflow-y-auto max-h-[82vh] space-y-6 scrollbar-thin">
        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-3 flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-400" />
            AI Video Engines
          </h3>
          <div className="grid grid-cols-1 gap-1.5">
            {videoTypes.map((type) => (
              <button
                key={type}
                onClick={() => setSelectedType(type)}
                className={`py-2 px-3 rounded-xl text-left text-xs transition border cursor-pointer ${
                  selectedType === type
                    ? "bg-blue-600/10 border-blue-500/30 text-blue-400 shadow-lg"
                    : "bg-brand-item border-white/5 hover:bg-white/5 text-white/70"
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-2">Cinematic Prompt</h3>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="A majestic golden dragon soaring over futuristic neon skyscrapers of Tokyo, sunset reflection..."
            className="w-full h-24 bg-brand-bg border border-white/10 rounded-2xl p-3 text-sm text-white placeholder-white/20 focus:border-blue-500 outline-none transition resize-none"
          />
        </div>

        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-2.5">Duration</h3>
          <div className="flex gap-2">
            {[3, 5, 8, 10, 15].map((d) => (
              <button
                key={d}
                onClick={() => setDuration(d)}
                className={`flex-1 py-2 rounded-xl text-xs font-mono border transition cursor-pointer ${
                  duration === d
                    ? "bg-blue-600/20 border-blue-500 text-blue-400"
                    : "bg-brand-item border-white/5 text-white/40 hover:text-white"
                }`}
              >
                {d}s
              </button>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase mb-2.5">Output Format</h3>
          <div className="grid grid-cols-2 gap-2">
            {[
              { ratio: "16:9", label: "Widescreen (16:9)" },
              { ratio: "9:16", label: "Vertical/Reel (9:16)" }
            ].map((ar) => (
              <button
                key={ar.ratio}
                onClick={() => setAspectRatio(ar.ratio)}
                className={`py-2.5 px-3 rounded-xl text-center text-xs border transition cursor-pointer ${
                  aspectRatio === ar.ratio
                    ? "bg-indigo-600/20 border-indigo-500 text-indigo-400"
                    : "bg-brand-item border-white/5 text-white/40 hover:text-white"
                }`}
              >
                {ar.label}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={isLoading || !prompt.trim()}
          className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
        >
          {isLoading ? (
            <>
              <Film className="w-5 h-5 animate-spin" />
              <span>Simulating Veo 3D Engine...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-5 h-5" />
              <span>Generate Video (-20 Coins)</span>
            </>
          )}
        </button>
      </div>

      {/* Cinematic Playback Monitor */}
      <div className="lg:col-span-8 flex flex-col justify-between bg-brand-card border border-white/10 rounded-3xl p-6 min-h-[500px]">
        {/* Workspace Toolbar */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
            <h4 className="text-sm font-display font-bold text-white flex items-center gap-2">
              <Film className="w-4 h-4 text-blue-400" />
              VisionX Ultra Cinematic Video Player
            </h4>
          </div>
          {generatedAsset && (
            <a
              href={generatedAsset.url}
              target="_blank"
              download="visionx_cinematic.mp4"
              className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs flex items-center gap-1.5 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download MP4
            </a>
          )}
        </div>

        {/* Video Canvas Window */}
        <div className="flex-grow flex items-center justify-center relative bg-[#050508] rounded-2xl p-4 border border-white/10 overflow-hidden">
          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center space-y-4 max-w-sm"
              >
                <div className="w-16 h-16 rounded-full border-4 border-blue-500/10 border-t-blue-500 animate-spin mx-auto" />
                <div>
                  <h4 className="text-sm font-semibold text-white">Synthesizing Temporal Frames</h4>
                  <p className="text-xs text-white/40 mt-1 font-mono uppercase tracking-wider">Veo Lite Engine • {aspectRatio}</p>
                </div>
              </motion.div>
            ) : generatedAsset ? (
              <motion.div
                key="player"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`w-full h-full max-w-xl flex items-center justify-center rounded-xl overflow-hidden shadow-2xl relative ${
                  aspectRatio === "9:16" ? "max-h-[450px] aspect-[9/16]" : "aspect-[16/9]"
                }`}
              >
                <video
                  ref={videoRef}
                  src={generatedAsset.url}
                  className="w-full h-full object-cover"
                  loop
                  playsInline
                  onTimeUpdate={handleTimeUpdate}
                  onClick={togglePlay}
                />
                
                {/* Embedded Play Button Overlay when paused */}
                {!isPlaying && (
                  <button
                    onClick={togglePlay}
                    className="absolute inset-0 m-auto w-16 h-16 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white border border-white/20 transition-all scale-110 active:scale-95 cursor-pointer"
                  >
                    <Play className="w-6 h-6 fill-current" />
                  </button>
                )}
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
                <h5 className="text-sm font-semibold text-white/60">Cinematic Workspace</h5>
                <p className="text-xs text-white/40 mt-1 max-w-xs mx-auto font-sans">
                  Provide custom scripts, set video length, and configure rendering layout to generate high quality mp4 shots.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Video Control Bar Interface */}
        <div className="mt-4 border-t border-white/10 pt-4 space-y-4">
          <div className="flex items-center gap-4">
            <button
              onClick={togglePlay}
              disabled={!generatedAsset}
              className="p-3 bg-white hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed text-black rounded-full transition shadow-lg cursor-pointer"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
            </button>
            <div className="flex-grow flex items-center gap-3">
              <span className="text-xs font-mono text-white/40">00:00</span>
              {/* Progress Slider Bar */}
              <div 
                className="flex-grow h-2 bg-brand-bg rounded-full overflow-hidden relative border border-white/10 cursor-pointer"
                onClick={(e) => {
                  if (!videoRef.current) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const percentage = (e.clientX - rect.left) / rect.width;
                  videoRef.current.currentTime = percentage * videoRef.current.duration;
                  setVideoProgress(percentage * 100);
                }}
              >
                <div
                  className="absolute top-0 bottom-0 left-0 bg-blue-500 rounded-full"
                  style={{ width: `${videoProgress}%` }}
                />
              </div>
              <span className="text-xs font-mono text-blue-400 font-bold">
                {videoRef.current ? `00:0${Math.floor(videoRef.current.currentTime)}` : "00:00"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 bg-brand-item border border-white/5 hover:bg-white/5 rounded-lg text-white/60 hover:text-white cursor-pointer">
                <Volume2 className="w-4 h-4" />
              </button>
              <button className="p-2 bg-brand-item border border-white/5 hover:bg-white/5 rounded-lg text-white/60 hover:text-white cursor-pointer">
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-white/40">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-indigo-400" />
              <span>VEO AI engine requires higher credits for complex panoramic rotations.</span>
            </div>
            <p>1080p Cinematic HD Active</p>
          </div>
        </div>
      </div>
    </div>
  );
}
