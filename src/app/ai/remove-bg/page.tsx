'use client'
import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import { Wand2, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react'

function RemoveBGTool() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [bgColor, setBgColor] = useState<string>('transparent')
  const [bgImage, setBgImage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [modelLoaded, setModelLoaded] = useState(false)
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const segmenterRef = useRef<any>(null)

  // Initialize TF.js and Load Model on mount
  useEffect(() => {
    async function initAI() {
      try {
        const tf = await import('@tensorflow/tfjs-core')
        await import('@tensorflow/tfjs-backend-webgl')
        await import('@tensorflow/tfjs-converter')
        const bodySegmentation = await import('@tensorflow-models/body-segmentation')
        
        await tf.setBackend('webgl')
        await tf.ready()

        const model = bodySegmentation.SupportedModels.MediaPipeSelfieSegmentation
        const segmenterConfig = {
          runtime: 'tfjs' as const,
          modelType: 'general' as const
        }
        
        segmenterRef.current = await bodySegmentation.createSegmenter(model, segmenterConfig)
        setModelLoaded(true)
        console.log("[RemoveBG] AI Engine Ready (WebGL)")
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
  }

  const handleProcess = async () => {
    if (!file || !segmenterRef.current) return
    setIsProcessing(true)
    setError(null)
    
    try {
      const img = new Image()
      img.src = preview!
      await img.decode()

      // Create internal canvas for processing
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0)

      const segmentation = await segmenterRef.current.segmentPeople(canvas)
      
      // Create Mask
      const bodySegmentation = await import('@tensorflow-models/body-segmentation')
      const foregroundColor = { r: 0, g: 0, b: 0, a: 0 } // person is transparent in mask
      const backgroundColor = { r: 0, g: 0, b: 0, a: 255 } // background is black
      
      const mask = await bodySegmentation.toBinaryMask(
        segmentation,
        foregroundColor,
        backgroundColor
      )

      // Apply Mask to get result
      const resultCanvas = document.createElement('canvas')
      resultCanvas.width = img.width
      resultCanvas.height = img.height
      const rCtx = resultCanvas.getContext('2d')
      
      // 1. Draw original image
      rCtx?.drawImage(img, 0, 0)
      
      // 2. Load mask into temporary canvas
      const maskCanvas = document.createElement('canvas')
      maskCanvas.width = img.width
      maskCanvas.height = img.height
      const mCtx = maskCanvas.getContext('2d')
      const maskData = new ImageData(mask.data, mask.width, mask.height)
      
      // Resize mask to match original image if needed
      if (mask.width !== img.width || mask.height !== img.height) {
        const tempCanvas = document.createElement('canvas')
        tempCanvas.width = mask.width
        tempCanvas.height = mask.height
        tempCanvas.getContext('2d')?.putImageData(maskData, 0, 0)
        mCtx?.drawImage(tempCanvas, 0, 0, img.width, img.height)
      } else {
        mCtx?.putImageData(maskData, 0, 0)
      }

      // 3. Destination-Out to remove background
      rCtx!.globalCompositeOperation = 'destination-out'
      rCtx?.drawImage(maskCanvas, 0, 0)

      setResult(resultCanvas.toDataURL('image/png'))
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (e: any) {
      console.error("Processing failed:", e)
      setError("Background removal failed. Error: " + (e.message || "Unknown error"))
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.src = result
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      if (bgImage) {
        const bgImg = new Image()
        bgImg.src = bgImage
        bgImg.onload = () => {
          ctx?.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
          ctx?.drawImage(img, 0, 0)
          downloadCanvas(canvas)
        }
      } else if (bgColor !== 'transparent') {
        ctx!.fillStyle = bgColor
        ctx?.fillRect(0, 0, canvas.width, canvas.height)
        ctx?.drawImage(img, 0, 0)
        downloadCanvas(canvas)
      } else {
        downloadCanvas(canvas)
      }
    }
  }

  const downloadCanvas = (canvas: HTMLCanvasElement | string) => {
    const a = document.createElement('a')
    a.href = typeof canvas === 'string' ? canvas : canvas.toDataURL('image/png')
    a.download = `docuvate-bg-removed-${Date.now()}.png`
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
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">AI Background Remover</h1>
        <p className="text-center text-gray-500 mb-8 px-4 max-w-2xl mx-auto">
          Pro-grade background removal powered by TensorFlow.js. 
          Works 100% locally on your GPU—no WASM binaries, no server uploads.
        </p>
        {!modelLoaded && !error ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border max-w-md mx-auto">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mb-4" />
            <p className="text-gray-600 font-medium">Initializing AI Engine...</p>
            <p className="text-[10px] text-gray-400 mt-2">Loading GPU shaders for offline processing</p>
          </div>
        ) : (
          <Dropzone onFilesDrop={handleFilesDrop} accept="image/*" multiple={false} theme="indigo" label="Select Image to Remove BG" />
        )}
        {error && (
          <div className="mt-8 max-w-md mx-auto bg-red-50 p-6 rounded-2xl border border-red-100 flex flex-col items-center">
            <AlertCircle className="w-10 h-10 text-red-500 mb-3" />
            <p className="text-sm text-red-800 text-center font-bold mb-4">{error}</p>
            <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-wider">Reload Application</button>
          </div>
        )}
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={result ? handleDownload : handleProcess} 
      processLabel={result ? "Download Image" : (isProcessing ? "Analyzing..." : "Remove Background")} 
      colorTheme="indigo"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          {result && (
            <>
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase">Background Style</h3>
                <div className="grid grid-cols-5 gap-2">
                  {['transparent', '#ffffff', '#000000', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => { setBgColor(c); setBgImage(null); }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${bgColor === c ? 'border-indigo-600 scale-110 shadow-md' : 'border-gray-200 hover:scale-105'}`}
                      style={{ backgroundColor: c === 'transparent' ? undefined : c, backgroundImage: c === 'transparent' ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACpJREFUGFdjZEADJgY0QC6AkgAJAAnIAtkgCSQBWSALJIEkIAtkAwM2BQCz8A8LJ0Y4GAAAAABJRU5ErkJggg==")' : undefined }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase">New Background</h3>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
                    <p className="text-[10px] text-gray-500 uppercase font-bold text-center px-2">Upload Image</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleBgImageUpload} />
                </label>
              </div>
            </>
          )}
          
          {isProcessing && (
            <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
              <div className="flex items-center gap-2 mb-2">
                <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
                <p className="text-xs font-bold text-indigo-800">Processing locally...</p>
              </div>
              <p className="text-[10px] text-gray-500">Your image never leaves your device. First run may take a few seconds.</p>
            </div>
          )}

          <button onClick={() => { setFile(null); setResult(null); setPreview(null); setBgImage(null); setBgColor('transparent'); setError(null); }} disabled={isProcessing} className="text-sm text-red-500 hover:underline">Start New Image</button>
        </div>
      }
    >
      <div className="w-full flex flex-col items-center">
        <div 
          className="relative bg-white p-4 shadow-2xl border-8 border-white rounded-2xl overflow-hidden max-w-2xl w-full min-h-[400px] flex items-center justify-center"
          style={{ 
            backgroundColor: bgColor === 'transparent' ? '#f3f4f6' : (bgColor === 'custom' ? 'transparent' : bgColor),
            backgroundImage: bgColor === 'transparent' ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACpJREFUGFdjZEADJgY0QC6AkgAJAAnIAtkgCSQBWSALJIEkIAtkAwM2BQCz8A8LJ0Y4GAAAAABJRU5ErkJggg==")' : (bgImage ? `url(${bgImage})` : undefined),
            backgroundSize: bgColor === 'transparent' ? 'auto' : 'cover',
            backgroundPosition: 'center'
          }}
        >
          {result ? (
            <img src={result} alt="Result" className="block max-w-full h-auto mx-auto animate-in fade-in zoom-in duration-500" />
          ) : (
            <img src={preview!} alt="Original" className={`block max-w-full h-auto mx-auto transition-all ${isProcessing ? 'opacity-30 blur-sm grayscale' : 'opacity-90'}`} />
          )}
          
          {!result && !isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 hover:bg-transparent transition-colors">
              <button className="bg-indigo-600 text-white px-8 py-4 rounded-full font-black shadow-2xl flex items-center gap-3 cursor-pointer hover:scale-110 active:scale-95 transition-all" onClick={handleProcess}>
                <Wand2 className="w-6 h-6" />
                REMOVE BACKGROUND
              </button>
            </div>
          )}
        </div>
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
