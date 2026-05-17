'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'
import { getPdfPageImages } from '@/lib/pdf-utils'

export default function CompressPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [level, setLevel] = useState<'recommended' | 'extreme'>('recommended')

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    try {
      if (level === 'recommended') {
        // Standard Structure Optimization
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const newPdf = await PDFDocument.create()
        const copiedPages = await newPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => newPdf.addPage(page))
        // Strips dead objects
        const pdfBytes = await newPdf.save({ useObjectStreams: false })
        download(pdfBytes, `compressed-${file.name}`)
      } else {
        // Extreme Flattening (Render to images, then rebuild)
        const images = await getPdfPageImages(file)
        const newPdf = await PDFDocument.create()
        for (const imgUrl of images) {
          const imgBytes = await fetch(imgUrl).then(r => r.arrayBuffer())
          const image = await newPdf.embedJpg(imgBytes)
          const page = newPdf.addPage([image.width, image.height])
          page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height })
        }
        const pdfBytes = await newPdf.save()
        download(pdfBytes, `extreme-compressed-${file.name}`)
      }
    } catch (e) {
      console.error(e)
      alert("Error compressing PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  const download = (bytes: Uint8Array, filename: string) => {
    const blob = new Blob([bytes as unknown as BlobPart], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Compress PDF</h1>
        <p className="text-center text-gray-500 mb-8">Reduce file size while optimizing for maximal PDF quality locally.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Compress PDF" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Compression Level</h3>
            <div className="flex flex-col gap-3">
              <label className={`border-2 p-4 rounded-lg cursor-pointer transition-colors ${level === 'recommended' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}>
                <input type="radio" name="level" value="recommended" checked={level === 'recommended'} onChange={() => setLevel('recommended')} className="hidden" />
                <span className="font-bold block mb-1">Recommended Compression</span>
                <span className="text-xs text-gray-500">Good quality, removes dead structural objects and standardizes streams. Text remains selectable.</span>
              </label>
              
              <label className={`border-2 p-4 rounded-lg cursor-pointer transition-colors ${level === 'extreme' ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}>
                <input type="radio" name="level" value="extreme" checked={level === 'extreme'} onChange={() => setLevel('extreme')} className="hidden" />
                <span className="font-bold block mb-1">Extreme Compression</span>
                <span className="text-xs text-gray-500">Flattens the entire document into compressed images. Drastically reduces size for image-heavy PDFs but text will no longer be selectable.</span>
              </label>
            </div>
          </div>
          <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline">Cancel</button>
        </div>
      }
    >
      <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200 flex flex-col items-center justify-center relative w-full max-w-sm">
        <div className="text-red-500 mb-4 text-6xl text-center">🗜️</div>
        <p className="text-lg text-center text-gray-800 font-bold truncate w-full mt-4">{file.name}</p>
        <p className="text-sm text-gray-500 mt-2 text-center w-full">Original Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
    </WorkspaceLayout>
  )
}
