'use client'
import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { Maximize, AlertCircle, Loader2, Settings2 } from 'lucide-react'

type ScaleFactor = 2 | 3 | 4
type ModelEngine = 'slim' | 'thick'

function UpscaleTool() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [upscalerLoaded, setUpscalerLoaded] = useState(false)
  
  // Options
  const [scale, setScale] = useState<ScaleFactor>(2)
  const [engine, setEngine] = useState<ModelEngine>('slim')
  const [patchSize, setPatchSize] = useState<number>(64)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const upscalerRef = useRef<any>(null)

  // Initialize TF.js and Upscaler on mount OR when model options change
  useEffect(() => {
    async function initAI() {
      setUpscalerLoaded(false)
      setError(null)
      try {
        const tf = await import('@tensorflow/tfjs-core')
        await import('@tensorflow/tfjs-backend-webgl')
        const Upscaler = (await import('upscaler')).default
        
        let modelModule;
        /* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
        if (engine === 'slim') {
          if (scale === 2) modelModule = require('@upscalerjs/esrgan-slim/2x').default
          else if (scale === 3) modelModule = require('@upscalerjs/esrgan-slim/3x').default
          else modelModule = require('@upscalerjs/esrgan-slim/4x').default
        } else {
          if (scale === 2) modelModule = require('@upscalerjs/esrgan-thick/2x').default
          else if (scale === 3) modelModule = require('@upscalerjs/esrgan-thick/3x').default
          else modelModule = require('@upscalerjs/esrgan-thick/4x').default
        }
        /* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */

        await tf.setBackend('webgl')
        await tf.ready()

        upscalerRef.current = new Upscaler({
          model: modelModule
        })
        
        setUpscalerLoaded(true)
        console.log(`[Upscale] AI Engine Ready: ${engine} ${scale}x`)
      } catch (e) {
        console.error("AI Initialization failed:", e)
        setError("Failed to load AI model. Try selecting a different scale or engine.")
      }
    }
    initAI()
  }, [scale, engine])

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
        patchSize: patchSize, 
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
      setError("Upscaling failed. The image might be too large or the model too heavy for your GPU. Try 'Standard' engine or smaller Patch Size. Error: " + (e.message || "Unknown"))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `docuvate-${scale}x-${file?.name || 'image'}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">AI Photo Upscale</h1>
        <p className="text-center text-gray-500 mb-8 px-4 max-w-2xl mx-auto">
          Pro-grade image enhancement powered by ESRGAN. 
          Choose your scale and engine—everything runs 100% locally.
        </p>
        {!upscalerLoaded && !error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border max-w-md mx-auto">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Preparing AI Engine...</p>
            <p className="text-[10px] text-gray-400 mt-2 text-center uppercase tracking-widest">Optimizing GPU shaders</p>
          </div>
        ) : (
          <Dropzone onFilesDrop={handleFilesDrop} accept="image/*" multiple={false} theme="indigo" label="Select Image to Upscale" />
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
          <div className="bg-indigo-600 p-5 rounded-2xl text-white shadow-lg">
             <div className="flex items-center gap-2 mb-2">
                <Settings2 className="w-5 h-5" />
                <h3 className="font-black text-xs uppercase tracking-tight">Upscale Settings</h3>
             </div>
             
             <div className="space-y-4 mt-4">
                <div>
                  <label className="text-[10px] font-bold uppercase opacity-70 mb-2 block">Scale Factor</label>
                  <div className="flex bg-indigo-700 p-1 rounded-lg">
                    {[2, 3, 4].map((s) => (
                      <button 
                        key={s} 
                        onClick={() => setScale(s as ScaleFactor)}
                        disabled={isProcessing}
                        className={`flex-1 py-1 text-xs font-black rounded-md transition-all ${scale === s ? 'bg-white text-indigo-600 shadow-sm' : 'hover:bg-indigo-500 text-white opacity-80'}`}
                      >
                        {s}X
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase opacity-70 mb-2 block">AI Engine</label>
                  <select 
                    value={engine} 
                    onChange={(e) => setEngine(e.target.value as ModelEngine)}
                    disabled={isProcessing}
                    className="w-full bg-indigo-700 text-white text-xs font-bold p-2 rounded-lg border-none outline-none cursor-pointer"
                  >
                    <option value="slim">Standard (Balanced)</option>
                    <option value="thick">Ultra (Best Quality)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold uppercase opacity-70 mb-2 block">Patch Size</label>
                  <select 
                    value={patchSize} 
                    onChange={(e) => setPatchSize(parseInt(e.target.value))}
                    disabled={isProcessing}
                    className="w-full bg-indigo-700 text-white text-xs font-bold p-2 rounded-lg border-none outline-none cursor-pointer"
                  >
                    <option value="32">32 (Safest / Slower)</option>
                    <option value="64">64 (Recommended)</option>
                    <option value="128">128 (Faster / High VRAM)</option>
                  </select>
                  <p className="text-[8px] mt-1 opacity-60">Smaller patches prevent browser crashes on large images.</p>
                </div>
             </div>
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
              <p className="text-[9px] text-gray-400 mt-2 uppercase text-center font-bold">GPU Active • {engine.toUpperCase()} Mode</p>
            </div>
          )}

          {!upscalerLoaded && !isProcessing && (
             <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-100 rounded-xl">
                <Loader2 className="w-4 h-4 text-yellow-600 animate-spin" />
                <p className="text-[10px] font-bold text-yellow-700">Loading New Model...</p>
             </div>
          )}

          {error && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100">
              <div className="flex items-center gap-2 mb-1">
                 <AlertCircle className="w-4 h-4 text-red-500" />
                 <p className="text-[10px] font-bold text-red-800 uppercase">Engine Error</p>
              </div>
              <p className="text-[9px] text-red-600 leading-tight">{error}</p>
            </div>
          )}

          <button onClick={() => { setFile(null); setResult(null); setPreview(null); setError(null); }} disabled={isProcessing} className="text-sm text-red-500 hover:underline w-full text-center">Start New Image</button>
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
              {result && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-1 rounded">{scale}00% Upscaled</span>}
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
