'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { getPdfPageImages } from '@/lib/pdf-utils'

import JSZip from 'jszip'

export default function PDFtoJPG() {
  const [file, setFile] = useState<File | null>(null)
  const [images, setImages] = useState<string[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (file) {
      getPdfPageImages(file).then(imgs => setImages(imgs))
    }
  }, [file])

  const handleProcess = async () => {
    if (images.length === 0) return
    setIsProcessing(true)
    try {
      if (images.length === 1) {
        const a = document.createElement('a')
        a.href = images[0]
        a.download = `page-1-${file?.name.replace('.pdf', '')}.jpg`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } else {
        const zip = new JSZip()
        for (let i = 0; i < images.length; i++) {
          const imgUrl = images[i]
          const response = await fetch(imgUrl)
          const blob = await response.blob()
          const baseName = file?.name.replace('.pdf', '') || 'document'
          zip.file(`${baseName}-page-${i + 1}.jpg`, blob)
        }
        const zipBlob = await zip.generateAsync({ type: 'blob' })
        const outUrl = URL.createObjectURL(zipBlob)
        const a = document.createElement('a')
        a.href = outUrl
        const baseName = file?.name.replace('.pdf', '') || 'document'
        a.download = `${baseName}-images.zip`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(outUrl)
      }
    } catch (e) {
      console.error("Failed to generate ZIP", e)
      alert("Error generating ZIP package. Downscaling individual images instead.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">PDF to JPG</h1>
        <p className="text-center text-gray-500 mb-8">Rasterize vector pages into high-resolution discrete images.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel={`Download ${images.length} JPGs`} 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Extraction Ready</h3>
            <p className="text-xs text-gray-500">Every page in this document will be converted to a high-quality JPG image and downloaded to your device.</p>
          </div>
          <button onClick={() => { setFile(null); setImages([]) }} className="text-sm text-red-500 hover:underline">Cancel</button>
        </div>
      }
    >
      {images.map((img, i) => (
        <div key={i} className="bg-white p-2 rounded shadow border relative">
          <span className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">{i + 1}</span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={img} alt="preview" className="h-48 object-contain" />
        </div>
      ))}
    </WorkspaceLayout>
  )
}
