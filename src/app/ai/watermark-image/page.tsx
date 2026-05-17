'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'

export default function WatermarkImage() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [text, setText] = useState('CSC Tools')
  const [opacity, setOpacity] = useState(0.5)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (file) {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        imgRef.current = img
        draw()
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  useEffect(() => {
    if (imgRef.current) draw()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, opacity])

  const draw = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = img.width
    canvas.height = img.height

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(img, 0, 0)

    ctx.save()
    ctx.globalAlpha = opacity
    const fontSize = Math.max(40, img.height / 10)
    ctx.font = `bold ${fontSize}px Arial, sans-serif`
    ctx.fillStyle = 'white'
    
    // Create a repeating watermark pattern diagonally
    ctx.rotate(-45 * Math.PI / 180)
    
    const stepX = ctx.measureText(text).width + 100
    const stepY = fontSize + 100

    // To cover the rotated canvas bounds
    for (let x = -canvas.width * 2; x < canvas.width * 2; x += stepX) {
      for (let y = -canvas.height * 2; y < canvas.height * 2; y += stepY) {
        ctx.fillText(text, x, y)
      }
    }
    
    ctx.restore()
  }

  const handleProcess = () => {
    if (!canvasRef.current || !file) return
    setIsProcessing(true)
    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `watermarked-${file.name}`
      a.click()
      setIsProcessing(false)
    }, file.type)
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Watermark Image</h1>
        <p className="text-center text-gray-500 mb-8">Overlay transparent branding marks or text configurations securely.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/*" multiple={false} theme="blue" label="Select Image" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Download Watermarked Image" colorTheme="blue" isProcessing={isProcessing} sidebarContent={
      <div className="space-y-6">
        <div>
          <label className="text-sm font-bold text-gray-700">Watermark Text</label>
          <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Opacity ({Math.round(opacity * 100)}%)</h3>
          <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" />
        </div>
        <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline mt-4 block">Cancel</button>
      </div>
    }>
      <div className="bg-white p-4 shadow border rounded overflow-hidden flex items-center justify-center w-full h-[60vh]">
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
      </div>
    </WorkspaceLayout>
  )
}
