'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'

export default function RepairPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [status, setStatus] = useState<string>('')

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    setStatus('Analyzing cross-reference tables...')
    try {
      const arrayBuffer = await file.arrayBuffer()
      // Loading with ignoreEncryption and recreating standardizes the XREF table and strips corrupted stream artifacts
      setStatus('Rebuilding structure...')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true, throwOnInvalidObject: false } as any)
      
      const newPdf = await PDFDocument.create()
      const pages = await newPdf.copyPages(pdf, pdf.getPageIndices())
      pages.forEach(p => newPdf.addPage(p))

      setStatus('Saving repaired document...')
      const pdfBytes = await newPdf.save({ useObjectStreams: false })
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `repaired-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert("This document is too corrupted to be repaired locally.")
    } finally {
      setIsProcessing(false)
      setStatus('')
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Repair PDF</h1>
        <p className="text-center text-gray-500 mb-8">Scan broken streams, fix corrupted cross-reference tables, and salvage unreadable PDF bytes.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select Broken PDF" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Attempt Repair" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Repair Engine</h3>
            <p className="text-xs text-gray-500">Our client-side engine will attempt to parse the raw byte array, bypass invalid objects, and reconstruct the document tree.</p>
          </div>
          <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline">Cancel</button>
        </div>
      }
    >
      <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200 flex flex-col items-center justify-center relative w-full max-w-sm">
        <div className="text-red-500 mb-4 text-6xl text-center">🔧</div>
        <p className="text-lg text-center text-gray-800 font-bold truncate w-full mt-4">{file.name}</p>
        {status && <p className="text-sm font-bold text-blue-600 mt-4 animate-pulse">{status}</p>}
      </div>
    </WorkspaceLayout>
  )
}
