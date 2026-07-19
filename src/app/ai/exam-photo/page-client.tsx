'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { ShieldCheck, FileType, Info, Trash2, Camera, UserCircle } from 'lucide-react'

type Preset = 'ssc' | 'upsc' | 'neet' | 'jee' | 'passport' | 'visa' | 'signature'

interface PresetConfig {
  label: string;
  width: number; // in mm or aspect ratio
  height: number;
  minKB: number;
  maxKB: number;
  unit: 'mm' | 'px' | 'ratio';
}

const PRESETS: Record<Preset, PresetConfig> = {
  ssc: { label: 'SSC Photo', width: 35, height: 45, minKB: 20, maxKB: 50, unit: 'mm' },
  upsc: { label: 'UPSC Photo', width: 35, height: 45, minKB: 20, maxKB: 300, unit: 'mm' },
  neet: { label: 'NEET Postcard', width: 4, height: 6, minKB: 10, maxKB: 200, unit: 'ratio' },
  jee: { label: 'JEE Photo', width: 35, height: 45, minKB: 10, maxKB: 200, unit: 'mm' },
  passport: { label: 'US Passport', width: 2, height: 2, minKB: 0, maxKB: 1000, unit: 'ratio' },
  visa: { label: 'Schengen Visa', width: 35, height: 45, minKB: 0, maxKB: 1000, unit: 'mm' },
  signature: { label: 'Signature', width: 3, height: 1, minKB: 10, maxKB: 20, unit: 'ratio' },
}

export default function ExamPhoto() {
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const cropperRef = useRef<Cropper | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preset, setPreset] = useState<Preset>('ssc')
  const [quality] = useState(0.9)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  useEffect(() => {
    if (imageRef.current && imageUrl) {
      if (cropperRef.current) cropperRef.current.destroy();
      
      const config = PRESETS[preset]
      const ratio = config.width / config.height

      cropperRef.current = new Cropper(imageRef.current, {
        aspectRatio: ratio,
        viewMode: 1,
        guides: true,
        center: true,
        highlight: false,
        background: false,
        autoCropArea: 0.8,
      });
    }
  }, [imageUrl, preset])

  const handleProcess = () => {
    if (!cropperRef.current || !file) return
    setIsProcessing(true)
    
    const config = PRESETS[preset]
    const canvasOptions: Cropper.GetCroppedCanvasOptions = {}
    
    if (config.unit === 'mm') {
      // 3.78 pixels per mm at 96 DPI
      canvasOptions.width = config.width * 3.78
      canvasOptions.height = config.height * 3.78
    }

    const canvas = cropperRef.current.getCroppedCanvas(canvasOptions)
    
    const attemptCompression = (q: number) => {
      canvas.toBlob((blob) => {
        if (blob) {
          const kb = blob.size / 1024
          if (kb > config.maxKB && q > 0.1) {
            attemptCompression(q - 0.1)
          } else {
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `Docuvate-${preset}-${file.name}`
            a.click()
            setIsProcessing(false)
          }
        }
      }, 'image/jpeg', q)
    }

    attemptCompression(quality)
  }

  if (!file || !imageUrl) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">Exam Photo Resizer</h1>
        <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">Regulated cropping tool for official registrations. Automatically handles dimensions and KB limits for SSC, UPSC, and more.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/*" multiple={false} theme="blue" label="Select Photo or Signature" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Download Compliant Image" colorTheme="blue" isProcessing={isProcessing} sidebarContent={
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2 mb-4">
            <ShieldCheck className="w-4 h-4 text-blue-500" /> Board Preset
          </h3>
          <div className="grid grid-cols-1 gap-2">
            {(Object.keys(PRESETS) as Preset[]).map((p) => (
              <button 
                key={p} 
                onClick={() => setPreset(p)} 
                className={`text-left px-4 py-2.5 rounded-lg border text-xs font-bold transition-all flex items-center justify-between ${preset === p ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >
                <span>{PRESETS[p].label}</span>
                {preset === p && <CheckCircle2 className="w-3.5 h-3.5" />}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 space-y-3">
           <h4 className="text-[10px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
             <Info className="w-3 h-3" /> Requirements
           </h4>
           <div className="space-y-1.5">
             <div className="flex justify-between text-xs">
               <span className="text-blue-600/70 font-medium">Dimensions:</span>
               <span className="text-blue-900 font-bold">{PRESETS[preset].width} x {PRESETS[preset].height} {PRESETS[preset].unit}</span>
             </div>
             <div className="flex justify-between text-xs">
               <span className="text-blue-600/70 font-medium">File Size:</span>
               <span className="text-blue-900 font-bold">{PRESETS[preset].minKB}-{PRESETS[preset].maxKB} KB</span>
             </div>
           </div>
        </div>

        <div className="p-2 space-y-4">
          <div className="flex items-start gap-2 text-[10px] text-gray-400 leading-relaxed bg-gray-50 p-3 rounded-lg border border-dashed text-center">
            <span>Face should cover 70-80% of the photo area. Background should be plain (preferably white).</span>
          </div>
          <button onClick={() => setFile(null)} className="w-full text-xs font-bold text-red-500 py-2 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center gap-2">
            <Trash2 className="w-3.5 h-3.5" /> Choose New Photo
          </button>
        </div>
      </div>
    }>
      <div className="w-full h-[70vh] flex flex-col items-center justify-center bg-gray-100 rounded-3xl p-8 shadow-inner border border-gray-200 overflow-hidden relative">
        <div className="relative bg-white shadow-2xl rounded-lg overflow-hidden max-w-full max-h-full leading-[0]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imageRef} src={imageUrl} alt="Upload" className="max-w-full max-h-full block" />
        </div>
        
        <div className="absolute top-6 left-6 flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-lg">
           <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
             {preset === 'signature' ? <FileType className="w-4 h-4" /> : <UserCircle className="w-4 h-4" />}
           </div>
           <div>
             <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">CROP MODE</p>
             <p className="text-xs font-bold text-gray-800 leading-none">{PRESETS[preset].label}</p>
           </div>
        </div>

        <div className="absolute bottom-6 right-6 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full text-[10px] text-white font-bold tracking-widest uppercase flex items-center gap-2">
           <Camera className="w-3 h-3" />
           <span>Adjust frame to match guidelines</span>
        </div>
      </div>
    </WorkspaceLayout>
  )
}

function CheckCircle2(props: { className?: string }) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  )
}
