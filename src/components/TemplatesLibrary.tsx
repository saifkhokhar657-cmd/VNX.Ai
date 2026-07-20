/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Grid, Eye, Edit2, Download, Check, Sparkles, Filter, ChevronRight, X, RefreshCw } from "lucide-react";

interface Template {
  id: string;
  name: string;
  category: string;
  description: string;
  imageUrl: string;
  isPremium: boolean;
  colors: string[];
}

export default function TemplatesLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [editTitle, setEditTitle] = useState("Vivid Creative");
  const [editColor, setEditColor] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [isExported, setIsExported] = useState(false);

  const categories = [
    "All", "Social Media", "Live Streaming", "Gaming", 
    "Business", "Islamic", "Education", "Ecommerce", 
    "Mobile Apps", "YouTube", "TikTok"
  ];

  const templates: Template[] = [
    {
      id: "temp-1",
      name: "Cyber Stream Banner",
      category: "Live Streaming",
      description: "Esports overlay frame with animated neon lines",
      imageUrl: "https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=400&q=80",
      isPremium: true,
      colors: ["#2563EB", "#8B5CF6"]
    },
    {
      id: "temp-2",
      name: "Islamic Arabesque Geometry",
      category: "Islamic",
      description: "Exquisite symmetrical geometric arabesque backdrop",
      imageUrl: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?auto=format&fit=crop&w=400&q=80",
      isPremium: false,
      colors: ["#D97706", "#047857"]
    },
    {
      id: "temp-3",
      name: "Esports Tournament Intro",
      category: "Gaming",
      description: "High-octane intro logo frame with dark obsidian themes",
      imageUrl: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?auto=format&fit=crop&w=400&q=80",
      isPremium: true,
      colors: ["#EF4444", "#1E293B"]
    },
    {
      id: "temp-4",
      name: "E-commerce Product Showcase",
      category: "Ecommerce",
      description: "Clean layout, dynamic drop shadows, floating product frame",
      imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=400&q=80",
      isPremium: false,
      colors: ["#0062FF", "#10B981"]
    },
    {
      id: "temp-5",
      name: "SaaS Mobile App UI Header",
      category: "Mobile Apps",
      description: "Responsive banner headers with mockup vector structures",
      imageUrl: "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?auto=format&fit=crop&w=400&q=80",
      isPremium: true,
      colors: ["#06B6D4", "#3B82F6"]
    },
    {
      id: "temp-6",
      name: "Education Webinar Slide",
      category: "Education",
      description: "Engaging corporate academic template layout",
      imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80",
      isPremium: false,
      colors: ["#10B981", "#3B82F6"]
    },
    {
      id: "temp-7",
      name: "YouTube Cyberpunk Thumbnail",
      category: "YouTube",
      description: "High impact visual frame with editable titles",
      imageUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=400&q=80",
      isPremium: true,
      colors: ["#EC4899", "#8B5CF6"]
    }
  ];

  const filteredTemplates = templates.filter((t) => {
    const matchesSearch = t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || t.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExport = () => {
    setIsExporting(true);
    setIsExported(false);
    setTimeout(() => {
      setIsExporting(false);
      setIsExported(true);
      setTimeout(() => {
        setIsExported(false);
        setActiveTemplate(null);
      }, 2000);
    }, 1200);
  };

  return (
    <div id="templates-library-container" className="space-y-6 text-white font-sans">
      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-brand-card border border-white/10 p-5 rounded-3xl">
        <div className="relative w-full md:w-80">
          <Search className="absolute left-3 top-3 w-4 h-4 text-white/40" />
          <input
            type="text"
            placeholder="Search premium templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-brand-bg border border-white/10 rounded-xl py-2 pl-10 pr-4 text-xs text-white placeholder-white/20 focus:border-blue-500 outline-none transition"
          />
        </div>
        
        {/* Category horizontal scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 scrollbar-none">
          <Filter className="w-4 h-4 text-white/40 mr-1 flex-shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition flex-shrink-0 cursor-pointer ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/15"
                  : "bg-brand-item border border-white/5 text-white/40 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid displays */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredTemplates.map((template) => (
          <motion.div
            key={template.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="group bg-brand-card border border-white/10 hover:border-blue-500/30 rounded-2xl overflow-hidden flex flex-col justify-between transition-all duration-300 relative"
          >
            {/* Visual Header */}
            <div className="relative aspect-video overflow-hidden">
              <img
                src={template.imageUrl}
                alt={template.name}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-60" />
              {template.isPremium && (
                <span className="absolute top-2.5 right-2.5 py-1 px-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-[9px] font-bold text-white rounded-md tracking-wider uppercase">
                  Pro Template
                </span>
              )}
            </div>

            {/* Info details */}
            <div className="p-4 space-y-3 flex-grow flex flex-col justify-between">
              <div>
                <span className="text-[9px] font-semibold text-purple-400 uppercase tracking-widest block font-mono">{template.category}</span>
                <h4 className="text-sm font-display font-bold text-white mt-1 group-hover:text-blue-400 transition">{template.name}</h4>
                <p className="text-[11px] text-white/40 mt-1 line-clamp-2">{template.description}</p>
              </div>

              {/* Interaction buttons */}
              <div className="flex gap-2 pt-2 border-t border-white/10">
                <button
                  onClick={() => {
                    setActiveTemplate(template);
                    setEditTitle(template.name);
                    setEditColor(template.colors[0]);
                    setIsExported(false);
                    setIsExporting(false);
                  }}
                  className="flex-1 py-1.5 bg-brand-item hover:bg-white/5 text-white/70 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-white/5 cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Customize
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Editor Modal Overlay */}
      <AnimatePresence>
        {activeTemplate && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-3xl bg-brand-card border border-white/10 rounded-3xl overflow-hidden p-6 relative"
            >
              <button
                onClick={() => setActiveTemplate(null)}
                className="p-2 bg-brand-item border border-white/10 text-white/40 hover:text-white rounded-xl absolute top-6 right-6 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>

              <h3 className="text-sm font-display font-bold uppercase tracking-wider text-white/40 mb-6 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-400" />
                Template Sandbox Studio
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Visual Preview */}
                <div className="md:col-span-7 aspect-video relative rounded-2xl overflow-hidden border border-white/10 bg-[#050508] flex items-center justify-center">
                  <img
                    src={activeTemplate.imageUrl}
                    alt={activeTemplate.name}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover opacity-60"
                  />
                  {/* Realtime Canvas Text projection */}
                  <div className="absolute inset-0 flex flex-col justify-center items-center p-4 bg-gradient-to-tr from-[#050508]/90 to-transparent">
                    <motion.h2
                      style={{ color: editColor }}
                      className="text-xl font-display font-black tracking-wider uppercase text-center drop-shadow-lg"
                    >
                      {editTitle}
                    </motion.h2>
                    <p className="text-[10px] text-white/40 mt-1 uppercase tracking-widest font-mono">{activeTemplate.description}</p>
                  </div>
                </div>

                {/* Editor adjustments */}
                <div className="md:col-span-5 space-y-5">
                  <div>
                    <label className="block text-[10px] font-semibold text-white/40 uppercase mb-1.5 tracking-wider">Primary Title Text</label>
                    <input
                      type="text"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      className="w-full bg-brand-bg border border-white/10 rounded-xl py-2 px-3 text-xs text-white placeholder-white/20 focus:border-blue-500 outline-none transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-white/40 uppercase mb-1.5 tracking-wider">Color Accent Schema</label>
                    <div className="flex gap-2">
                      {["#3B82F6", "#8B5CF6", "#10B981", "#F59E0B", "#EF4444", "#EC4899"].map((col) => (
                        <button
                          key={col}
                          onClick={() => setEditColor(col)}
                          style={{ backgroundColor: col }}
                          className={`w-6 h-6 rounded-full border-2 transition cursor-pointer ${
                            editColor === col ? "border-white scale-110" : "border-transparent hover:scale-105"
                          }`}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <button
                      onClick={handleExport}
                      disabled={isExporting || isExported}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl text-xs flex items-center justify-center gap-1.5 transition cursor-pointer disabled:opacity-80"
                    >
                      {isExporting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>Generating layers...</span>
                        </>
                      ) : isExported ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-400 animate-bounce" />
                          <span>Vector Saved successfully!</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4" />
                          <span>Export Layered Package</span>
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => setActiveTemplate(null)}
                      className="w-full py-2 bg-transparent hover:bg-white/5 border border-white/10 text-white/60 font-semibold rounded-xl text-xs transition cursor-pointer"
                    >
                      Close Editor
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
