'use client';

import React, { useState, useRef } from 'react';
import { Upload, X, CheckSquare, Sparkles, AlertCircle } from 'lucide-react';
import { Language, TRANSLATIONS } from '@/lib/translations';

interface CustomRequestFormProps {
  language: Language;
  onSubmitSuccess: (requestId: string) => void;
}

const PRESET_COLOURS = [
  { name: 'Soft Blush Pink', hex: '#FFD6E7' },
  { name: 'Korean Syrup Glass', hex: '#FFCCD5' },
  { name: 'Jade Quartz Marble', hex: '#E2F0D9' },
  { name: 'Oyster Pearl Chrome', hex: '#F0F3F4' },
  { name: 'Burgundy Velvet Gold', hex: '#581845' },
  { name: 'Matcha Cream Glaze', hex: '#D5F5E3' },
];

const NAIL_SHAPES = ['Almond', 'Coffin', 'Square', 'Oval', 'Round', 'Stiletto'];
const NAIL_LENGTHS = ['Short', 'Medium', 'Long', 'Extra Long'];

export default function CustomRequestForm({ language, onSubmitSuccess }: CustomRequestFormProps) {
  const t = TRANSLATIONS[language];
  
  const [nailShape, setNailShape] = useState('Almond');
  const [nailLength, setNailLength] = useState('Medium');
  const [colorPreference, setColorPreference] = useState('Soft Blush Pink');
  const [customColor, setCustomColor] = useState('');
  const [notes, setNotes] = useState('');
  const [referenceImage, setReferenceImage] = useState<string>(''); // base64 representation
  const [imageName, setImageName] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [newRequestId, setNewRequestId] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert File to Base64
  const processFile = (file: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file.');
      return;
    }
    setImageName(file.name);
    setError('');

    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setReferenceImage(e.target.result as string);
      }
    };
    reader.onerror = () => {
      setError('Failed to read image file.');
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      processFile(files[0]);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  const removeImage = () => {
    setReferenceImage('');
    setImageName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referenceImage) {
      setError('A reference image of your desired nail art is required.');
      return;
    }

    setLoading(true);
    setError('');

    const finalColor = customColor ? `${colorPreference} (${customColor})` : colorPreference;

    try {
      const response = await fetch('/api/custom-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nailShape,
          nailLength,
          colorPreference: finalColor,
          notes,
          referenceImage
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(true);
        setNewRequestId(data.id);
        onSubmitSuccess(data.id);
      } else {
        setError(data.error || 'Failed to submit design request');
      }
    } catch (err) {
      setError('Connection failure. Could not transfer design files.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-3xl border border-gray-105 shadow-sm overflow-hidden" id="custom-nail-form-container">
      
      {/* Form Top Banner */}
      <div className="bg-[#FFD6E7]/20 border-b border-gray-100 px-6 py-10 text-center text-gray-900 relative">
        <span className="p-2.5 bg-white rounded-full inline-block mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
          <Sparkles className="w-5 h-5 text-[#FF5FA2]" />
        </span>
        <h2 className="font-serif text-2xl sm:text-3xl font-medium tracking-tight text-gray-900">
          {t.customNailForm}
        </h2>
        <p className="text-xs text-gray-500 mt-2 max-w-xl mx-auto leading-relaxed">
          {language === 'km' 
            ? 'បញ្ចូលរូបភាពរបស់ក្រចកដែលលោកអ្នកប្រាថ្នា ចងក្រងទំហំ និងរង់ចាំការវាយតម្លៃតម្លៃពីជាងជំនាញ!' 
            : 'Design your dream press-ons! Simply upload a photo of your desired nail art, select your preferences, and receive a direct approval & price quote from Beauty Things.'}
        </p>
      </div>

      {success ? (
        <div className="p-8 text-center" id="custom-req-success-card">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <CheckSquare className="w-6 h-6 text-emerald-500" />
          </div>
          <h3 className="text-xl font-serif font-medium text-gray-900">{t.customSuccessTitle}</h3>
          <p className="text-gray-500 text-xs mt-3 leading-relaxed max-w-md mx-auto">
            {t.customSuccessDesc}
          </p>
          <div className="bg-gray-50 rounded-2xl p-4.5 max-w-xs mx-auto border border-gray-100 mt-6 text-xs text-gray-700">
            REQUEST ID: <span className="font-bold text-[#FF5FA2] tracking-wider">{newRequestId}</span>
          </div>
          <button
            onClick={() => {
              // Reset values
              setSuccess(false);
              setNotes('');
              removeImage();
            }}
            className="mt-8 bg-gray-900 hover:bg-black text-white text-xs font-bold uppercase tracking-widest px-8 py-3.5 rounded-full transition-colors cursor-pointer"
          >
            Create Another Request
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6">
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-2 text-sm text-red-600 animate-headShake" id="custom-form-error">
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* DRAG AND DROP REFERENCE IMAGE UPLOAD */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-stone-800">{t.referenceImage} *</label>
            <div
              id="drop-zone-upload"
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={triggerFileInput}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-primary bg-pink-50/50 scale-[0.99]'
                  : referenceImage
                  ? 'border-[#D4A373] bg-amber-50/10'
                  : 'border-pink-200 bg-stone-50/30 hover:bg-stone-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="custom-file-uploader-input"
              />

              {referenceImage ? (
                <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                  <img
                    src={referenceImage}
                    alt="Reference Preview"
                    className="max-h-48 rounded-lg shadow-md mx-auto border border-stone-200 object-cover"
                    id="uploaded-refer-preview"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:bg-red-600 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                  <p className="text-xs text-stone-500 mt-2 font-mono truncate max-w-xs mx-auto">
                    {imageName || 'reference_nails.png'}
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <span className="p-3 bg-pink-50 rounded-full inline-block text-primary">
                    <Upload className="w-6 h-6" />
                  </span>
                  <div className="text-sm">
                    <span className="text-primary font-bold">{language === 'km' ? 'ចុចទីនេះដើម្បីបញ្ចូល' : 'Click to select'}</span> {language === 'km' ? 'ឬ អូសរូបភាពទម្លាក់' : 'or drag and drop'}
                  </div>
                  <p className="text-xs text-stone-400">
                    Supports PNG, JPG, JPEG (Max 10MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            {/* Shape selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-550">{t.shape}</label>
              <div className="grid grid-cols-3 gap-2">
                {NAIL_SHAPES.map((shape) => (
                  <button
                    key={shape}
                    type="button"
                    onClick={() => setNailShape(shape)}
                    className={`py-2 text-xs font-semibold rounded-2xl border transition-all cursor-pointer ${
                      nailShape === shape
                        ? 'bg-primary text-white border-primary shadow-none'
                        : 'border-gray-100 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {shape}
                  </button>
                ))}
              </div>
            </div>

            {/* Length selection */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-550">{t.length}</label>
              <div className="grid grid-cols-2 gap-2">
                {NAIL_LENGTHS.map((len) => (
                  <button
                    key={len}
                    type="button"
                    onClick={() => setNailLength(len)}
                    className={`py-2 text-xs font-semibold rounded-2xl border transition-all cursor-pointer ${
                      nailLength === len
                        ? 'bg-primary text-white border-primary shadow-none'
                        : 'border-gray-100 hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    {len}
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Color scheme options */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-550">{t.colorPreference}</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {PRESET_COLOURS.map((col) => (
                <button
                  key={col.name}
                  type="button"
                  onClick={() => {
                    setColorPreference(col.name);
                    setCustomColor('');
                  }}
                  className={`p-3 rounded-2xl border text-left flex flex-col items-center justify-between space-y-1.5 transition-all cursor-pointer ${
                    colorPreference === col.name && !customColor
                      ? 'border-[#FF5FA2] bg-[#FFD6E7]/25 font-bold'
                      : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <span
                    className="w-10 h-10 rounded-full border border-gray-100 shadow-sm"
                    style={{ backgroundColor: col.hex }}
                  />
                  <span className="text-[10px] text-center text-gray-650 font-medium truncate w-full mt-1.5">
                    {col.name}
                  </span>
                </button>
              ))}
            </div>
            
            <div className="mt-2 text-xs">
              <span className="text-gray-500 font-medium">{language === 'km' ? 'ឬ បញ្ចូលពណ៌លម្អិតរបស់អ្នក៖' : 'Or specify custom color accents:'}</span>
              <input
                type="text"
                value={customColor}
                onChange={(e) => {
                  setCustomColor(e.target.value);
                  setColorPreference('Custom Shade');
                }}
                placeholder={language === 'km' ? 'ឧ. ពណ៌ផ្កាឈូរីក្រាស់, លាបក្រូមេ...' : 'e.g. Neon cherry gradient with gold dust'}
                className="w-full mt-1.5 px-3 py-2 text-xs rounded-xl border border-gray-150 focus:outline-[#FF5FA2] focus:border-primary bg-stone-50/20"
              />
            </div>
          </div>

          {/* Custom notes */}
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-stone-800">{t.customNotes}</label>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={language === 'km' ? 'សូមបញ្ចូលទំហំក្រចក (មេដៃ-កូនដៃ) និងបំណងបន្ថែម ដូចជា ដាក់ខ្សែក្បូរក្បាច់ គុជខ្យង ...' : t.sizeNotesPlaceholder}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-stone-200 focus:outline-[#FF5FA2] focus:border-primary"
              id="txt-custom-notes"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg text-white font-bold text-sm shadow-md transition-all flex items-center justify-center space-x-2 ${
              loading 
                ? 'bg-pink-300 cursor-not-allowed' 
                : 'bg-[#FF5FA2] hover:bg-pink-600 hover:shadow-lg active:scale-[0.99] cursor-pointer'
            }`}
            id="btn-custom-form-submit"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Submitting request files...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-amber-200" />
                <span>{t.submitRequest}</span>
              </>
            )}
          </button>
        </form>
      )}

    </div>
  );
}
