/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Upload, File, ArrowRight, Check, Download, AlertCircle, RefreshCw, FileText, Settings2, Trash2 } from "lucide-react";

interface FileConverterProps {
  onConvert: (data: {
    sourceFormat: string;
    targetFormat: string;
    filename: string;
    size: string;
  }) => Promise<{ convertedFileName: string; targetFormat: string; downloadUrl: string; message: string }>;
  isLoading: boolean;
}

export default function FileConverter({ onConvert, isLoading }: FileConverterProps) {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [sourceFormat, setSourceFormat] = useState("");
  const [targetFormat, setTargetFormat] = useState("WebP");
  const [conversionResult, setConversionResult] = useState<any>(null);
  const [convertProgress, setConvertProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const formats = ["PNG", "JPG", "JPEG", "SVG", "WebP", "PDF", "GIF", "MP4", "WebM", "Lottie", "SVGA"];

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processSelectedFile(e.target.files[0]);
    }
  };

  const processSelectedFile = (selectedFile: File) => {
    setFile(selectedFile);
    const extension = selectedFile.name.split(".").pop()?.toUpperCase() || "";
    setSourceFormat(extension);
    setConversionResult(null);
    setConvertProgress(0);
  };

  const handleConvertAction = async () => {
    if (!file || !sourceFormat || !targetFormat) return;
    setConversionResult(null);
    setConvertProgress(10);

    const progressInterval = setInterval(() => {
      setConvertProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 15;
      });
    }, 150);

    try {
      const result = await onConvert({
        sourceFormat,
        targetFormat,
        filename: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`
      });
      clearInterval(progressInterval);
      setConvertProgress(100);
      setConversionResult(result);
    } catch (err) {
      clearInterval(progressInterval);
      setConvertProgress(0);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div id="file-converter-container" className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full text-white">
      {/* Upload area and selectors */}
      <div className="lg:col-span-7 bg-brand-card border border-white/10 rounded-3xl p-6 flex flex-col justify-between">
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <h3 className="text-xs font-display font-semibold tracking-wider text-white/40 uppercase flex items-center gap-2">
              <Upload className="w-4 h-4 text-blue-400" />
              Upload Source File
            </h3>
            {file && (
              <button
                onClick={() => { setFile(null); setConversionResult(null); }}
                className="text-xs text-red-400 hover:text-red-300 transition flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear File
              </button>
            )}
          </div>

          {/* Drag & drop box */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            onClick={triggerFileInput}
            className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center min-h-[220px] ${
              dragActive 
                ? "border-blue-500 bg-blue-600/5 shadow-inner" 
                : file 
                  ? "border-white/10 bg-brand-item" 
                  : "border-white/10 hover:border-white/20 bg-brand-bg"
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            
            {file ? (
              <div className="space-y-3">
                <div className="inline-flex p-3 bg-blue-600/10 rounded-xl border border-blue-500/20 text-blue-400">
                  <File className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white max-w-[280px] truncate mx-auto">{file.name}</p>
                  <p className="text-xs text-white/40 font-mono mt-0.5">{(file.size / 1024).toFixed(1)} KB • {sourceFormat}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="inline-flex p-3 bg-white/5 rounded-xl border border-white/10 text-white/40">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <p className="text-xs text-white/60">Drag and drop file here, or click to browse</p>
                  <p className="text-[10px] text-white/30 mt-1 uppercase tracking-widest">Supports PNG, JPG, SVG, Lottie, WebM, etc.</p>
                </div>
              </div>
            )}
          </div>

          {/* Conversion flow picker */}
          {file && (
            <div className="grid grid-cols-1 md:grid-cols-12 items-center gap-4 bg-brand-item border border-white/5 p-4 rounded-2xl">
              <div className="md:col-span-5 text-center">
                <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Source Format</span>
                <span className="py-1 px-3 bg-brand-bg border border-white/10 rounded-lg text-xs font-bold text-white uppercase font-mono">
                  {sourceFormat}
                </span>
              </div>
              <div className="md:col-span-2 flex justify-center text-white/30">
                <ArrowRight className="w-5 h-5 animate-pulse" />
              </div>
              <div className="md:col-span-5 text-center">
                <span className="text-[10px] text-white/40 uppercase tracking-widest block mb-1">Target Format</span>
                <select
                  value={targetFormat}
                  onChange={(e) => setTargetFormat(e.target.value)}
                  className="bg-brand-bg border border-white/10 text-xs font-bold text-white rounded-lg py-1 px-3 outline-none uppercase font-mono cursor-pointer"
                >
                  {formats.filter(f => f !== sourceFormat).map((f) => (
                    <option key={f} value={f} className="bg-[#0a0a0f]">{f}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {file && (
          <button
            onClick={handleConvertAction}
            disabled={isLoading || !targetFormat}
            className="w-full py-4 mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:opacity-90 text-white font-bold rounded-2xl shadow-xl flex items-center justify-center gap-2 transition disabled:opacity-50 cursor-pointer"
          >
            {isLoading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Converting Codes... {convertProgress}%</span>
              </>
            ) : (
              <>
                <Settings2 className="w-5 h-5" />
                <span>Execute File Conversion (-2 Credits)</span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Target status workspace */}
      <div className="lg:col-span-5 bg-brand-card border border-white/10 rounded-3xl p-6 flex flex-col justify-between min-h-[420px]">
        <div>
          <h3 className="text-sm font-display font-semibold tracking-wider text-white/40 uppercase mb-4 flex items-center gap-2 border-b border-white/10 pb-3">
            <FileText className="w-4 h-4 text-purple-400" />
            Conversion Target Sandbox
          </h3>

          <AnimatePresence mode="wait">
            {isLoading ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-6 text-center py-12"
              >
                <div className="relative inline-block mx-auto">
                  <div className="w-16 h-16 rounded-full border-4 border-purple-500/15 border-t-purple-500 animate-spin" />
                  <File className="w-6 h-6 text-purple-400 absolute inset-0 m-auto animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Recoding Pixel Matrices</h4>
                  <div className="w-full bg-brand-bg h-2 rounded-full overflow-hidden max-w-[200px] mx-auto mt-2.5 border border-white/10">
                    <div className="bg-purple-500 h-full rounded-full" style={{ width: `${convertProgress}%` }} />
                  </div>
                  <p className="text-[10px] text-white/40 mt-1.5 font-mono">CONVERTER: {sourceFormat} → {targetFormat}</p>
                </div>
              </motion.div>
            ) : conversionResult ? (
              <motion.div
                key="completed"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5 py-6 text-center"
              >
                <div className="inline-flex p-4 bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 rounded-2xl">
                  <Check className="w-10 h-10 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white">Conversion Succeeded!</h4>
                  <p className="text-xs text-white/40 mt-1">{conversionResult.message}</p>
                </div>
                <div className="bg-brand-item p-4 rounded-xl border border-white/10 inline-block w-full max-w-xs text-left">
                  <p className="text-xs text-white/60 truncate"><span className="font-semibold text-white">Asset:</span> {conversionResult.convertedFileName}</p>
                  <p className="text-xs text-white/60 mt-1"><span className="font-semibold text-white">Target format:</span> {conversionResult.targetFormat}</p>
                </div>
                <div className="pt-2">
                  <a
                    href={conversionResult.downloadUrl}
                    download={conversionResult.convertedFileName}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    Download Converted Asset
                  </a>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center text-white/30 py-12"
              >
                <div className="inline-flex p-3 bg-white/5 rounded-full border border-white/10 mb-2">
                  <FileText className="w-6 h-6 text-white/20" />
                </div>
                <h5 className="text-xs font-semibold text-white/40">Awaiting Conversion Execution</h5>
                <p className="text-[10px] text-white/40 mt-1 max-w-[200px] mx-auto font-sans">
                  Drag files to the left and select target parameters to process on server proxy layers.
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="border-t border-white/10 pt-3 text-[10px] text-white/40 flex items-center gap-1.5 justify-center">
          <AlertCircle className="w-3.5 h-3.5 text-blue-400" />
          <span>All visual rendering is handled securely inside dedicated Web Workers.</span>
        </div>
      </div>
    </div>
  );
}
