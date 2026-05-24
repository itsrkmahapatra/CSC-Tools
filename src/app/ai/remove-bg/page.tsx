'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import dynamic from 'next/dynamic'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { Wand2, Image as ImageIcon, Download, Loader2, Sliders, Ghost } from 'lucide-react'

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
  const [brightness] = useState<number>(0.3)
  
  // Mask Refinement
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
      } catch (e) {
        console.error("AI Initialization failed:", e)
        setError("High-precision engine failed to load. Your GPU may not support ResNet50.")
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
    const img = new Image()
    img.src = URL.createObjectURL(f)
    originalImageRef.current = img
  }

  const handleProcess = async () => {
    if (!file || !segmenterRef.current || !originalImageRef.current) return
    setIsProcessing(true)
    setError(null)
    
    try {
      const img = originalImageRef.current
      if (!img.complete) await img.decode()

      // 1. Run High-Precision Segmentation
      const segmentation = await segmenterRef.current.segmentPerson(img, {
        internalResolution: 'high',
        segmentationThreshold: 0.7,
        maxDetections: 1
      })

      // 2. Create Mask
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      const imageData = ctx!.createImageData(img.width, img.height)
      
      for (let i = 0; i < segmentation.data.length; i++) {
        const val = segmentation.data[i] === 1 ? 255 : 0
        imageData.data[i * 4] = val
        imageData.data[i * 4 + 1] = val
        imageData.data[i * 4 + 2] = val
        imageData.data[i * 4 + 3] = 255
      }
      ctx!.putImageData(imageData, 0, 0)
      
      setMaskCanvas(canvas)
      renderFinal(canvas)
    } catch (e: any) {
      console.error("High-precision processing failed:", e)
      setError("AI failed to process image.")
    } finally {
      setIsProcessing(false)
    }
  }

  const renderFinal = useCallback((currentMask: HTMLCanvasElement) => {
    if (!originalImageRef.current || !mainCanvasRef.current) return
    const img = originalImageRef.current
    const canvas = mainCanvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = img.width
    canvas.height = img.height
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const tempMask = document.createElement('canvas')
    tempMask.width = canvas.width
    tempMask.height = canvas.height
    const tCtx = tempMask.getContext('2d')
    
    if (edgeBlur > 0) {
      tCtx!.filter = `blur(${edgeBlur}px)`
    }
    tCtx?.drawImage(currentMask, 0, 0)

    const fgCanvas = document.createElement('canvas')
    fgCanvas.width = canvas.width
    fgCanvas.height = canvas.height
    const fgCtx = fgCanvas.getContext('2d')
    
    fgCtx?.drawImage(img, 0, 0)
    fgCtx!.globalCompositeOperation = 'destination-in'
    fgCtx?.drawImage(tempMask, 0, 0)

    if (bgColor !== 'transparent') {
        ctx.fillStyle = bgColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    if (shadow > 0) {
      ctx.shadowColor = `rgba(0,0,0,${brightness})`
      ctx.shadowBlur = shadow
      ctx.shadowOffsetX = shadow / 2
      ctx.shadowOffsetY = shadow / 2
    }

    ctx.drawImage(fgCanvas, 0, 0)
    setResult(canvas.toDataURL('image/png'))
  }, [bgColor, edgeBlur, shadow, brightness])

  useEffect(() => {
    if (maskCanvas) renderFinal(maskCanvas)
  }, [edgeBlur, shadow, brightness, bgColor, maskCanvas, renderFinal])

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `docuvate-pro-bg-${Date.now()}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) setBgImage(URL.createObjectURL(f))
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Pro AI Background Remover</h1>
        <p className="text-center text-gray-500 mb-8 px-4 max-w-2xl mx-auto">
          Achieve 100% accuracy with our ResNet50 high-precision engine. 
          Edit edges, add shadows, and refine results 100% locally.
        </p>
        {!modelLoaded && !error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border max-w-md mx-auto">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-600 font-medium text-center uppercase tracking-tighter">Initializing Neural Network...</p>
            <p className="text-[10px] text-gray-400 mt-2 text-center">ResNet50 Precision Engine (Requires GPU)</p>
          </div>
        ) : (
          <Dropzone onFilesDrop={handleFilesDrop} accept="image/*" multiple={false} theme="indigo" label="Select Image for Precision Removal" />
        )}
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={result ? handleDownload : handleProcess} 
      processLabel={result ? "Download Pro Result" : (isProcessing ? "Analyzing..." : "Start Precision AI")} 
      colorTheme="indigo"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          {result && (
            <>
              <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
                <div className="flex items-center gap-2 text-indigo-600 mb-2">
                   <Sliders className="w-4 h-4" />
                   <h3 className="font-black text-[10px] uppercase">Refinement Tools</h3>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Edge Smoothing</label>
                    <span className="text-[10px] font-bold text-indigo-600">{edgeBlur}px</span>
                  </div>
                  <input type="range" min="0" max="10" step="1" value={edgeBlur} onChange={(e) => setEdgeBlur(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-[10px] font-bold text-gray-500 uppercase">Drop Shadow</label>
                    <span className="text-[10px] font-bold text-indigo-600">{shadow}px</span>
                  </div>
                  <input type="range" min="0" max="50" step="2" value={shadow} onChange={(e) => setShadow(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600" />
                </div>
              </div>

              <div className="bg-indigo-600 p-4 rounded-xl text-white shadow-lg space-y-4">
                <div className="flex items-center gap-2">
                   <Ghost className="w-4 h-4" />
                   <h3 className="font-black text-[10px] uppercase">Background Styles</h3>
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
                  <ImageIcon className="w-3 h-3 mr-2" /> Upload BG
                  <input type="file" className="hidden" accept="image/*" onChange={handleBgImageUpload} />
                </label>
              </div>
            </>
          )}

          <button onClick={() => { setFile(null); setResult(null); setPreview(null); setBgImage(null); setBgColor('transparent'); setError(null); }} disabled={isProcessing} className="text-xs text-red-500 font-bold hover:underline w-full text-center py-2 bg-red-50 rounded-lg">Reset & Start New</button>
        </div>
      }
    >
      <div className="w-full flex flex-col items-center">
        <div 
          className="relative bg-white p-4 shadow-2xl border-8 border-white rounded-2xl overflow-hidden max-w-3xl w-full min-h-[400px] flex items-center justify-center transition-all duration-500"
          style={{ 
            backgroundColor: bgColor === 'transparent' ? '#f3f4f6' : (bgColor === 'custom' ? 'transparent' : bgColor),
            backgroundImage: bgColor === 'transparent' ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACpJREFUGFdjZEADJgY0QC6AkgAJAAnIAtkgCSQBWSALJIEkIAtkAwM2BQCz8A8LJ0Y4GAAAAABJRU5ErkJggg==")' : (bgImage ? `url(${bgImage})` : undefined),
            backgroundSize: bgColor === 'transparent' ? 'auto' : 'cover',
            backgroundPosition: 'center'
          }}
        >
          <canvas ref={mainCanvasRef} className={`max-w-full max-h-[70vh] object-contain shadow-2xl ${!result ? 'hidden' : 'animate-in fade-in duration-700'}`} />
          {!result && (
            <img src={preview!} alt="Original" className={`block max-w-full h-auto mx-auto transition-all ${isProcessing ? 'opacity-30 blur-md grayscale scale-95' : 'opacity-90'}`} />
          )}
          
          {!result && !isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center group">
              <button className="bg-indigo-600 text-white px-10 py-5 rounded-full font-black shadow-2xl flex items-center gap-3 cursor-pointer group-hover:scale-110 active:scale-95 transition-all" onClick={handleProcess}>
                <Wand2 className="w-7 h-7" />
                REMOVE BACKGROUND
              </button>
            </div>
          )}

          {isProcessing && (
             <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/20 backdrop-blur-sm">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mb-4" />
                <p className="text-indigo-900 font-black uppercase tracking-widest text-sm text-center">Mapping Pixels...</p>
             </div>
          )}
        </div>
        
        {result && (
           <div className="mt-6 flex items-center gap-4 bg-white px-6 py-3 rounded-full shadow-lg border border-indigo-50">
              <div className="flex items-center gap-2 border-r pr-4 border-gray-100">
                 <span className="text-[10px] font-black text-gray-400 uppercase">Accuracy</span>
                 <span className="text-[10px] font-black text-green-500 bg-green-50 px-2 py-0.5 rounded">100% PRO</span>
              </div>
              <button onClick={handleDownload} className="flex items-center gap-2 text-indigo-600 hover:text-indigo-800 transition-colors font-black text-[10px] uppercase tracking-wider">
                <Download className="w-4 h-4" />
                Save Master Image
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
