/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from "react";
import { Camera, Image as ImageIcon, Upload, X, Check, ZoomIn, RefreshCw, Trash2 } from "lucide-react";
import { BRAND_ASSETS } from "../assets";
import { uploadProfilePictureToFirebase } from "../lib/firebase";

interface ProfilePictureUploaderProps {
  currentAvatarUrl?: string;
  onSaved: (newUrl: string) => void;
  userId: string;
}

interface BaseSize {
  width: number;
  height: number;
}

export default function ProfilePictureUploader({ currentAvatarUrl, onSaved, userId }: ProfilePictureUploaderProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showEditor, setShowEditor] = useState(false);
  const [selectedImageSrc, setSelectedImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [baseSize, setBaseSize] = useState<BaseSize>({ width: 200, height: 200 });
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState("");

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const editorContainerRef = useRef<HTMLDivElement>(null);

  // Reset states
  const resetEditor = () => {
    setSelectedImageSrc(null);
    setZoom(1);
    setOffset({ x: 0, y: 0 });
    setError("");
    setShowEditor(false);
  };

  // Handle selected file
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file.");
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setSelectedImageSrc(reader.result as string);
        setShowEditor(true);
        setShowOptions(false);
      };
      reader.onerror = () => {
        setError("Error reading the selected image.");
      };
      reader.readAsDataURL(file);
    }
  };

  // Determine base size to fit the image inside the 200px square (covering it)
  useEffect(() => {
    if (selectedImageSrc && showEditor) {
      const img = new Image();
      img.src = selectedImageSrc;
      img.onload = () => {
        const ratio = img.width / img.height;
        let width = 200;
        let height = 200;

        if (ratio > 1) {
          width = 200 * ratio;
        } else {
          height = 200 / ratio;
        }
        setBaseSize({ width, height });
        setOffset({ x: 0, y: 0 });
        setZoom(1);
      };
    }
  }, [selectedImageSrc, showEditor]);

  // Drag and reposition logic
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Constrain offsets based on size and zoom
    const maxBoundX = Math.max(0, (baseSize.width * zoom - 200) / 2);
    const maxBoundY = Math.max(0, (baseSize.height * zoom - 200) / 2);

    setOffset({
      x: Math.max(-maxBoundX, Math.min(maxBoundX, newX)),
      y: Math.max(-maxBoundY, Math.min(maxBoundY, newY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch handlers for mobile
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      const touch = e.touches[0];
      setDragStart({ x: touch.clientX - offset.x, y: touch.clientY - offset.y });
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || e.touches.length !== 1) return;
    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;

    const maxBoundX = Math.max(0, (baseSize.width * zoom - 200) / 2);
    const maxBoundY = Math.max(0, (baseSize.height * zoom - 200) / 2);

    setOffset({
      x: Math.max(-maxBoundX, Math.min(maxBoundX, newX)),
      y: Math.max(-maxBoundY, Math.min(maxBoundY, newY))
    });
  };

  // Crop & upload final picture
  const handleSaveCrop = async () => {
    if (!selectedImageSrc) return;
    setIsUploading(true);
    setError("");

    try {
      const img = new Image();
      img.src = selectedImageSrc;
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      const canvas = document.createElement("canvas");
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Clear background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 256, 256);

        // Apply same transformations on offscreen 256x256 canvas
        // (Move origin to center, translate, scale, draw)
        ctx.translate(128, 128);
        ctx.translate(offset.x * (256 / 200), offset.y * (256 / 200));
        ctx.scale(zoom, zoom);

        const drawWidth = baseSize.width * (256 / 200);
        const drawHeight = baseSize.height * (256 / 200);

        ctx.drawImage(img, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);

        // Compress and convert to JPEG blob
        canvas.toBlob(async (blob) => {
          if (blob) {
            try {
              const uploadedUrl = await uploadProfilePictureToFirebase(userId, blob);
              onSaved(uploadedUrl);
              resetEditor();
            } catch (err: any) {
              setError(err.message || "Upload failed. Please try again.");
              setIsUploading(false);
            }
          } else {
            setError("Could not process image crop canvas.");
            setIsUploading(false);
          }
        }, "image/jpeg", 0.85);
      } else {
        setError("Could not create drawing context.");
        setIsUploading(false);
      }
    } catch (err) {
      setError("Failed to render and compress image.");
      setIsUploading(false);
    }
  };

  const handleRemovePicture = () => {
    onSaved(BRAND_ASSETS.guestAvatar);
    setShowOptions(false);
  };

  const isCustomPictureSet = currentAvatarUrl && currentAvatarUrl !== BRAND_ASSETS.guestAvatar;

  return (
    <div id="profile-picture-uploader-container" className="flex flex-col items-center gap-4">
      {/* Target hidden inputs */}
      <input
        type="file"
        ref={cameraInputRef}
        onChange={handleFileChange}
        accept="image/*"
        capture="user"
        className="hidden"
      />
      <input
        type="file"
        ref={galleryInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />

      {/* Main interactive display */}
      <div className="relative group cursor-pointer" onClick={() => setShowOptions(true)}>
        <div className="w-24 h-24 rounded-2xl overflow-hidden border border-white/10 p-0.5 bg-gradient-to-tr from-blue-500 to-purple-500 shadow-xl relative transition-transform hover:scale-105">
          {currentAvatarUrl ? (
            <img src={currentAvatarUrl} alt="Avatar" className="w-full h-full object-cover rounded-xl" referrerPolicy="no-referrer" />
          ) : (
            <div className="w-full h-full rounded-xl bg-blue-600/10 text-blue-400 flex items-center justify-center font-bold text-lg uppercase border border-blue-500/20">
              <Camera className="w-8 h-8" />
            </div>
          )}
          {/* Overlay Hover */}
          <div className="absolute inset-0 bg-[#030712]/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-semibold rounded-xl gap-1">
            <Camera className="w-4 h-4 text-blue-400" />
            <span>Update</span>
          </div>
        </div>
        {/* Floating icon */}
        <div className="absolute -bottom-1 -right-1 p-1.5 bg-[#0e121e] border border-white/15 rounded-lg shadow-lg text-blue-400 transition hover:bg-white/5">
          <Camera className="w-3.5 h-3.5" />
        </div>
      </div>

      {/* Options Dropdown/Modal */}
      {showOptions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-xs bg-gradient-to-b from-[#0e121e] to-[#04060b] border border-white/10 rounded-2xl p-5 shadow-2xl relative">
            <button
              onClick={() => setShowOptions(false)}
              className="absolute right-3.5 top-3.5 text-white/40 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
            <h3 className="text-sm font-display font-bold text-white mb-4 pr-6">Change Profile Photo</h3>
            <div className="space-y-2">
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-white/5 hover:bg-blue-600/10 border border-white/5 hover:border-blue-500/30 text-left text-xs font-semibold text-white/90 hover:text-blue-400 rounded-xl transition flex items-center gap-3 cursor-pointer"
              >
                <Camera className="w-4 h-4 text-blue-400" />
                Take Photo / Open Camera
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="w-full py-2.5 px-4 bg-white/5 hover:bg-purple-600/10 border border-white/5 hover:border-purple-500/30 text-left text-xs font-semibold text-white/90 hover:text-purple-400 rounded-xl transition flex items-center gap-3 cursor-pointer"
              >
                <ImageIcon className="w-4 h-4 text-purple-400" />
                Choose from Gallery
              </button>
              {isCustomPictureSet && (
                <button
                  onClick={handleRemovePicture}
                  className="w-full py-2.5 px-4 bg-red-950/20 hover:bg-red-900/30 border border-red-950/30 text-left text-xs font-semibold text-red-400 rounded-xl transition flex items-center gap-3 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove Profile Photo
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Interactive Crop Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/95 backdrop-blur-md p-4">
          <div className="w-full max-w-sm bg-gradient-to-b from-[#0e121e] to-[#04060b] border border-white/10 rounded-3xl p-6 shadow-2xl relative space-y-6">
            <div className="text-center">
              <h3 className="text-base font-display font-black text-white">Crop & Reposition</h3>
              <p className="text-[10px] text-white/40 font-mono mt-1 uppercase tracking-widest">Drag inside the circle to pan</p>
            </div>

            {error && (
              <div className="p-2.5 bg-red-950/40 border border-red-500/30 rounded-xl text-[10px] text-red-200 text-center">
                {error}
              </div>
            )}

            {/* Viewport Box */}
            <div className="flex justify-center">
              <div
                ref={editorContainerRef}
                className="relative w-[200px] h-[200px] rounded-full border border-blue-500/40 overflow-hidden cursor-move bg-black select-none shadow-lg shadow-blue-500/5 touch-none"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleMouseUp}
              >
                {/* Background mask overlay */}
                <div className="absolute inset-0 rounded-full border-[3px] border-white/10 pointer-events-none z-10 shadow-inner" />
                {selectedImageSrc && (
                  <img
                    ref={imageRef}
                    src={selectedImageSrc}
                    alt="Editor preview"
                    className="absolute pointer-events-none origin-center"
                    style={{
                      width: baseSize.width,
                      height: baseSize.height,
                      left: "50%",
                      top: "50%",
                      transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px)) scale(${zoom})`,
                      maxWidth: "none",
                      maxHeight: "none"
                    }}
                    referrerPolicy="no-referrer"
                  />
                )}
              </div>
            </div>

            {/* Zoom Slider */}
            <div className="space-y-2 px-2">
              <div className="flex justify-between text-[10px] font-mono text-white/40 uppercase">
                <span className="flex items-center gap-1"><ZoomIn className="w-3 h-3 text-white/30" /> Zoom Level</span>
                <span className="text-blue-400 font-bold">{Math.round(zoom * 100)}%</span>
              </div>
              <input
                type="range"
                min="1"
                max="3"
                step="0.05"
                value={zoom}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  setZoom(val);
                }}
                className="w-full accent-blue-500 cursor-pointer bg-white/10 rounded-lg h-1.5 outline-none"
              />
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={resetEditor}
                disabled={isUploading}
                className="py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveCrop}
                disabled={isUploading}
                className="py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 rounded-xl text-xs font-bold text-white shadow-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isUploading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    Save & Apply
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
