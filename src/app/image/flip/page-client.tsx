'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'

export default function FlipImage() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [horizontal, setHorizontal] = useState(false)
  const [vertical, setVertical] = useState(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (file && canvasRef.current) {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx || !canvasRef.current) return
        canvasRef.current.width = img.width
        canvasRef.current.height = img.height
        
        ctx.clearRect(0, 0, img.width, img.height)
        ctx.save()
        ctx.translate(horizontal ? img.width : 0, vertical ? img.height : 0)
        ctx.scale(horizontal ? -1 : 1, vertical ? -1 : 1)
        ctx.drawImage(img, 0, 0)
        ctx.restore()
      }
    }
  }, [file, horizontal, vertical])

  const handleProcess = () => {
    if (!canvasRef.current || !file) return
    setIsProcessing(true)
    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `flipped-${file.name}`
      a.click()
      setIsProcessing(false)
    }, file.type)
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Flip Image</h1>
        <p className="text-center text-gray-500 mb-8">Flip any visual instantly along horizontal or vertical mirrors.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/*" multiple={false} theme="blue" label="Select Image" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Download Image" colorTheme="blue" isProcessing={isProcessing} sidebarContent={
      <div className="space-y-4">
        <button onClick={() => setHorizontal(!horizontal)} className={`w-full py-2 border rounded ${horizontal ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}>Flip Horizontal</button>
        <button onClick={() => setVertical(!vertical)} className={`w-full py-2 border rounded ${vertical ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}>Flip Vertical</button>
        <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline mt-4 block">Cancel</button>
      </div>
    }>
      <div className="bg-white p-4 shadow border rounded overflow-hidden max-w-2xl max-h-full">
        <canvas ref={canvasRef} className="max-w-full max-h-[60vh] object-contain" />
      </div>
    </WorkspaceLayout>
  )
}
