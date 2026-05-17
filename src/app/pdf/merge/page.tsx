'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'
import { Move } from 'lucide-react'

export default function MergePDF() {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleProcess = async () => {
    if (files.length < 2) {
      alert("Please upload at least 2 PDF files to merge.")
      return
    }
    setIsProcessing(true)
    try {
      const mergedPdf = await PDFDocument.create()
      for (const file of files) {
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => mergedPdf.addPage(page))
      }
      const pdfBytes = await mergedPdf.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'merged.pdf'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert("Error merging PDFs.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (files.length === 0) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Merge PDF</h1>
        <p className="text-center text-gray-500 mb-8">Combine PDFs in the order you want with the easiest PDF merger available.</p>
        <Dropzone onFilesDrop={setFiles} accept="application/pdf" label="Select PDF files" theme="red" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Merge PDF" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Reorder your files by selecting and uploading them in the desired order, or clear to restart.</p>
          <button onClick={() => setFiles([])} className="text-sm text-red-500 hover:underline">Clear all</button>
        </div>
      }
    >
      {files.map((file, idx) => (
        <div key={idx} className="bg-white p-4 rounded-lg shadow border border-gray-200 w-48 h-64 flex flex-col items-center justify-center cursor-move hover:shadow-md transition-shadow relative group">
          <div className="text-red-500 mb-2">
            <Move className="w-12 h-12" />
          </div>
          <p className="text-sm text-center text-gray-700 truncate w-full px-2 mt-4 font-medium">{file.name}</p>
          <span className="absolute bottom-2 right-2 bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded-full">{idx + 1}</span>
          <button 
            onClick={() => setFiles(files.filter((_, i) => i !== idx))}
            className="absolute top-2 right-2 bg-red-100 text-red-600 rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      ))}
    </WorkspaceLayout>
  )
}
