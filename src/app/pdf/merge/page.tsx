'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'
import { Move } from 'lucide-react'
import { getPdfFirstPageImage } from '@/lib/pdf-utils'

interface FileWithPreview {
  file: File;
  preview: string | null;
}

export default function MergePDF() {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFilesDrop = async (droppedFiles: File[]) => {
    setIsProcessing(true)
    const newFilesWithPreviews: FileWithPreview[] = []
    
    for (const f of droppedFiles) {
      const preview = await getPdfFirstPageImage(f)
      newFilesWithPreviews.push({ file: f, preview })
    }
    
    setFiles(prev => [...prev, ...newFilesWithPreviews])
    setIsProcessing(false)
  }

  const handleProcess = async () => {
    if (files.length < 2) {
      alert("Please upload at least 2 PDF files to merge.")
      return
    }
    setIsProcessing(true)
    try {
      const mergedPdf = await PDFDocument.create()
      for (const item of files) {
        const arrayBuffer = await item.file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => mergedPdf.addPage(page))
      }
      const pdfBytes = await mergedPdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
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
        <p className="text-center text-gray-500 mb-8">Combine PDFs in the order you want with visual document previews.</p>
        <Dropzone onFilesDrop={handleFilesDrop} accept="application/pdf" label="Select PDF files" theme="red" />
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
          <p className="text-sm text-gray-600">Reorder your files by clicking the &quot;Remove&quot; button and re-uploading, or clear to restart.</p>
          <button onClick={() => setFiles([])} className="text-sm text-red-500 hover:underline">Clear all</button>
        </div>
      }
    >
      {files.map((item, idx) => (
        <div key={idx} className="bg-white p-3 rounded-lg shadow border border-gray-200 w-48 h-64 flex flex-col items-center relative group hover:border-red-500 transition-colors">
          {item.preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.preview} alt={item.file.name} className="w-full h-40 object-contain mb-2 bg-gray-50 border" />
          ) : (
            <div className="w-full h-40 flex items-center justify-center bg-gray-50 border mb-2 text-red-500">
              <Move className="w-12 h-12" />
            </div>
          )}
          <p className="text-xs text-center text-gray-700 truncate w-full font-medium">{item.file.name}</p>
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded-full font-bold">{idx + 1}</span>
          <button 
            onClick={() => setFiles(files.filter((_, i) => i !== idx))}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-all hover:scale-110 shadow-md"
            title="Remove Document"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          </button>
        </div>
      ))}
    </WorkspaceLayout>
  )
}
