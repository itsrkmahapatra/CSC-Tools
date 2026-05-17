'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import { getPdfFirstPageImage } from '@/lib/pdf-utils'

export default function AddPageNumbers() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [position, setPosition] = useState<'bottom-center' | 'bottom-right' | 'top-center' | 'top-right'>('bottom-center')
  const [startNumber, setStartNumber] = useState(1)

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
      const font = await pdf.embedFont(StandardFonts.Helvetica)
      
      const pages = pdf.getPages()
      pages.forEach((page, idx) => {
        const { width, height } = page.getSize()
        const text = String(startNumber + idx)
        const textWidth = font.widthOfTextAtSize(text, 12)
        
        let x = width / 2 - textWidth / 2
        let y = 30
        
        if (position === 'bottom-right') { x = width - 40 - textWidth; y = 30 }
        if (position === 'top-center') { x = width / 2 - textWidth / 2; y = height - 40 }
        if (position === 'top-right') { x = width - 40 - textWidth; y = height - 40 }

        page.drawText(text, {
          x,
          y,
          size: 12,
          font,
          color: rgb(0, 0, 0),
        })
      })

      const pdfBytes = await pdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `numbered-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert("Error adding page numbers.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Add Page Numbers</h1>
        <p className="text-center text-gray-500 mb-8">Inject custom dynamic numbering scripts onto specific margins.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Add Page Numbers" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Position</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setPosition('top-center')} className={`py-2 px-2 rounded border text-sm ${position === 'top-center' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white text-gray-600'}`}>Top Center</button>
              <button onClick={() => setPosition('top-right')} className={`py-2 px-2 rounded border text-sm ${position === 'top-right' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white text-gray-600'}`}>Top Right</button>
              <button onClick={() => setPosition('bottom-center')} className={`py-2 px-2 rounded border text-sm ${position === 'bottom-center' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white text-gray-600'}`}>Bottom Center</button>
              <button onClick={() => setPosition('bottom-right')} className={`py-2 px-2 rounded border text-sm ${position === 'bottom-right' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white text-gray-600'}`}>Bottom Right</button>
            </div>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Starting Number</h3>
            <input type="number" min="1" value={startNumber} onChange={(e) => setStartNumber(parseInt(e.target.value) || 1)} className="w-full border rounded p-2 text-center" />
          </div>
          <button onClick={() => { setFile(null); setPreview(null) }} className="text-sm text-red-500 hover:underline">Clear & Choose another</button>
        </div>
      }
    >
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center relative w-full max-w-sm">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="PDF Preview" className="max-w-full h-auto border shadow-sm" />
        ) : (
          <p>Loading preview...</p>
        )}
      </div>
    </WorkspaceLayout>
  )
}
