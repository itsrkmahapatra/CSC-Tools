'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'
import { getPdfPageImages } from '@/lib/pdf-utils'

export default function RemovePages() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pageImages, setPageImages] = useState<string[]>([])
  // pagesToKeep defaults to all pages
  const [pagesToKeep, setPagesToKeep] = useState<number[]>([])

  useEffect(() => {
    if (file) {
      setIsProcessing(true)
      getPdfPageImages(file).then(images => {
        setPageImages(images)
        setPagesToKeep(images.map((_, i) => i))
        setIsProcessing(false)
      }).catch(err => {
        console.error("Failed to load PDF pages", err)
        setIsProcessing(false)
      })
    }
  }, [file])

  const handleProcess = async () => {
    if (!file || pagesToKeep.length === 0) return
    setIsProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      
      const newPdf = await PDFDocument.create()
      const sortedIndices = [...pagesToKeep].sort((a, b) => a - b)
      const copiedPages = await newPdf.copyPages(pdf, sortedIndices)
      copiedPages.forEach((page) => newPdf.addPage(page))

      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cleaned-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert("Error processing PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  const togglePage = (index: number) => {
    setPagesToKeep(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Remove Pages from PDF</h1>
        <p className="text-center text-gray-500 mb-8">View a thumbnail grid of your document and click to delete specific pages.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel={`Save Document (${pagesToKeep.length} Pages)`} 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Pages to Remove</h3>
            <p className="text-3xl font-bold text-red-600 mb-2">{pageImages.length - pagesToKeep.length} removed</p>
            <p className="text-xs text-gray-500 mb-4">Click the trash icon to mark a page for deletion. It will turn gray and be excluded from your final file.</p>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setPagesToKeep([])} className="text-xs py-1 px-3 bg-red-100 hover:bg-red-200 rounded text-red-700 font-medium">Remove All</button>
              <button onClick={() => setPagesToKeep(pageImages.map((_, i) => i))} className="text-xs py-1 px-3 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-medium">Reset</button>
            </div>
          </div>
          <button onClick={() => { setFile(null); setPageImages([]); setPagesToKeep([]); }} className="text-sm text-red-500 hover:underline">Clear & Choose another</button>
        </div>
      }
    >
      {pageImages.length > 0 ? (
        pageImages.map((imgSrc, idx) => {
          const isKept = pagesToKeep.includes(idx)
          return (
            <div key={idx} className={`relative flex flex-col items-center group transition-all ${isKept ? 'opacity-100' : 'opacity-40 grayscale'}`}>
              <div className={`relative bg-white p-2 rounded-lg shadow-md border-2 transition-colors ${isKept ? 'border-gray-200' : 'border-red-500'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc} alt={`Page ${idx + 1}`} className="w-40 h-auto object-contain pointer-events-none" />
                
                <button 
                  onClick={() => togglePage(idx)}
                  className={`absolute top-2 right-2 p-2 rounded-full shadow-lg transition-transform hover:scale-110 ${isKept ? 'bg-red-500 text-white opacity-0 group-hover:opacity-100' : 'bg-green-500 text-white opacity-100'}`}
                  title={isKept ? "Remove Page" : "Restore Page"}
                >
                  {isKept ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  )}
                </button>
                <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded-full font-bold">
                  {idx + 1}
                </div>
              </div>
            </div>
          )
        })
      ) : (
        <div className="flex items-center justify-center w-full h-full text-gray-500">
          <p className="animate-pulse">Loading Document Visuals...</p>
        </div>
      )}
    </WorkspaceLayout>
  )
}
