'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'
import { getPdfPageImages } from '@/lib/pdf-utils'

export default function ExtractPages() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pageImages, setPageImages] = useState<string[]>([])
  // default to none selected
  const [pagesToExtract, setPagesToExtract] = useState<number[]>([])

  useEffect(() => {
    if (file) {
      setIsProcessing(true)
      getPdfPageImages(file).then(images => {
        setPageImages(images)
        setPagesToExtract([])
        setIsProcessing(false)
      }).catch(err => {
        console.error("Failed to load PDF pages", err)
        setIsProcessing(false)
      })
    }
  }, [file])

  const handleProcess = async () => {
    if (!file || pagesToExtract.length === 0) return
    setIsProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      
      const newPdf = await PDFDocument.create()
      const sortedIndices = [...pagesToExtract].sort((a, b) => a - b)
      const copiedPages = await newPdf.copyPages(pdf, sortedIndices)
      copiedPages.forEach((page) => newPdf.addPage(page))

      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `extracted-${file.name}`
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
    setPagesToExtract(prev => 
      prev.includes(index) ? prev.filter(i => i !== index) : [...prev, index]
    )
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Extract PDF Pages</h1>
        <p className="text-center text-gray-500 mb-8">Pull specific pages out of a PDF and compile them into a brand-new document.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel={`Extract ${pagesToExtract.length} Pages`} 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Pages to Extract</h3>
            <p className="text-3xl font-bold text-red-600 mb-2">{pagesToExtract.length} selected</p>
            <p className="text-xs text-gray-500 mb-4">Click on the pages you want to pull out. Only the selected pages will be saved.</p>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setPagesToExtract(pageImages.map((_, i) => i))} className="text-xs py-1 px-3 bg-red-100 hover:bg-red-200 rounded text-red-700 font-medium">Select All</button>
              <button onClick={() => setPagesToExtract([])} className="text-xs py-1 px-3 bg-gray-100 hover:bg-gray-200 rounded text-gray-700 font-medium">Clear</button>
            </div>
          </div>
          <button onClick={() => { setFile(null); setPageImages([]); setPagesToExtract([]); }} className="text-sm text-red-500 hover:underline">Clear & Choose another</button>
        </div>
      }
    >
      {pageImages.length > 0 ? (
        pageImages.map((imgSrc, idx) => {
          const isSelected = pagesToExtract.includes(idx)
          return (
            <div key={idx} onClick={() => togglePage(idx)} className={`relative flex flex-col items-center group transition-all cursor-pointer ${isSelected ? 'opacity-100 scale-105' : 'opacity-60 grayscale hover:grayscale-0'}`}>
              <div className={`relative bg-white p-2 rounded-lg shadow-md border-4 transition-colors ${isSelected ? 'border-red-500' : 'border-transparent'}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imgSrc} alt={`Page ${idx + 1}`} className="w-40 h-auto object-contain pointer-events-none" />
                
                {isSelected && (
                  <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 shadow-md">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                )}
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
