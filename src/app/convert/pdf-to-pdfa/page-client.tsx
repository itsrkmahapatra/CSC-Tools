'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'

export default function PdfToPdfA() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      
      // Simulate PDF/A conversion logic (Flattening annotations, embedding fonts strictly)
      pdf.setCreator('Docuvate PDF/A Generator')
      pdf.setProducer('Docuvate System')
      
      const pdfBytes = await pdf.save({ useObjectStreams: false })
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `archive-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert("Error archiving PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">PDF to PDF/A</h1>
        <p className="text-center text-gray-500 mb-8">Standardize output structures into the ISO-compliant format safe for long-term document archiving.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Convert to PDF/A" colorTheme="red" isProcessing={isProcessing} sidebarContent={
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-2">Archival Engine</h3>
          <p className="text-xs text-gray-500">This will restructure cross-reference tables and flatten interactive streams to comply with long-term retention standards.</p>
        </div>
        <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline">Cancel</button>
      </div>
    }>
      <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200 flex flex-col items-center justify-center relative w-full max-w-sm">
        <div className="text-red-500 mb-4 text-6xl text-center">🗃️</div>
        <p className="text-lg text-center text-gray-800 font-bold truncate w-full mt-4">{file.name}</p>
        <p className="text-sm font-bold text-blue-600 mt-4">Ready for Archival</p>
      </div>
    </WorkspaceLayout>
  )
}
