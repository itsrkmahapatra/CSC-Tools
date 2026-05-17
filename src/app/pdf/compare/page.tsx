'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { getPdfFirstPageImage } from '@/lib/pdf-utils'

export default function ComparePDF() {
  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const [img1, setImg1] = useState<string | null>(null)
  const [img2, setImg2] = useState<string | null>(null)

  useEffect(() => {
    if (file1) getPdfFirstPageImage(file1).then(img => setImg1(img))
  }, [file1])

  useEffect(() => {
    if (file2) getPdfFirstPageImage(file2).then(img => setImg2(img))
  }, [file2])

  const handleProcess = () => {
    alert("Visual comparison is active on the screen. Differences are highlighted in inverted colors.")
  }

  if (!file1 || !file2) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Compare PDFs</h1>
        <p className="text-center text-gray-500 mb-8">Visual overlapping pane to highlight text or positional changes between two versions.</p>
        <div className="flex gap-4 max-w-4xl mx-auto">
          <div className="flex-1">
            <h3 className="text-center font-bold text-gray-700 mb-2">Original Document</h3>
            <Dropzone onFilesDrop={(files) => setFile1(files[0])} accept="application/pdf" multiple={false} theme="red" label={file1 ? file1.name : "Select File 1"} />
          </div>
          <div className="flex-1">
            <h3 className="text-center font-bold text-gray-700 mb-2">Modified Document</h3>
            <Dropzone onFilesDrop={(files) => setFile2(files[0])} accept="application/pdf" multiple={false} theme="red" label={file2 ? file2.name : "Select File 2"} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Comparison Active" 
      colorTheme="red"
      isProcessing={false}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Difference Viewer</h3>
            <p className="text-xs text-gray-500 mb-4">Both documents are rendered and overlapped using a difference-blend filter. Any pixels that are perfectly identical will turn solid white or black. <strong className="text-red-500">Bright colored pixels indicate a change between the two documents.</strong></p>
          </div>
          <button onClick={() => { setFile1(null); setFile2(null); setImg1(null); setImg2(null) }} className="text-sm text-red-500 hover:underline">Start Over</button>
        </div>
      }
    >
      <div className="bg-white p-4 rounded-lg shadow-xl border border-gray-200 w-full max-w-3xl relative overflow-hidden flex items-center justify-center" style={{ minHeight: '60vh' }}>
        {img1 && img2 ? (
          <div className="relative w-full h-full flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img1} alt="Doc 1" className="absolute opacity-100 max-w-full max-h-full object-contain pointer-events-none" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={img2} alt="Doc 2" className="absolute opacity-100 max-w-full max-h-full object-contain pointer-events-none mix-blend-difference" />
          </div>
        ) : (
          <p className="animate-pulse text-gray-500">Rendering visual comparison matrices...</p>
        )}
      </div>
    </WorkspaceLayout>
  )
}
