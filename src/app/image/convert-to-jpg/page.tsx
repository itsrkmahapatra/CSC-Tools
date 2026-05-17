'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'

export default function ConvertToJPG() {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcess = async () => {
    setIsProcessing(true)
    for (const file of files) {
      try {
        const img = new Image()
        const url = URL.createObjectURL(file)
        img.src = url
        await new Promise((resolve, reject) => {
          img.onload = resolve
          img.onerror = reject
        })

        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) continue
        
        // Fill white background for transparent images
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        ctx.drawImage(img, 0, 0)
        
        canvas.toBlob((blob) => {
          if (!blob) return
          const outUrl = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = outUrl
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
          a.download = `${baseName}.jpg`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
        }, 'image/jpeg', 0.9)

      } catch (error) {
        console.error("Error converting", error)
      }
    }
    setIsProcessing(false)
  }

  if (files.length === 0) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Convert to JPG</h1>
        <p className="text-center text-gray-500 mb-8">Turn PNG, GIF, TIF, PSD, SVG, WEBP, or RAW to JPG locally in your browser.</p>
        <Dropzone onFilesDrop={setFiles} accept="image/*" theme="blue" label="Select Images" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Convert to JPG" 
      colorTheme="blue"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-4">
          <p className="text-sm text-gray-600">All selected images will be processed completely offline and exported as standard JPG files.</p>
          <button onClick={() => setFiles([])} className="text-sm text-red-500 hover:underline">Clear all</button>
        </div>
      }
    >
      {files.map((file, idx) => (
        <div key={idx} className="bg-white p-4 rounded-lg shadow border border-gray-200 w-48 h-48 flex flex-col items-center justify-center relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={URL.createObjectURL(file)} alt={file.name} className="max-w-full max-h-32 object-contain mb-2" />
          <p className="text-xs text-center text-gray-700 truncate w-full px-2">{file.name}</p>
        </div>
      ))}
    </WorkspaceLayout>
  )
}
