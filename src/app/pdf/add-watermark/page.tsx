'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import { getPdfFirstPageImage } from '@/lib/pdf-utils'

export default function AddWatermark() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(0.5)

  useEffect(() => {
    if (file) {
      getPdfFirstPageImage(file).then(img => setPreview(img))
    }
  }, [file])

  const handleProcess = async () => {
    if (!file || !watermarkText) return
    setIsProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const font = await pdf.embedFont(StandardFonts.HelveticaBold)
      
      const pages = pdf.getPages()
      pages.forEach((page) => {
        const { width, height } = page.getSize()
        const fontSize = 60
        const textWidth = font.widthOfTextAtSize(watermarkText, fontSize)
        
        page.drawText(watermarkText, {
          x: width / 2 - textWidth / 2,
          y: height / 2,
          size: fontSize,
          font,
          color: rgb(0.8, 0.2, 0.2), // Reddish watermark
          opacity: opacity,
          rotate: degrees(45),
        })
      })

      const pdfBytes = await pdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `watermarked-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert("Error adding watermark.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Add Watermark</h1>
        <p className="text-center text-gray-500 mb-8">Stamp text blocks across chosen coordinate layers with adjustable opacity.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Add Watermark" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Watermark Text</h3>
            <input type="text" value={watermarkText} onChange={(e) => setWatermarkText(e.target.value)} className="w-full border rounded p-2" placeholder="e.g. DRAFT" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Opacity ({Math.round(opacity * 100)}%)</h3>
            <input type="range" min="0.1" max="1" step="0.1" value={opacity} onChange={(e) => setOpacity(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600" />
          </div>
          <button onClick={() => { setFile(null); setPreview(null) }} className="text-sm text-red-500 hover:underline">Clear & Choose another</button>
        </div>
      }
    >
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center relative w-full max-w-sm overflow-hidden">
        {preview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="PDF Preview" className="max-w-full h-auto border shadow-sm" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
              <span className="text-red-500 font-bold text-4xl whitespace-nowrap" style={{ opacity, transform: 'rotate(-45deg)' }}>
                {watermarkText}
              </span>
            </div>
          </div>
        ) : (
          <p>Loading preview...</p>
        )}
      </div>
    </WorkspaceLayout>
  )
}
