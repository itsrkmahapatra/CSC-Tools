'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'
import { getPdfFirstPageImage } from '@/lib/pdf-utils'
import SignatureCanvas from 'react-signature-canvas'

export default function SignPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const sigCanvas = useRef<SignatureCanvas>(null)

  useEffect(() => {
    if (file) {
      getPdfFirstPageImage(file).then(img => setPreview(img))
    }
  }, [file])

  const handleProcess = async () => {
    if (!file || !sigCanvas.current || sigCanvas.current.isEmpty()) {
      alert("Please draw your signature before processing.")
      return
    }
    setIsProcessing(true)
    try {
      // 1. Get Signature as PNG Data URL
      const signatureDataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
      const sigImageBytes = await fetch(signatureDataUrl).then(res => res.arrayBuffer())

      // 2. Load PDF
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      
      // 3. Embed signature image
      const pngImage = await pdf.embedPng(sigImageBytes)
      const pngDims = pngImage.scale(0.5) // Scale down signature

      // 4. Draw on first page (bottom right as default)
      const pages = pdf.getPages()
      const firstPage = pages[0]
      const { width } = firstPage.getSize()
      
      firstPage.drawImage(pngImage, {
        x: width - pngDims.width - 50,
        y: 50,
        width: pngDims.width,
        height: pngDims.height,
      })

      // 5. Save and Export
      const pdfBytes = await pdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `signed-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert("Error applying signature.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Sign PDF</h1>
        <p className="text-center text-gray-500 mb-8">Secure visual overlay matrix to affix hand-drawn signatures.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Sign & Save PDF" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Draw your Signature</h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg bg-white overflow-hidden">
              <SignatureCanvas 
                ref={sigCanvas} 
                penColor="blue" 
                canvasProps={{width: 250, height: 150, className: 'sigCanvas w-full cursor-crosshair'}} 
              />
            </div>
            <div className="flex justify-end mt-2">
              <button onClick={() => sigCanvas.current?.clear()} className="text-xs text-red-500 hover:underline">Clear Signature</button>
            </div>
            <p className="text-xs text-gray-500 mt-4">Your signature will be safely embedded onto the bottom right corner of the first page entirely locally.</p>
          </div>
          <button onClick={() => { setFile(null); setPreview(null) }} className="text-sm text-red-500 hover:underline">Cancel & Choose another PDF</button>
        </div>
      }
    >
      <div className="bg-white p-4 rounded-lg shadow border border-gray-200 flex flex-col items-center justify-center relative w-full max-w-md">
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
