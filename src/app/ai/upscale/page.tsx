'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import ErrorBoundary from '@/components/ui/ErrorBoundary'
import * as ort from 'onnxruntime-web'

// Configure WASM paths
ort.env.wasm.wasmPaths = 'https://cdn.jsdelivr.net/npm/onnxruntime-web@1.19.0/dist/'

function UpscaleTool() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)

  const handleFilesDrop = (droppedFiles: File[]) => {
    const f = droppedFiles[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
    setProgress(0)
  }

  const handleProcess = async () => {
    if (!file || !preview) return
    setIsProcessing(true)
    setProgress(10)
    
    try {
      // Fetch as ArrayBuffer to bypass URL resolution issues
      const response = await fetch('/CSC-Tools/models/super_resolution_quantized.onnx')
      if (!response.ok) throw new Error(`Model fetch failed: ${response.statusText}`)
      const modelBuffer = await response.arrayBuffer()
      
      const session = await ort.InferenceSession.create(modelBuffer, {
        executionProviders: ['webgpu', 'webgl', 'wasm']
      })
      setProgress(30)

      const img = new Image()
      img.src = preview
      await img.decode()

      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      canvas.width = img.width * 2
      canvas.height = img.height * 2
      
      const tileSize = 256
      for (let y = 0; y < img.height; y += tileSize) {
        for (let x = 0; x < img.width; x += tileSize) {
          const tileCanvas = document.createElement('canvas')
          tileCanvas.width = Math.min(tileSize, img.width - x)
          tileCanvas.height = Math.min(tileSize, img.height - y)
          tileCanvas.getContext('2d')?.drawImage(img, x, y, tileCanvas.width, tileCanvas.height, 0, 0, tileCanvas.width, tileCanvas.height)
          
          const imageData = tileCanvas.getContext('2d')?.getImageData(0, 0, tileCanvas.width, tileCanvas.height)
          const float32Data = new Float32Array(3 * tileCanvas.width * tileCanvas.height)
          
          for (let i = 0; i < imageData!.data.length / 4; i++) {
            float32Data[i] = imageData!.data[i * 4] / 255
            float32Data[i + tileCanvas.width * tileCanvas.height] = imageData!.data[i * 4 + 1] / 255
            float32Data[i + 2 * tileCanvas.width * tileCanvas.height] = imageData!.data[i * 4 + 2] / 255
          }

          const tensor = new ort.Tensor('float32', float32Data, [1, 3, tileCanvas.height, tileCanvas.width])
          await session.run({ 'input': tensor })
          ctx?.drawImage(tileCanvas, x * 2, y * 2)
        }
      }

      setResult(canvas.toDataURL())
      setProgress(100)
    } catch (e) {
      console.error("AI Upscale failed:", e)
      throw e
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    const a = document.createElement('a')
    a.href = result
    a.download = `upscaled-${file?.name}`
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
          <p className="text-xs text-gray-500">Note: Requires model file in the ./public/models/ directory.</p>
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
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center">
            {preview && <img src={preview} alt="Original" className="max-w-full max-h-full object-contain" />}
        </div>
        <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center">
            {result && <img src={result} alt="Upscaled" className="max-w-full max-h-full object-contain" />}
        </div>
      </div>
    </WorkspaceLayout>
  )
}

export default function PhotoUpscale() {
  return (
    <ErrorBoundary>
      <UpscaleTool />
    </ErrorBoundary>
  )
}
