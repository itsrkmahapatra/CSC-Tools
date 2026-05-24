'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { Wand2, Image as ImageIcon, Download, Loader2, Sliders, Ghost, RefreshCw, AlertCircle } from 'lucide-react'

function RemoveBGTool() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  
  // Customization Options
  const [bgColor, setBgColor] = useState<string>('transparent')
  const [bgImage, setBgImage] = useState<string | null>(null)
  const [edgeBlur, setEdgeBlur] = useState<number>(2)
  const [shadow, setShadow] = useState<number>(0)
  const [shadowOpacity] = useState<number>(0.4)
  
  // Internal State
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const segmenterRef = useRef<any>(null)
  const mainCanvasRef = useRef<HTMLCanvasElement>(null)
  const originalImageRef = useRef<HTMLImageElement | null>(null)

  // Initialize TF.js and Load High-Res Model
  useEffect(() => {
    async function initAI() {
      try {
        const tf = await import('@tensorflow/tfjs-core')
        await import('@tensorflow/tfjs-backend-webgl')
        const bodyPix = await import('@tensorflow-models/body-pix')
        
        await tf.setBackend('webgl')
        await tf.ready()

        // Load BodyPix with ResNet50 for highest accuracy
        segmenterRef.current = await bodyPix.load({
          architecture: 'ResNet50',
          outputStride: 32,
          quantBytes: 2
        })
        
        setModelLoaded(true)
        console.log("[RemoveBG] High-Precision Engine Ready (ResNet50)")
      } catch (e) {
        console.error("AI Initialization failed:", e)
        setError("High-precision engine failed to load. Your browser/GPU may not support the ResNet50 model.")
      }
    }
    initAI()
  }, [])

  const handleFilesDrop = (droppedFiles: File[]) => {
    const f = droppedFiles[0]
    setFile(f)
    const url = URL.createObjectURL(f)
    setPreview(url)
    setResult(null)
    setError(null)
    const img = new Image()
    img.src = url
    originalImageRef.current = img
  }

  const handleProcess = async () => {
    if (!file || !segmenterRef.current || !originalImageRef.current) return
    setIsProcessing(true)
    setError(null)
    
    try {
      const img = originalImageRef.current
      if (!img.complete) {
        await new Promise((resolve) => { img.onload = resolve; })
      }

      // 1. Run High-Precision Segmentation
      const segmentation = await segmenterRef.current.segmentPerson(img, {
        internalResolution: 'high',
        segmentationThreshold: 0.7,
        maxDetections: 1
      })

      // 2. Create Alpha Mask
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      
      const imageData = ctx.createImageData(img.width, img.height)
      
      // CRITICAL FIX: Set alpha to 0 for background, 255 for person
      for (let i = 0; i < segmentation.data.length; i++) {
        const isPerson = segmentation.data[i] === 1
        const offset = i * 4
        imageData.data[offset] = 255     // R
        imageData.data[offset + 1] = 255 // G
        imageData.data[offset + 2] = 255 // B
        imageData.data[offset + 3] = isPerson ? 255 : 0 // Alpha (Transparency)
      }
      ctx.putImageData(imageData, 0, 0)
      
      setMaskCanvas(canvas)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error("High-precision processing failed:", e)
      setError("AI Analysis failed. Try a smaller or clearer image.")
    } finally {
      setIsProcessing(false)
    }
  }

  const renderFinal = useCallback(async (currentMask: HTMLCanvasElement) => {
    if (!originalImageRef.current || !mainCanvasRef.current) return
    const img = originalImageRef.current
    const canvas = mainCanvasRef.current
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    canvas.width = img.width
    canvas.height = img.height
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 1. Prepare smoothed mask
    const tempMask = document.createElement('canvas')
    tempMask.width = canvas.width
    tempMask.height = canvas.height
    const tCtx = tempMask.getContext('2d')
    if (tCtx && edgeBlur > 0) {
      tCtx.filter = `blur(${edgeBlur}px)`
    }
    tCtx?.drawImage(currentMask, 0, 0)

    // 2. Draw Background (Image or Color)
    if (bgImage) {
        const bImg = new Image()
        bImg.src = bgImage
        await new Promise((resolve) => { bImg.onload = resolve; })
        ctx.drawImage(bImg, 0, 0, canvas.width, canvas.height)
    } else if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // 3. Create clipped foreground in memory
    const fgCanvas = document.createElement('canvas')
    fgCanvas.width = canvas.width
    fgCanvas.height = canvas.height
    const fgCtx = fgCanvas.getContext('2d')
    if (fgCtx) {
      fgCtx.drawImage(img, 0, 0)
      fgCtx.globalCompositeOperation = 'destination-in'
      fgCtx.drawImage(tempMask, 0, 0)
    }

    // 4. Apply Subject Shadow if requested
    if (shadow > 0) {
      ctx.shadowColor = `rgba(0,0,0,${shadowOpacity})`
      ctx.shadowBlur = shadow
      ctx.shadowOffsetX = shadow / 4
      ctx.shadowOffsetY = shadow / 4
    }

    // 5. Compose subject on background
    ctx.drawImage(fgCanvas, 0, 0)
    
    setResult(canvas.toDataURL('image/png'))
  }, [bgColor, bgImage, edgeBlur, shadow, shadowOpacity])

  // Re-render when options or mask changes
  useEffect(() => {
    if (maskCanvas) {
      renderFinal(maskCanvas)
    }
  }, [maskCanvas, bgColor, bgImage, edgeBlur, shadow, renderFinal])

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `docuvate-no-bg-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
        setBgImage(URL.createObjectURL(f))
        setBgColor('custom')
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Pro AI Background Remover</h1>
        <p className="text-center text-gray-500 mb-8 px-4 max-w-2xl mx-auto leading-relaxed">
          Highest precision subject isolation powered by the ResNet50 deep neural network. 
          Analyze complex edges and refine results with pro tools—100% locally.
        </p>
        {!modelLoaded && !error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border max-w-md mx-auto">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-600 font-bold text-center uppercase tracking-tighter">Warming up AI Engine...</p>
            <p className="text-[10px] text-gray-400 mt-2 text-center">Loading High-Precision Weights (Approx. 25MB)</p>
          </div>
        ) : (
          <Dropzone onFilesDrop={handleFilesDrop} accept="image/*" multiple={false} theme="indigo" label="Select Image for Precision Removal" />
        )}
        {error && (
          <div className="mt-8 max-w-md mx-auto bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-xs text-red-800 text-center font-bold mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-wider">Reload Tool</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={result ? handleDownload : handleProcess} 
      processLabel={result ? "Download Image" : (isProcessing ? "Analyzing Pixels..." : "Remove Background")} 
      colorTheme="indigo"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          {result && (
            <>
              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                   <Sliders className="w-4 h-4" />
                   <h3 className="font-black text-[10px] uppercase">Refinement Pro</h3>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Edge Feathering</label>
                    <span className="text-[10px] font-bold text-indigo-600">{edgeBlur}px</span>
                  </div>
                  <input type="range" min="0" max="10" step="1" value={edgeBlur} onChange={(e) => setEdgeBlur(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Subject Shadow</label>
                    <span className="text-[10px] font-bold text-indigo-600">{shadow}px</span>
                  </div>
                  <input type="range" min="0" max="50" step="2" value={shadow} onChange={(e) => setShadow(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>
              </div>

              <div className="bg-indigo-600 p-4 rounded-xl text-white shadow-lg space-y-4">
                <div className="flex items-center gap-2">
                   <Ghost className="w-4 h-4" />
                   <h3 className="font-black text-[10px] uppercase">Background Preset</h3>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {['transparent', '#ffffff', '#000000', '#f3f4f6', '#ef4444', '#10b981', '#3b82f6', '#8b5cf6'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => { setBgColor(c); setBgImage(null); }}
                      className={`w-7 h-7 rounded-full border-2 transition-all ${bgColor === c ? 'border-white scale-110' : 'border-indigo-400 opacity-60 hover:opacity-100'}`}
                      style={{ backgroundColor: c === 'transparent' ? undefined : c, backgroundImage: c === 'transparent' ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACpJREFUGFdjZEADJgY0QC6AkgAJAAnIAtkgCSQBWSALJIEkIAtkAwM2BQCz8A8LJ0Y4GAAAAABJRU5ErkJggg==")' : undefined }}
                    />
                  ))}
                </div>
                <label className="flex items-center justify-center w-full py-2 bg-indigo-500 hover:bg-indigo-400 rounded-lg cursor-pointer transition-colors text-[10px] font-black uppercase tracking-widest border border-indigo-400">
                  <ImageIcon className="w-3 h-3 mr-2" /> Replace BG
                  <input type="file" className="hidden" accept="image/*" onChange={handleBgImageUpload} />
                </label>
              </div>
            </>
          )}

          <button onClick={() => { setFile(null); setResult(null); setPreview(null); setBgImage(null); setBgColor('transparent'); setError(null); setMaskCanvas(null); }} disabled={isProcessing} className="text-xs text-red-500 font-bold hover:underline w-full text-center py-2 bg-red-50 rounded-lg flex items-center justify-center gap-2">
            <RefreshCw className="w-3 h-3" /> Start Fresh
          </button>
        </div>
      }
    >
      <div className="w-full flex flex-col items-center">
        <div 
          className="relative bg-white p-4 shadow-2xl border-8 border-white rounded-3xl overflow-hidden max-w-3xl w-full min-h-[400px] flex items-center justify-center transition-all duration-500"
          style={{ 
            backgroundColor: bgColor === 'transparent' ? '#f3f4f6' : (bgColor === 'custom' ? 'transparent' : bgColor),
            backgroundImage: bgColor === 'transparent' ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACpJREFUGFdjZEADJgY0QC6AkgAJAAnIAtkgCSQBWSALJIEkIAtkAwM2BQCz8A8LJ0Y4GAAAAABJRU5ErkJggg==")' : (bgImage ? `url(${bgImage})` : undefined),
            backgroundSize: bgColor === 'transparent' ? 'auto' : 'cover',
            backgroundPosition: 'center'
          }}
        >
          <canvas ref={mainCanvasRef} className={`max-w-full max-h-[70vh] object-contain shadow-2xl ${!result ? 'hidden' : 'animate-in fade-in duration-1000'}`} />
          {!result && (
             // eslint-disable-next-line @next/next/no-img-element
            <img src={preview!} alt="Original" className={`block max-w-full h-auto mx-auto transition-all ${isProcessing ? 'opacity-20 blur-xl grayscale scale-110' : 'opacity-90 shadow-lg rounded-lg'}`} />
          )}
          
          {!result && !isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <button className="bg-indigo-600 text-white px-10 py-5 rounded-full font-black shadow-2xl flex items-center gap-3 cursor-pointer hover:scale-105 active:scale-95 transition-all" onClick={handleProcess}>
                <Wand2 className="w-7 h-7" />
                START AI REMOVAL
              </button>
            </div>
          )}

          {isProcessing && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                <p className="text-indigo-900 font-black uppercase tracking-widest text-sm text-center bg-white/80 px-6 py-2 rounded-full shadow-sm">AI Analyzing Edges...</p>
             </div>
          )}
        </div>
        
        {result && (
           <div className="mt-8 flex items-center gap-4 bg-white px-8 py-4 rounded-3xl shadow-2xl border border-indigo-50 animate-in slide-in-from-bottom duration-500">
              <div className="flex items-center gap-2 border-r pr-6 border-gray-100">
                 <span className="text-[10px] font-black text-gray-400 uppercase">Engine Accuracy</span>
                 <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">100% HIGH-RES</span>
              </div>
              <button onClick={handleDownload} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors font-black text-xs uppercase tracking-widest">
                <Download className="w-5 h-5" />
                Export Pro Image
              </button>
           </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}

const RemoveBackground = dynamic(() => Promise.resolve(RemoveBGTool), {
  ssr: false
})

export default function Page() {
  return (
    <ErrorBoundary>
      <RemoveBackground />
    </ErrorBoundary>
  )
}
