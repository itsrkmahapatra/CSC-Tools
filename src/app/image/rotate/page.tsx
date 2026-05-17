'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'

export default function RotateImage() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rotation, setRotation] = useState(90)
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
  }, [rotation])

  const draw = () => {
    const canvas = canvasRef.current
    const img = imgRef.current
    if (!canvas || !img) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Calculate new dimensions
    const rads = rotation * Math.PI / 180
    const s = Math.sin(rads)
    if (s < 0) { /* sin is negative */ }
    
    // Simplification for 90 deg steps:
    if (rotation % 180 !== 0) {
      canvas.width = img.height
      canvas.height = img.width
    } else {
      canvas.width = img.width
      canvas.height = img.height
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate(rads)
    ctx.drawImage(img, -img.width / 2, -img.height / 2)
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
      a.download = `rotated-${file.name}`
      a.click()
      setIsProcessing(false)
    }, file.type)
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Rotate Image</h1>
        <p className="text-center text-gray-500 mb-8">Shift portrait/landscape visuals dynamically.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/*" multiple={false} theme="blue" label="Select Image" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Download Rotated Image" colorTheme="blue" isProcessing={isProcessing} sidebarContent={
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Rotation</h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => setRotation(r => r + 90)} className="py-2 px-4 rounded border text-sm bg-blue-50 border-blue-500 text-blue-700">Rotate Right +90°</button>
            <button onClick={() => setRotation(r => r - 90)} className="py-2 px-4 rounded border text-sm bg-blue-50 border-blue-500 text-blue-700">Rotate Left -90°</button>
          </div>
          <p className="text-center mt-2 text-xs text-gray-500">Current Angle: {rotation % 360}°</p>
        </div>
        <button onClick={() => { setFile(null); setRotation(0) }} className="text-sm text-red-500 hover:underline block">Cancel</button>
      </div>
    }>
      <div className="bg-white p-4 shadow border rounded overflow-hidden flex items-center justify-center w-full h-[60vh]">
        <canvas ref={canvasRef} className="max-w-full max-h-full object-contain" />
      </div>
    </WorkspaceLayout>
  )
}
