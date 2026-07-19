'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument, degrees } from 'pdf-lib'
import { getPdfPageImages } from '@/lib/pdf-utils'
import { RotateCw } from 'lucide-react'

export default function RotatePDF() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pageImages, setPageImages] = useState<string[]>([])
  // Store rotation per page index: { 0: 90, 1: 180, ... }
  const [pageRotations, setPageRotations] = useState<Record<number, number>>({})

  useEffect(() => {
    if (file) {
      setIsProcessing(true)
      getPdfPageImages(file).then(images => {
        setPageImages(images)
        setPageRotations({})
        setIsProcessing(false)
      }).catch(err => {
        console.error("Failed to load PDF pages", err)
        setIsProcessing(false)
      })
    }
  }, [file])

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const pages = pdf.getPages()

      Object.entries(pageRotations).forEach(([idx, rot]) => {
        const pageIdx = parseInt(idx)
        const page = pages[pageIdx]
        const currentRotation = page.getRotation().angle
        // Rotate by the cumulative rotation clicks
        page.setRotation(degrees(currentRotation + rot))
      })

      const pdfBytes = await pdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `rotated-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert("Error rotating PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  const rotatePage = (index: number) => {
    setPageRotations(prev => ({
      ...prev,
      [index]: ((prev[index] || 0) + 90) % 360
    }))
  }

  const rotateAll = () => {
    const nextRotations: Record<number, number> = {}
    pageImages.forEach((_, i) => {
      nextRotations[i] = ((pageRotations[i] || 0) + 90) % 360
    })
    setPageRotations(nextRotations)
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Rotate PDF Pages</h1>
        <p className="text-center text-gray-500 mb-8">Click individual pages to rotate them 90° clockwise, or rotate the entire document.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Save Rotated PDF" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Quick Actions</h3>
            <div className="flex flex-col gap-2">
              <button 
                onClick={rotateAll} 
                className="py-3 px-4 rounded border font-medium bg-red-50 border-red-500 text-red-700 hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                Rotate All +90°
              </button>
              <button 
                onClick={() => setPageRotations({})} 
                className="py-2 px-4 rounded border text-sm font-medium bg-white text-gray-700 border-gray-200 hover:bg-gray-50"
              >
                Reset All
              </button>
            </div>
          </div>
          <button onClick={() => { setFile(null); setPageImages([]); setPageRotations({}); }} className="text-sm text-red-500 hover:underline">Clear & Choose another</button>
        </div>
      }
    >
      {pageImages.length > 0 ? (
        pageImages.map((imgSrc, idx) => {
          const rotation = pageRotations[idx] || 0
          return (
            <div key={idx} onClick={() => rotatePage(idx)} className="relative flex flex-col items-center group transition-all cursor-pointer">
              <div className="relative bg-white p-2 rounded-lg shadow-md border border-gray-200 hover:border-red-500 transition-colors overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                  src={imgSrc} 
                  alt={`Page ${idx + 1}`} 
                  className="w-40 h-auto object-contain transition-transform duration-300" 
                  style={{ transform: `rotate(${rotation}deg)` }}
                />
                <div className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 shadow-md">
                  <RotateCw className="w-5 h-5" />
                </div>
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
