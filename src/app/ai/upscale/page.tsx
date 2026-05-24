'use client'
import { useState, useEffect } from 'react'
import dynamic from 'next/dynamic'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import ErrorBoundary from '@/components/ui/ErrorBoundary'

// We will load ONNX dynamically to avoid SSR and hydration mismatches
function UpscaleTool() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [ort, setOrt] = useState<any>(null)

  useEffect(() => {
    // Load onnxruntime-web only on the client side
    import('onnxruntime-web').then((mod) => {
      setOrt(mod)
      // Configure WASM paths
      mod.env.wasm.wasmPaths = '/Docuvate/ort/'
    })
  }, [])

  const handleFilesDrop = (droppedFiles: File[]) => {
    const f = droppedFiles[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setProgress(0)
  }

  const handleProcess = async () => {
    if (!file || !preview || !ort) return
    setIsProcessing(true)
    setProgress(10)

    try {
      // Use the self-hosted model path or HuggingFace
      const modelUrl = 'https://huggingface.co/qualcomm/Real-ESRGAN-General-x4v3/resolve/main/Real-ESRGAN-General-x4v3.onnx'

      const session = await ort.InferenceSession.create(modelUrl, {
        executionProviders: ['webgl', 'wasm']
      })
      setProgress(30)

      const img = new Image()
      img.src = preview
      await img.decode()

      const upscaleFactor = 4 
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) return

      canvas.width = img.width * upscaleFactor
      canvas.height = img.height * upscaleFactor

      const tileSize = 128 
      const totalTiles = Math.ceil(img.height / tileSize) * Math.ceil(img.width / tileSize)
      let processedTiles = 0

      for (let y = 0; y < img.height; y += tileSize) {
        for (let x = 0; x < img.width; x += tileSize) {
          const w = Math.min(tileSize, img.width - x)
          const h = Math.min(tileSize, img.height - y)

          const tileCanvas = document.createElement('canvas')
          tileCanvas.width = w
          tileCanvas.height = h
          const tCtx = tileCanvas.getContext('2d', { willReadFrequently: true })
          tCtx?.drawImage(img, x, y, w, h, 0, 0, w, h)

          const imageData = tCtx?.getImageData(0, 0, w, h)
          const float32Data = new Float32Array(3 * w * h)

          for (let i = 0; i < w * h; i++) {
            float32Data[i] = imageData!.data[i * 4] / 255
            float32Data[i + w * h] = imageData!.data[i * 4 + 1] / 255
            float32Data[i + 2 * w * h] = imageData!.data[i * 4 + 2] / 255
          }

          const tensor = new ort.Tensor('float32', float32Data, [1, 3, h, w])      
          const results = await session.run({ 'input': tensor })
          const output = results[Object.keys(results)[0]].data as Float32Array

          const outW = w * upscaleFactor
          const outH = h * upscaleFactor
          const outData = new Uint8ClampedArray(outW * outH * 4)

          for (let i = 0; i < outW * outH; i++) {
            outData[i * 4] = Math.max(0, Math.min(255, output[i] * 255))
            outData[i * 4 + 1] = Math.max(0, Math.min(255, output[i + outW * outH] * 255))
            outData[i * 4 + 2] = Math.max(0, Math.min(255, output[i + 2 * outW * outH] * 255))
            outData[i * 4 + 3] = 255
          }

          const outImageData = new ImageData(outData, outW, outH)
          const outCanvas = document.createElement('canvas')
          outCanvas.width = outW
          outCanvas.height = outH
          outCanvas.getContext('2d')?.putImageData(outImageData, 0, 0)

          ctx.drawImage(outCanvas, x * upscaleFactor, y * upscaleFactor)

          processedTiles++
          setProgress(30 + Math.floor((processedTiles / totalTiles) * 65))
        }
      }

      setResult(canvas.toDataURL('image/png'))
      setProgress(100)
    } catch (e) {
      console.error("AI Upscale failed:", e)
      alert("AI Upscale failed. This model requires a lot of VRAM/RAM. Try a smaller image.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `upscaled-${file?.name || 'image'}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">AI Photo Upscale</h1>
        <p className="text-center text-gray-500 mb-8">Increase image resolution using local browser-side ONNX AI models.</p>
        <Dropzone onFilesDrop={handleFilesDrop} accept="image/*" multiple={false} theme="indigo" label="Select Image" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={result ? handleDownload : handleProcess} 
      processLabel={result ? "Download Result" : (isProcessing ? "Upscaling..." : "Start AI Upscale")} 
      colorTheme="indigo"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <p className="text-xs text-gray-500">Note: Processing happens 100% locally in your browser.</p>
          {isProcessing && (
            <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
              <p className="text-xs font-bold text-indigo-800 mb-2 animate-pulse text-center">Processing AI Model...</p>
              <div className="w-full bg-indigo-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
          {result && <div className="bg-green-50 p-4 rounded border text-center text-xs font-bold text-green-800">Upscaling Complete!</div>}
          <button onClick={() => { setFile(null); setResult(null); setPreview(null); }} disabled={isProcessing} className="text-sm text-red-500 hover:underline">Reset</button>
        </div>
      }
    >
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center min-h-[300px]">
            {preview && <img src={preview} alt="Original" className="max-w-full max-h-full object-contain" />}
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center min-h-[300px]">
            {result && <img src={result} alt="Upscaled" className="max-w-full max-h-full object-contain" />}
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

