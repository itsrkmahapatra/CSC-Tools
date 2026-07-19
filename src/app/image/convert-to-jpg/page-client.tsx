'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'

export default function ConvertToJPG() {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcess = async () => {
    if (files.length === 0) return
    setIsProcessing(true)
    try {
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()
      const isMultiple = files.length > 1

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
          
          const baseName = file.name.substring(0, file.name.lastIndexOf('.')) || file.name
          
          const blob = await new Promise<Blob>((resolve) => {
            canvas.toBlob((b) => resolve(b || new Blob()), 'image/jpeg', 0.9)
          })

          if (isMultiple) {
            zip.file(`${baseName}.jpg`, blob)
          } else {
            const outUrl = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = outUrl
            a.download = `${baseName}.jpg`
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            URL.revokeObjectURL(outUrl)
          }
          URL.revokeObjectURL(url)
        } catch (error) {
          console.error("Error converting file:", file.name, error)
        }
      }

      if (isMultiple) {
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const outUrl = URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = outUrl
        a.download = `Docuvate-Conversions.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(outUrl)
      }
    } catch (e) {
      console.error("Failed to run conversion package", e)
      alert("Error packaging batch images.")
    } finally {
      setIsProcessing(false)
    }
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
