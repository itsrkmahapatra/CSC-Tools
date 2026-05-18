'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import Upscaler from 'upscaler'
import { Maximize } from 'lucide-react'

export default function PhotoUpscale() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [result, setResult] = useState<string | null>(null)
  const [upscaleFactor, setUpscaleFactor] = useState(2)

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
      const upscaler = new Upscaler()
      const img = new Image()
      img.src = preview
      await img.decode()

      setProgress(30)
      const upscaledImg = await upscaler.upscale(preview, {
        patchSize: 64,
        padding: 2,
        progress: (p) => setProgress(30 + (p * 60))
      })

      setResult(upscaledImg)
      setProgress(100)
    } catch (e) {
      console.error(e)
      alert("Upscaling failed. Please try a smaller image.")
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
        <p className="text-center text-gray-500 mb-8">Increase image resolution and restore details using client-side AI super-resolution.</p>
        <Dropzone onFilesDrop={handleFilesDrop} accept="image/*" multiple={false} theme="indigo" label="Select Image to Upscale" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={result ? handleDownload : handleProcess} 
      processLabel={result ? "Download Upscaled Image" : (isProcessing ? "Upscaling..." : "Start AI Upscale")} 
      colorTheme="indigo"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Upscale Settings</h3>
            <div className="bg-white p-3 border rounded-lg shadow-sm">
              <p className="text-xs text-gray-500 mb-2">Target Factor</p>
              <div className="flex gap-2">
                {[2, 3, 4].map(f => (
                  <button 
                    key={f} 
                    onClick={() => setUpscaleFactor(f)}
                    disabled={isProcessing || !!result}
                    className={`flex-1 py-2 rounded border text-sm font-bold transition-all ${upscaleFactor === f ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-gray-600 border-gray-200'}`}
                  >
                    {f}x
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {isProcessing && (
            <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
              <p className="text-xs font-bold text-indigo-800 mb-2 animate-pulse text-center">Processing AI Model...</p>
              <div className="w-full bg-indigo-200 rounded-full h-2.5">
                <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}

          {result && (
            <div className="bg-green-50 p-4 rounded border border-green-200 text-center">
              <p className="text-xs font-bold text-green-800">Done! Resolution enhanced.</p>
            </div>
          )}

          <button onClick={() => { setFile(null); setResult(null); setPreview(null); setProgress(0) }} disabled={isProcessing} className="text-sm text-red-500 hover:underline disabled:opacity-50">Cancel & Choose another</button>
        </div>
      }
    >
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 h-full">
        <div className="flex flex-col items-center">
          <p className="text-xs font-bold text-gray-400 mb-2 uppercase">Original</p>
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center h-[400px] w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview!} alt="Original" className="max-w-full max-h-full object-contain" />
          </div>
        </div>

        <div className="flex flex-col items-center">
          <p className="text-xs font-bold text-indigo-500 mb-2 uppercase">Upscaled (AI Result)</p>
          <div className="bg-white p-4 rounded-xl shadow-lg border border-gray-100 flex items-center justify-center h-[400px] w-full overflow-hidden relative">
            {result ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={result} alt="Upscaled" className="max-w-full max-h-full object-contain animate-in fade-in zoom-in duration-500" />
            ) : (
              <div className="flex flex-col items-center text-gray-300">
                <Maximize className={`w-16 h-16 mb-4 ${isProcessing ? 'animate-pulse text-indigo-300' : ''}`} />
                <p className="text-sm font-medium">{isProcessing ? 'Enhancing details...' : 'Ready to Upscale'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
