'use client';

import React, { useState, useCallback } from 'react';

export default function ColorizerApp() {
  const [image, setImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [resultImage, setResultImage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [dragOver, setDragOver] = useState<boolean>(false);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      setImage(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResultImage('');
      setError('');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, []);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleColorize = async () => {
    if (!image) return setError('Please upload an image first!');
    if (!prompt.trim()) return setError('Please describe your color theme!');
    setLoading(true);
    setError('');
    setResultImage('');
    try {
      const formData = new FormData();
      formData.append('image', image);
      formData.append('prompt', prompt);
      const response = await fetch('/api/colorize', {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Something went wrong. Please try again.');
      }
      const blob = await response.blob();
      setResultImage(URL.createObjectURL(blob));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const suggestedPrompts = [
    { emoji: '🌸', label: 'Soft pastel anime colors' },
    { emoji: '🌆', label: 'Neon cyberpunk city lights' },
    { emoji: '🍂', label: 'Warm cozy autumn palette' },
    { emoji: '🌊', label: 'Ocean blue watercolor style' },
    { emoji: '🌈', label: 'Vibrant rainbow pop art' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 text-white font-sans">
      <header className="text-center py-10 px-4">
        <h1 className="text-4xl md:text-6xl font-extrabold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400 bg-clip-text text-transparent mb-3">
          ✨ AI Color Studio
        </h1>
        <p className="text-slate-400 text-base md:text-lg max-w-xl mx-auto">
          Upload any black-and-white sketch, pick a color theme, and watch AI bring it to life in seconds — completely free.
        </p>
      </header>
      <main className="max-w-6xl mx-auto px-4 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-purple-400 font-bold uppercase tracking-widest text-xs mb-3">
                Step 1 — Upload Your Sketch
              </h2>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                  dragOver ? 'border-purple-400 bg-purple-900/20' : 'border-slate-600 hover:border-purple-500'
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                {previewUrl ? (
                  <div>
                    <img src={previewUrl} alt="Your uploaded sketch" className="max-h-56 mx-auto rounded-lg object-contain" />
                    <p className="text-slate-400 text-xs mt-3">Click or drag to replace</p>
                  </div>
                ) : (
                  <div className="text-slate-400 py-6">
                    <div className="text-5xl mb-3">🖼️</div>
                    <p className="font-semibold text-white">Drag & drop your image here</p>
                    <p className="text-sm mt-1">or click anywhere in this box to browse files</p>
                    <p className="text-xs mt-3 text-slate-500">Supports PNG, JPG, WebP · Black & white works best</p>
                  </div>
                )}
              </div>
            </div>
            <div className="bg-slate-800 rounded-2xl p-6 shadow-xl">
              <h2 className="text-pink-400 font-bold uppercase tracking-widest text-xs mb-3">
                Step 2 — Choose Your Color Theme
              </h2>
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='e.g. "soft pastel anime colors" or "neon cyberpunk city"'
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 transition text-sm"
              />
              <p className="text-slate-500 text-xs mt-2 mb-3">Quick suggestions — click one:</p>
              <div className="flex flex-wrap gap-2">
                {suggestedPrompts.map(({ emoji, label }) => (
                  <button
                    key={label}
                    onClick={() => setPrompt(label)}
                    className="bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-3 py-1.5 rounded-full transition"
                  >
                    {emoji} {label}
                  </button>
                ))}
              </div>
            </div>
            {error && (
              <div className="bg-red-900/50 border border-red-500 text-red-300 rounded-xl px-4 py-3 text-sm">
                ⚠️ {error}
              </div>
            )}
            <button
              onClick={handleColorize}
              disabled={loading || !image}
              className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl shadow-lg transform active:scale-95 transition-all text-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="animate-spin">⚙️</span>
                  AI is painting your artwork...
                </span>
              ) : (
                '🪄  Colorize My Artwork!'
              )}
            </button>
            {loading && (
              <p className="text-center text-slate-400 text-sm animate-pulse">
                This usually takes 15–30 seconds. Hang tight! ☕
              </p>
            )}
          </div>
          <div className="bg-slate-800 rounded-2xl p-6 shadow-xl flex flex-col">
            <h2 className="text-emerald-400 font-bold uppercase tracking-widest text-xs mb-4">
              Step 3 — Your Colorized Result
            </h2>
            <div className="flex-1 flex items-center justify-center border border-slate-700 rounded-xl bg-slate-900 min-h-72 overflow-hidden">
              {resultImage ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 p-4">
                  <img src={resultImage} alt="AI Colorized Result" className="max-h-80 w-full object-contain rounded-xl shadow-2xl" />
                  <a
                    href={resultImage}
                    download="ai-colorized-artwork.png"
                    className="bg-emerald-500 hover:bg-emerald-400 text-white font-bold px-8 py-3 rounded-xl shadow-lg transition text-sm"
                  >
                    💾 Download Your Artwork (Free!)
                  </a>
                </div>
              ) : loading ? (
                <div className="text-center text-slate-400 p-8 space-y-3">
                  <div className="text-5xl animate-bounce">🎨</div>
                  <p className="font-semibold">The AI is working its magic...</p>
                </div>
              ) : (
                <div className="text-center text-slate-600 p-8">
                  <div className="text-5xl mb-3 opacity-40">🖌️</div>
                  <p className="font-medium text-slate-500">Your colorized image will appear here</p>
                  <p className="text-xs text-slate-600 mt-2">Upload a sketch and click Colorize to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="mt-12 bg-slate-800 rounded-2xl p-8 shadow-xl">
          <h2 className="text-center text-xl font-bold text-white mb-6">How It Works — Behind the Scenes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            {[
              { icon: '📤', title: 'You Upload', desc: 'Your sketch is sent securely to our AI pipeline. Nothing is stored or saved.' },
              { icon: '🤖', title: 'AI Processes', desc: "Hugging Face's free cloud servers colorize your image based on your theme." },
              { icon: '🎨', title: 'You Get Art', desc: 'The finished full-color image is sent back to you, ready to download free.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="bg-slate-900 rounded-xl p-5">
                <div className="text-4xl mb-3">{icon}</div>
                <h3 className="font-bold text-white mb-2">{title}</h3>
                <p className="text-slate-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
