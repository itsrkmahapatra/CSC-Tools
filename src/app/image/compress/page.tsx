'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import imageCompression from 'browser-image-compression'

export default function CompressImage() {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [maxSizeMB, setMaxSizeMB] = useState(1)

  const handleProcess = async () => {
    setIsProcessing(true)
    for (const file of files) {
      try {
        const options = {
          maxSizeMB: maxSizeMB,
          useWebWorker: true
        }
        const compressedFile = await imageCompression(file, options)
        const url = URL.createObjectURL(compressedFile)
        const a = document.createElement('a')
        a.href = url
        a.download = `compressed-${file.name}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      } catch (error) {
        console.error(error)
      }
    }
    setIsProcessing(false)
  }

  if (files.length === 0) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Compress Image</h1>
        <p className="text-center text-gray-500 mb-8">Compress JPG, PNG, SVG, and GIFs while saving space and maintaining quality.</p>
        <Dropzone onFilesDrop={setFiles} accept="image/*" theme="blue" label="Select Images" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Compress Images" 
      colorTheme="blue"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Target Max Size (MB)</label>
            <input 
              type="range" 
              min="0.1" 
              max="5" 
              step="0.1" 
              value={maxSizeMB} 
              onChange={(e) => setMaxSizeMB(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="text-right text-sm text-gray-500 mt-1">{maxSizeMB} MB</div>
          </div>
          <button onClick={() => setFiles([])} className="text-sm text-red-500 hover:underline">Clear all</button>
        </div>
      }
    >
      {files.map((file, idx) => (
        <div key={idx} className="bg-white p-4 rounded-lg shadow border border-gray-200 w-48 h-48 flex flex-col items-center justify-center relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={URL.createObjectURL(file)} alt={file.name} className="max-w-full max-h-32 object-contain mb-2" />
          <p className="text-xs text-center text-gray-700 truncate w-full px-2">{file.name}</p>
        </div>
      ))}
    </WorkspaceLayout>
  )
}
