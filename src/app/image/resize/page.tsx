'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'

export default function ResizeImage() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [maintainRatio, setMaintainRatio] = useState(true)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (file) {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        imgRef.current = img
        setWidth(img.width)
        setHeight(img.height)
        if (canvasRef.current) {
          canvasRef.current.width = img.width
          canvasRef.current.height = img.height
          const ctx = canvasRef.current.getContext('2d')
          ctx?.drawImage(img, 0, 0)
        }
      }
    }
  }, [file])

  const handleWidthChange = (val: number) => {
    setWidth(val)
    if (maintainRatio && imgRef.current) {
      setHeight(Math.round(val * (imgRef.current.height / imgRef.current.width)))
    }
  }

  const handleHeightChange = (val: number) => {
    setHeight(val)
    if (maintainRatio && imgRef.current) {
      setWidth(Math.round(val * (imgRef.current.width / imgRef.current.height)))
    }
  }

  const handleProcess = () => {
    if (!file || !imgRef.current) return
    setIsProcessing(true)
    
    const finalCanvas = document.createElement('canvas')
    finalCanvas.width = width
    finalCanvas.height = height
    const ctx = finalCanvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(imgRef.current, 0, 0, width, height)
    }

    finalCanvas.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `resized-${file.name}`
      a.click()
      setIsProcessing(false)
    }, file.type)
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Resize Image</h1>
        <p className="text-center text-gray-500 mb-8">Scale dimensions up or down using absolute pixel width/height rules.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/*" multiple={false} theme="blue" label="Select Image" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Download Resized Image" colorTheme="blue" isProcessing={isProcessing} sidebarContent={
      <div className="space-y-4">
        <div>
          <label className="text-sm font-bold text-gray-700">Width (px)</label>
          <input type="number" value={width} onChange={e => handleWidthChange(parseInt(e.target.value) || 0)} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-700">Height (px)</label>
          <input type="number" value={height} onChange={e => handleHeightChange(parseInt(e.target.value) || 0)} className="w-full border rounded p-2" />
        </div>
        <div className="flex items-center space-x-2">
          <input type="checkbox" id="aspect" checked={maintainRatio} onChange={() => setMaintainRatio(!maintainRatio)} />
          <label htmlFor="aspect" className="text-sm text-gray-700">Maintain Aspect Ratio</label>
        </div>
        <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline mt-4 block">Cancel</button>
      </div>
    }>
      <div className="bg-white p-4 shadow border rounded overflow-hidden max-w-2xl flex flex-col items-center">
        <p className="text-xs text-gray-500 mb-2">Original Preview</p>
        <canvas ref={canvasRef} className="max-w-full max-h-[50vh] object-contain border border-dashed" />
      </div>
    </WorkspaceLayout>
  )
}
