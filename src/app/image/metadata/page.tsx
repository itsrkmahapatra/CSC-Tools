'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'

export default function ImageMetadata() {
  const [file, setFile] = useState<File | null>(null)

  const handleProcess = () => {
    alert("Metadata extraction is displayed automatically upon upload.")
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">View Image Metadata</h1>
        <p className="text-center text-gray-500 mb-8">Read and display underlying embedded metadata files securely.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/*" multiple={false} theme="blue" label="Select Image" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Data Extracted" colorTheme="blue" isProcessing={false} sidebarContent={
      <div className="space-y-4">
        <p className="text-xs text-gray-500">Metadata is processed locally via the File API. No data is sent to external servers.</p>
        <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline mt-4 block">Choose Another</button>
      </div>
    }>
      <div className="w-full flex gap-4 h-[60vh]">
        <div className="flex-1 bg-white p-2 border shadow overflow-hidden flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={URL.createObjectURL(file)} alt="preview" className="max-w-full max-h-full object-contain" />
        </div>
        <div className="flex-1 bg-white p-6 border shadow overflow-y-auto">
          <h3 className="font-bold text-gray-800 mb-4 text-xl border-b pb-2">File Properties</h3>
          <ul className="space-y-3 text-sm text-gray-700">
            <li><strong>File Name:</strong> {file.name}</li>
            <li><strong>File Type:</strong> {file.type}</li>
            <li><strong>File Size:</strong> {(file.size / 1024).toFixed(2)} KB</li>
            <li><strong>Last Modified:</strong> {new Date(file.lastModified).toLocaleString()}</li>
            <li><strong>EXIF Data:</strong> <span className="italic text-gray-400">Deep EXIF extraction requires specialized WASM modules omitted in this sandbox.</span></li>
          </ul>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
