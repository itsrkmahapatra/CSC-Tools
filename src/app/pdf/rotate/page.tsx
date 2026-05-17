'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument, degrees } from 'pdf-lib'

export default function RotatePDF() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rotation, setRotation] = useState<number>(90)

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
        <p className="text-center text-gray-500 mb-8">Change the orientation (90, 180, 270 degrees) of entire files or individual pages.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Rotate PDF" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Rotation Angle</h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => setRotation(90)} className={`py-3 px-4 rounded border font-medium ${rotation === 90 ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white text-gray-600'}`}>Right (90°)</button>
              <button onClick={() => setRotation(-90)} className={`py-3 px-4 rounded border font-medium ${rotation === -90 ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white text-gray-600'}`}>Left (-90°)</button>
              <button onClick={() => setRotation(180)} className={`py-3 px-4 rounded border font-medium ${rotation === 180 ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white text-gray-600'}`}>Upside Down (180°)</button>
            </div>
          </div>
          <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline">Clear & Choose another</button>
        </div>
      }
    >
      <div className="bg-white p-8 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center relative max-w-sm w-full">
        <div className="text-red-500 mb-8 text-6xl" style={{ transform: `rotate(${rotation}deg)`, transition: 'transform 0.3s ease' }}>📄</div>
        <p className="text-lg text-center text-gray-800 font-bold truncate w-full mt-4">{file.name}</p>
        <p className="text-sm text-gray-500 mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
    </WorkspaceLayout>
  )
}
