'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'
import { getPdfFirstPageImage } from '@/lib/pdf-utils'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

export default function CropPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const cropperRef = useRef<Cropper | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (file) {
      getPdfFirstPageImage(file).then(img => setImageUrl(img))
    }
  }, [file])

  useEffect(() => {
    if (imageRef.current && imageUrl) {
      if (cropperRef.current) cropperRef.current.destroy();
      cropperRef.current = new Cropper(imageRef.current, {
        viewMode: 1,
        autoCropArea: 0.8,
        background: false,
      });
    }
  }, [imageUrl])

  const handleProcess = async () => {
    if (!file || !cropperRef.current) return
    setIsProcessing(true)
    try {
      const cropData = cropperRef.current.getData(true);
      const imageData = cropperRef.current.getImageData();

      // Calculate percentages of crop box relative to natural image dimensions
      const xPercent = cropData.x / imageData.naturalWidth;
      const yPercent = cropData.y / imageData.naturalHeight;
      const widthPercent = cropData.width / imageData.naturalWidth;
      const heightPercent = cropData.height / imageData.naturalHeight;

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      
      const pages = pdf.getPages()
      pages.forEach(page => {
        const { width, height } = page.getSize()
        
        // In PDF coordinates, (0,0) is bottom-left. 
        // Image cropData.y is from top-left.
        const pdfX = width * xPercent;
        const pdfY = height * (1 - (yPercent + heightPercent)); // Invert Y-axis
        const pdfWidth = width * widthPercent;
        const pdfHeight = height * heightPercent;

        page.setCropBox(pdfX, pdfY, pdfWidth, pdfHeight)
      })

      const pdfBytes = await pdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `cropped-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert("Error cropping PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file || !imageUrl) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Crop PDF</h1>
        <p className="text-center text-gray-500 mb-8">Adjust the printable visible bounding box area of a PDF document page.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Crop PDF" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Crop Boundaries</h3>
            <p className="text-xs text-gray-500 mb-4">Drag the boundary box over the preview on the left to define the new visible margin. The crop box coordinates will be applied across all pages in the document.</p>
          </div>
          <button onClick={() => { setFile(null); setImageUrl(null) }} className="text-sm text-red-500 hover:underline">Cancel & Choose another</button>
        </div>
      }
    >
      <div className="w-full max-w-2xl bg-white p-4 shadow-xl border relative">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imageRef} src={imageUrl} alt="PDF First Page" className="block max-w-full h-auto" />
      </div>
    </WorkspaceLayout>
  )
}
