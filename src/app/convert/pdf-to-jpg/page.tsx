'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { getPdfPageImages } from '@/lib/pdf-utils'

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
    setIsProcessing(true)
    // Download each image individually
    images.forEach((imgUrl, idx) => {
      const a = document.createElement('a')
      a.href = imgUrl
      a.download = `page-${idx + 1}-${file?.name}.jpg`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    })
    setIsProcessing(false)
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">PDF to JPG</h1>
        <p className="text-center text-gray-500 mb-8">Rasterize vector pages into high-resolution discrete images.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="orange" label="Select PDF file" />
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
