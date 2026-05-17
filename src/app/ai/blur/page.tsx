'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'

export default function BlurFace() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [blurAmount, setBlurAmount] = useState(10)

  useEffect(() => {
    if (file && canvasRef.current) {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx || !canvasRef.current) return
        canvasRef.current.width = img.width
        canvasRef.current.height = img.height
        
        ctx.filter = `blur(${blurAmount}px)`
        ctx.drawImage(img, 0, 0)
        ctx.filter = 'none'
      }
    }
  }, [file, blurAmount])

  const handleProcess = () => {
    if (!canvasRef.current || !file) return
    setIsProcessing(true)
    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `blurred-${file.name}`
      a.click()
      setIsProcessing(false)
    }, file.type)
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Blur Photo</h1>
        <p className="text-center text-gray-500 mb-8">Mask target regions using pixelation filters or gaussian blur boxes.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/*" multiple={false} theme="blue" label="Select Image" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Download Blurred Image" colorTheme="blue" isProcessing={isProcessing} sidebarContent={
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Gaussian Blur ({blurAmount}px)</h3>
          <input type="range" min="0" max="50" step="1" value={blurAmount} onChange={(e) => setBlurAmount(parseInt(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        </div>
        <p className="text-xs text-gray-500">Applying a global blur filter directly using HTML5 Canvas primitives.</p>
        <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline mt-4 block">Cancel</button>
      </div>
    }>
      <div className="bg-white p-4 shadow border rounded overflow-hidden max-w-2xl max-h-[60vh] flex items-center justify-center">
        <canvas ref={canvasRef} className="max-w-full max-h-[50vh] object-contain" />
      </div>
    </WorkspaceLayout>
  )
}
