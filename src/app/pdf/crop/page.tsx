'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'
import { getPdfPageImages } from '@/lib/pdf-utils'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'
import { CheckCircle, Circle } from 'lucide-react'

export default function CropPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [pageImages, setPageImages] = useState<string[]>([])
  const [selectedPages, setSelectedPages] = useState<number[]>([])
  const [activePreviewIdx, setActivePreviewIdx] = useState(0)
  const imageRef = useRef<HTMLImageElement>(null)
  const cropperRef = useRef<Cropper | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => {
    if (file) {
      setIsProcessing(true)
      getPdfPageImages(file).then(images => {
        setPageImages(images)
        setSelectedPages(images.map((_, i) => i)) // Default select all
        setIsProcessing(false)
      })
    }
  }, [file])

  useEffect(() => {
    if (imageRef.current && pageImages[activePreviewIdx]) {
      if (cropperRef.current) cropperRef.current.destroy();
      cropperRef.current = new Cropper(imageRef.current, {
        viewMode: 1,
        autoCropArea: 0.8,
        background: false,
      });
    }
  }, [pageImages, activePreviewIdx])

  const handleProcess = async () => {
    if (!file || !cropperRef.current || selectedPages.length === 0) {
      alert("Please select at least one page to crop.")
      return
    }
    setIsProcessing(true)
    try {
      const cropData = cropperRef.current.getData(true);
      const imageData = cropperRef.current.getImageData();

      const xPercent = cropData.x / imageData.naturalWidth;
      const yPercent = cropData.y / imageData.naturalHeight;
      const widthPercent = cropData.width / imageData.naturalWidth;
      const heightPercent = cropData.height / imageData.naturalHeight;

      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      
      const pages = pdf.getPages()
      selectedPages.forEach(pageIdx => {
        const page = pages[pageIdx]
        const { width, height } = page.getSize()
        
        const pdfX = width * xPercent;
        const pdfY = height * (1 - (yPercent + heightPercent));
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

  const togglePage = (idx: number) => {
    setSelectedPages(prev => 
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    )
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Crop PDF Pages</h1>
        <p className="text-center text-gray-500 mb-8">Select specific pages and define a crop area to apply only to them.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel={`Crop ${selectedPages.length} Selected Pages`} 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">1. Select Pages</h3>
            <div className="grid grid-cols-3 gap-2 mb-4 max-h-48 overflow-y-auto p-1 border rounded bg-gray-50">
              {pageImages.map((img, idx) => (
                <div key={idx} onClick={() => togglePage(idx)} className={`relative cursor-pointer rounded border-2 transition-all ${selectedPages.includes(idx) ? 'border-red-500 bg-red-50' : 'border-transparent opacity-50'}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={img} alt={`p${idx+1}`} className="w-full h-12 object-contain" />
                  <div className="absolute -top-1 -right-1">
                    {selectedPages.includes(idx) ? <CheckCircle className="w-4 h-4 text-red-500 fill-white" /> : <Circle className="w-4 h-4 text-gray-300 fill-white" />}
                  </div>
                  <span className="absolute bottom-0 right-0 bg-black/50 text-white text-[8px] px-1 font-bold">{idx+1}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setSelectedPages(pageImages.map((_, i) => i))} className="text-[10px] uppercase font-bold text-red-600 hover:underline">All</button>
              <button onClick={() => setSelectedPages([])} className="text-[10px] uppercase font-bold text-gray-500 hover:underline">None</button>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase tracking-wider">2. Define Crop Area</h3>
            <p className="text-xs text-gray-500 mb-4">Adjust the box on the main preview. This specific crop will be applied to all <span className="font-bold text-red-600">{selectedPages.length}</span> selected pages.</p>
          </div>
          
          <button onClick={() => { setFile(null); setPageImages([]); setSelectedPages([]) }} className="text-sm text-red-500 hover:underline">Cancel & Reset</button>
        </div>
      }
    >
      <div className="w-full flex flex-col items-center">
        <div className="w-full max-w-2xl bg-white p-4 shadow-xl border relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imageRef} src={pageImages[activePreviewIdx]} alt="Crop Preview" className="block max-w-full h-auto" />
        </div>
        <div className="flex gap-2 mt-4 overflow-x-auto py-2 w-full max-w-2xl">
          {pageImages.map((img, idx) => (
            <button 
              key={idx} 
              onClick={() => setActivePreviewIdx(idx)} 
              className={`flex-shrink-0 w-16 h-20 border-2 rounded transition-all ${activePreviewIdx === idx ? 'border-red-500 scale-105 shadow-md' : 'border-gray-200 opacity-60'}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img} alt={`Preview ${idx+1}`} className="w-full h-full object-contain" />
            </button>
          ))}
        </div>
      </div>
    </WorkspaceLayout>
  )
}
