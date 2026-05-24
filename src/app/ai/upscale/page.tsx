'use client'
import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { Maximize, AlertCircle, Loader2, Sparkles } from 'lucide-react'

function UpscaleTool() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [upscalerLoaded, setUpscalerLoaded] = useState(false)
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upscalerRef = useRef<any>(null)

  // Initialize TF.js and Upscaler on mount
  useEffect(() => {
    async function initAI() {
      try {
        const tf = await import('@tensorflow/tfjs-core')
        await import('@tensorflow/tfjs-backend-webgl')
        const Upscaler = (await import('upscaler')).default
        
        // Use ESM import instead of require
        // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
        const esrganSlim2x = require('@upscalerjs/esrgan-slim/2x').default

        await tf.setBackend('webgl')
        await tf.ready()

        upscalerRef.current = new Upscaler({
          model: esrganSlim2x
        })
        
        setUpscalerLoaded(true)
        console.log("[Upscale] AI Engine Ready (WebGL)")
      } catch (e) {
        console.error("AI Initialization failed:", e)
        setError("Failed to load AI engine. Ensure your browser supports WebGL.")
      }
    }
    initAI()
  }, [])

  const handleFilesDrop = (droppedFiles: File[]) => {
    const f = droppedFiles[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setError(null)
    setProgress(0)
  }

  const handleProcess = async () => {
    if (!file || !upscalerRef.current) return
    setIsProcessing(true)
    setError(null)
    setProgress(5)
    
    try {
      const upscaledSrc = await upscalerRef.current.upscale(preview!, {
        patchSize: 64, // Process in small chunks to prevent UI freeze
        padding: 2,
        progress: (p: number) => {
           setProgress(Math.round(p * 100))
        }
      })
      
      setResult(upscaledSrc)
      setProgress(100)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error("Upscale failed:", e)
      setError("Upscaling failed. This usually happens if the image is too large for your GPU memory. Error: " + (e.message || "Unknown"))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `docuvate-upscaled-${file?.name || 'image'}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">AI Photo Upscale</h1>
        <p className="text-center text-gray-500 mb-8 px-4 max-w-2xl mx-auto">
          Enhance and upscale images by 2x using ESRGAN AI models. 
          Runs 100% locally on your GPU—no WASM binaries, no server uploads.
        </p>
        {!upscalerLoaded && !error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border max-w-md mx-auto">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Loading AI Models...</p>
            <p className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-widest">Optimizing for GPU acceleration</p>
          </div>
        ) : (
          <Dropzone onFilesDrop={handleFilesDrop} accept="image/*" multiple={false} theme="indigo" label="Select Image to Upscale" />
        )}
        {error && (
          <div className="mt-8 max-w-md mx-auto bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-sm text-red-800 text-center font-bold mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider">Reload Tool</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={result ? handleDownload : handleProcess} 
      processLabel={result ? "Download Image" : (isProcessing ? "Processing..." : "Start AI Upscale")} 
      colorTheme="indigo"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div className="bg-indigo-600 p-6 rounded-2xl text-white shadow-lg">
             <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-5 h-5" />
                <h3 className="font-black text-sm uppercase tracking-tighter">AI 2X Upscale</h3>
             </div>
             <p className="text-[10px] opacity-90 leading-relaxed font-medium">Using ESRGAN-Slim for high-performance super-resolution directly in your browser.</p>
          </div>

          {isProcessing && (
            <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-black text-indigo-800 uppercase">Upscaling...</p>
                <p className="text-xs font-bold text-indigo-600">{progress}%</p>
              </div>
              <div className="w-full bg-indigo-200 rounded-full h-2">
                <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
              <p className="text-[9px] text-gray-400 mt-2 uppercase text-center font-bold">GPU Active • Offline Mode</p>
            </div>
          )}

          <button onClick={() => { setFile(null); setResult(null); setPreview(null); setError(null); }} disabled={isProcessing} className="text-sm text-red-500 hover:underline">Select Different Image</button>
        </div>
      }
    >
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
        <div className="flex flex-col gap-4 h-full">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Original Source</span>
              <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{(file.size / 1024).toFixed(1)} KB</span>
           </div>
           <div className="bg-white p-2 rounded-2xl shadow-xl border border-gray-100 flex items-center justify-center flex-grow overflow-hidden min-h-[300px]">
              {preview && <img src={preview} alt="Original" className="max-w-full max-h-[60vh] object-contain" />}
           </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
           <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">AI Enhanced Output</span>
              {result && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">200% Upscaled</span>}
           </div>
           <div className="bg-white p-2 rounded-2xl shadow-xl border-2 border-dashed border-indigo-100 flex items-center justify-center flex-grow overflow-hidden min-h-[300px] relative">
              {result ? (
                <img src={result} alt="Upscaled" className="max-w-full max-h-[60vh] object-contain animate-in fade-in duration-1000" />
              ) : (
                <div className="flex flex-col items-center text-gray-300">
                   <Maximize className={`w-16 h-16 mb-4 ${isProcessing ? 'animate-pulse text-indigo-200' : ''}`} />
                   <p className="text-sm font-bold uppercase tracking-widest">{isProcessing ? 'Processing AI Tiles...' : 'Result Preview'}</p>
                </div>
              )}
           </div>
        </div>
      </div>
    </WorkspaceLayout>
  )
}

const PhotoUpscale = dynamic(() => Promise.resolve(UpscaleTool), {
  ssr: false
})

export default function Page() {
  return (
    <ErrorBoundary>
      <PhotoUpscale />
    </ErrorBoundary>
  )
}

