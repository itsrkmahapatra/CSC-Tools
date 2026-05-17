'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import SignatureCanvas from 'react-signature-canvas'

export default function PhotoEditor() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const canvasRef = useRef<SignatureCanvas>(null)
  const [bgImage, setBgImage] = useState<string>('')

  useEffect(() => {
    if (file) setBgImage(URL.createObjectURL(file))
  }, [file])

  const handleProcess = () => {
    if (!canvasRef.current || !file) return
    setIsProcessing(true)
    
    // Merge background and drawing
    const baseCanvas = document.createElement('canvas')
    const img = new Image()
    img.src = bgImage
    img.onload = () => {
      baseCanvas.width = img.width
      baseCanvas.height = img.height
      const ctx = baseCanvas.getContext('2d')
      if (!ctx) return
      
      ctx.drawImage(img, 0, 0)
      
      // Draw signature canvas on top
      const sigCanvas = canvasRef.current?.getCanvas()
      if (sigCanvas) {
         ctx.drawImage(sigCanvas, 0, 0, img.width, img.height)
      }

      baseCanvas.toBlob((blob) => {
        if (!blob) return
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `edited-${file.name}`
        a.click()
        setIsProcessing(false)
      }, file.type)
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Photo Editor</h1>
        <p className="text-center text-gray-500 mb-8">Comprehensive studio canvas tool for sketching freehand paths.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/*" multiple={false} theme="blue" label="Select Image" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Download Edited Image" colorTheme="blue" isProcessing={isProcessing} sidebarContent={
      <div className="space-y-4">
        <p className="text-xs text-gray-500">Draw freely over the image. Click process to merge your sketch with the background.</p>
        <button onClick={() => canvasRef.current?.clear()} className="w-full py-2 border rounded bg-white hover:bg-gray-50">Clear Drawings</button>
        <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline mt-4 block">Cancel</button>
      </div>
    }>
      <div className="relative shadow-xl border rounded overflow-hidden max-w-2xl inline-block" style={{ width: 800, height: 600 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={bgImage} alt="bg" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
        <div className="absolute inset-0 w-full h-full">
           <SignatureCanvas ref={canvasRef} penColor="red" canvasProps={{width: 800, height: 600, className: 'w-full h-full cursor-crosshair'}} />
        </div>
      </div>
    </WorkspaceLayout>
  )
}
