import React, { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export const ImageDropzone = ({
  value = '',
  onChange,
  label = 'Upload Image',
  description = 'Drag & drop image here or browse from device (PNG, JPG, WEBP, SVG)',
  aspectRatio = 'square', // 'square' | 'video' | 'banner'
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState('');
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const fileInputRef = useRef(null);

  /**
   * Compress and downscale uploaded image file using an offscreen canvas.
   * This guarantees that data URLs are tiny (~15KB - 35KB) and avoids HTTP 413 (Content Too Large).
   */
  const compressImage = (file, maxWidth = 480, maxHeight = 480, quality = 0.72) => {
    return new Promise((resolve, reject) => {
      // SVG files are already lightweight vectors
      if (file.type === 'image/svg+xml') {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          const canvas = document.createElement('canvas');
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);

          // Export as JPEG with controlled quality
          let compressed = canvas.toDataURL('image/jpeg', quality);

          // If still > 50KB, compress further to prevent any 413 issues
          if (compressed.length > 50 * 1024) {
            compressed = canvas.toDataURL('image/jpeg', 0.55);
          }

          resolve(compressed);
        };
        img.onerror = () => reject(new Error('Failed to load image for compression.'));
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFile = async (file) => {
    setError('');
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WEBP, SVG, etc.).');
      return;
    }

    // Limit to 10MB input file
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size must be less than 10MB.');
      return;
    }

    try {
      const optimizedDataUrl = await compressImage(file, 480, 480, 0.72);
      if (onChange) {
        onChange(optimizedDataUrl);
      }
    } catch (err) {
      setError('Failed to process image file. Please try another image.');
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onChange) onChange('');
    setError('');
  };

  const previewClass =
    aspectRatio === 'banner'
      ? 'aspect-[21/9] w-full max-h-48'
      : aspectRatio === 'video'
      ? 'aspect-video w-full max-h-48'
      : 'w-24 h-24 sm:w-28 sm:h-28';

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-semibold text-brandText-main">
            {label}
          </label>
          <button
            type="button"
            onClick={() => setShowUrlFallback(!showUrlFallback)}
            className="text-[11px] text-forest-700 hover:text-forest-900 font-medium underline"
          >
            {showUrlFallback ? 'Hide URL link' : 'Or paste URL'}
          </button>
        </div>
      )}

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-4 transition-all cursor-pointer flex flex-col items-center justify-center text-center select-none ${
          isDragging
            ? 'border-forest-600 bg-forest-50/90 scale-[1.01] shadow-sm'
            : value
            ? 'border-brandBorder-subtle bg-surface-pure hover:border-forest-400'
            : 'border-brandBorder-subtle bg-surface-warm hover:border-forest-500 hover:bg-forest-50/40'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />

        {value ? (
          /* Preview state */
          <div className="flex flex-col sm:flex-row items-center gap-4 w-full">
            <div
              className={`${previewClass} rounded-2xl overflow-hidden bg-forest-50 border border-brandBorder-subtle shadow-xs flex-shrink-0 relative group`}
            >
              <img
                src={value}
                alt="Uploaded preview"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=400';
                }}
              />
            </div>

            <div className="flex-1 text-center sm:text-left space-y-1.5">
              <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs font-bold text-forest-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Image selected & attached</span>
              </div>
              <p className="text-[11px] text-brandText-secondary">
                Drag a new image over this box or click anywhere to replace it.
              </p>
              <div className="flex items-center justify-center sm:justify-start gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-forest-50 text-forest-800 hover:bg-forest-100 border border-forest-200 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3 text-forest-700" />
                  <span>Replace Image</span>
                </button>
                <button
                  type="button"
                  onClick={handleRemove}
                  className="px-3 py-1 rounded-xl text-xs font-bold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-colors flex items-center gap-1"
                >
                  <X className="w-3 h-3 text-rose-600" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Empty / Upload State */
          <div className="py-2.5 px-3 space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-forest-100/70 text-forest-700 flex items-center justify-center mx-auto shadow-xs group-hover:scale-105 transition-transform">
              {isDragging ? (
                <Upload className="w-6 h-6 animate-bounce text-forest-800" />
              ) : (
                <ImageIcon className="w-6 h-6 text-forest-700" />
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-forest-900">
                {isDragging ? 'Drop your image file here' : 'Drag & drop image here, or browse'}
              </p>
              <p className="text-[11px] text-brandText-muted mt-0.5 max-w-sm">
                {description}
              </p>
            </div>

            <div className="inline-flex items-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-xl bg-forest-800 text-white font-bold text-[11px] shadow-xs hover:bg-forest-900 transition-colors">
                Choose File
              </span>
              <span className="text-[10px] text-brandText-muted">Max 8MB</span>
            </div>
          </div>
        )}
      </div>

      {/* Optional URL input fallback */}
      {showUrlFallback && (
        <div className="pt-1 space-y-1">
          <input
            type="url"
            value={value}
            onChange={(e) => onChange && onChange(e.target.value)}
            placeholder="https://images.unsplash.com/... or paste image web link"
            className="w-full px-3 py-1.5 text-xs bg-surface-pure border border-brandBorder-subtle rounded-xl focus:outline-none focus:border-forest-500 font-mono"
          />
          <p className="text-[10px] text-brandText-muted">
            You can also paste a direct web image link here.
          </p>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-200">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};

export default ImageDropzone;
