'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument, degrees } from 'pdf-lib'
import { getPdfFirstPageImage } from '@/lib/pdf-utils'

export default function RotatePDF() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rotation, setRotation] = useState<number>(90)

  useEffect(() => {
    if (file) {
      getPdfFirstPageImage(file).then(img => setPreview(img))
    }
  }, [file])

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      
      const pages = pdf.getPages()
      pages.forEach(page => {
        const currentRotation = page.getRotation().angle
        page.setRotation(degrees(currentRotation + rotation))
      })

      const pdfBytes = await pdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rotated-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert("Error rotating PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Rotate PDF</h1>
        <p className="text-center text-gray-500 mb-8">Change the orientation of entire files visually.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Save Rotated PDF" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Rotation Angle</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => setRotation(rotation + 90)} className={`py-3 px-4 rounded border font-medium bg-red-50 border-red-500 text-red-700 hover:bg-red-100 transition-colors`}>
                Rotate Right +90°
              </button>
              <button onClick={() => setRotation(rotation - 90)} className={`py-3 px-4 rounded border font-medium bg-red-50 border-red-500 text-red-700 hover:bg-red-100 transition-colors`}>
                Rotate Left -90°
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-4 text-center">Current Offset: {(rotation % 360)}°</p>
          </div>
          <button onClick={() => { setFile(null); setPreview(null); setRotation(0) }} className="text-sm text-red-500 hover:underline">Clear & Choose another</button>
        </div>
      }
    >
      <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200 flex flex-col items-center justify-center relative w-full max-w-lg">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={preview} 
            alt="PDF Preview" 
            className="max-w-full h-80 object-contain shadow-md border transition-transform duration-300 ease-in-out" 
            style={{ transform: `rotate(${rotation}deg)` }} 
          />
        ) : (
          <div className="text-red-500 mb-8 text-6xl" style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.3s ease' }}>📄</div>
        )}
        <p className="text-lg text-center text-gray-800 font-bold truncate w-full mt-8">{file.name}</p>
        <p className="text-sm text-gray-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
    </WorkspaceLayout>
  )
}
