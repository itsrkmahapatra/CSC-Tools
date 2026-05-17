'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'

export default function JPGtoPDF() {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcess = async () => {
    setIsProcessing(true)
    try {
      const pdf = await PDFDocument.create()
      for (const file of files) {
        const bytes = await file.arrayBuffer()
        let image;
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await pdf.embedJpg(bytes)
        } else if (file.type === 'image/png') {
          image = await pdf.embedPng(bytes)
        } else {
          continue; // skip unsupported directly, or convert to canvas first
        }
        const page = pdf.addPage([image.width, image.height])
        page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
      }
      const pdfBytes = await pdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'converted-images.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert("Error converting images.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (files.length === 0) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">JPG to PDF</h1>
        <p className="text-center text-gray-500 mb-8">Convert standalone or bulk image assets directly into a compiled PDF.</p>
        <Dropzone onFilesDrop={setFiles} accept="image/jpeg, image/png" theme="orange" label="Select Images" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Convert to PDF" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Images Selected</h3>
            <p className="text-xl font-bold text-orange-600 mb-2">{files.length} Files</p>
          </div>
          <button onClick={() => setFiles([])} className="text-sm text-red-500 hover:underline">Clear all</button>
        </div>
      }
    >
      {files.map((f, i) => (
        <div key={i} className="bg-white p-2 rounded shadow border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={URL.createObjectURL(f)} alt="preview" className="h-32 object-contain" />
        </div>
      ))}
    </WorkspaceLayout>
  )
}
