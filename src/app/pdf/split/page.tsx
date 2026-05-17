'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'

export default function SplitPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [rangeStart, setRangeStart] = useState<number>(1)
  const [rangeEnd, setRangeEnd] = useState<number>(1)

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const totalPages = pdf.getPageCount()
      
      const startIdx = Math.max(0, rangeStart - 1)
      const endIdx = Math.min(totalPages - 1, rangeEnd - 1)

      if (startIdx > endIdx) {
        alert("Invalid range")
        setIsProcessing(false)
        return
      }

      const newPdf = await PDFDocument.create()
      const indices = Array.from({length: endIdx - startIdx + 1}, (_, i) => startIdx + i)
      const copiedPages = await newPdf.copyPages(pdf, indices)
      copiedPages.forEach((page) => newPdf.addPage(page))

      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `split-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert("Error splitting PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Split PDF</h1>
        <p className="text-center text-gray-500 mb-8">Separate one page or a whole set for easy conversion into independent PDF files.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Split PDF" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Extract Range</h3>
            <div className="flex space-x-2 items-center">
              <input type="number" min="1" value={rangeStart} onChange={(e) => setRangeStart(parseInt(e.target.value))} className="w-20 border rounded p-2 text-center" />
              <span className="text-gray-500">to</span>
              <input type="number" min="1" value={rangeEnd} onChange={(e) => setRangeEnd(parseInt(e.target.value))} className="w-20 border rounded p-2 text-center" />
            </div>
            <p className="text-xs text-gray-500 mt-2">Enter the page numbers you want to extract.</p>
          </div>
          <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline">Clear & Choose another</button>
        </div>
      }
    >
      <div className="bg-white p-8 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center relative max-w-sm w-full">
        <div className="text-red-500 mb-4 text-6xl">📄</div>
        <p className="text-lg text-center text-gray-800 font-bold truncate w-full">{file.name}</p>
        <p className="text-sm text-gray-500 mt-2">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
    </WorkspaceLayout>
  )
}
