'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'

export default function ConvertFromJPG() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [format, setFormat] = useState<'image/png' | 'image/webp'>('image/png')
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
        ctx.drawImage(img, 0, 0)
      }
    }
  }, [file])

  const handleProcess = () => {
    if (!canvasRef.current || !file) return
    setIsProcessing(true)
    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const ext = format === 'image/png' ? 'png' : 'webp'
      a.download = `converted-${file.name.split('.')[0]}.${ext}`
      a.click()
      setIsProcessing(false)
    }, format)
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Convert from JPG</h1>
        <p className="text-center text-gray-500 mb-8">Export standard .jpg files into target transparency arrays like .png or .webp.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/jpeg, image/jpg" multiple={false} theme="blue" label="Select JPG Image" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Download Image" colorTheme="blue" isProcessing={isProcessing} sidebarContent={
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Target Format</h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => setFormat('image/png')} className={`py-2 px-4 rounded border text-sm ${format === 'image/png' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}>PNG (Lossless)</button>
            <button onClick={() => setFormat('image/webp')} className={`py-2 px-4 rounded border text-sm ${format === 'image/webp' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}>WEBP (Modern Web)</button>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline mt-4 block">Cancel</button>
      </div>
    }>
      <div className="bg-white p-4 shadow border rounded overflow-hidden max-w-2xl max-h-full">
        <canvas ref={canvasRef} className="max-w-full max-h-[60vh] object-contain" />
      </div>
    </WorkspaceLayout>
  )
}
