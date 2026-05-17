'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

export default function ExamPhoto() {
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const cropperRef = useRef<Cropper | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [preset, setPreset] = useState<'passport' | 'visa' | 'signature'>('passport')

  useEffect(() => {
    if (file) setImageUrl(URL.createObjectURL(file))
  }, [file])

  useEffect(() => {
    if (imageRef.current && imageUrl) {
      if (cropperRef.current) cropperRef.current.destroy();
      
      let ratio = 2 / 2; // Passport standard 2x2 inch
      if (preset === 'visa') ratio = 35 / 45; // 35x45 mm common visa
      if (preset === 'signature') ratio = 3 / 1; // standard signature box

      cropperRef.current = new Cropper(imageRef.current, {
        aspectRatio: ratio,
        viewMode: 1,
      });
    }
  }, [imageUrl, preset])

  const handleProcess = () => {
    if (!cropperRef.current || !file) return
    setIsProcessing(true)
    cropperRef.current.getCroppedCanvas().toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `exam-${preset}-${file.name}`
        a.click()
      }
      setIsProcessing(false)
    }, 'image/jpeg', 0.9)
  }

  if (!file || !imageUrl) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Exam Photo & Signature Resizer</h1>
        <p className="text-center text-gray-500 mb-8">Strict rigid cropping tool matching target dimension guidelines.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/*" multiple={false} theme="blue" label="Select Photo" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Download Regulated Image" colorTheme="blue" isProcessing={isProcessing} sidebarContent={
      <div className="space-y-6">
        <div>
          <h3 className="font-semibold text-gray-700 mb-3">Official Board Preset</h3>
          <div className="flex flex-col gap-2">
            <button onClick={() => setPreset('passport')} className={`py-2 px-4 rounded border text-sm ${preset === 'passport' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white'}`}>US Passport (2x2&quot;)</button>
            <button onClick={() => setPreset('visa')} className={`py-2 px-4 rounded border text-sm ${preset === 'visa' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white'}`}>Schengen Visa (35x45mm)</button>
            <button onClick={() => setPreset('signature')} className={`py-2 px-4 rounded border text-sm ${preset === 'signature' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' : 'bg-white'}`}>Signature Crop (3:1)</button>
          </div>
        </div>
        <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline">Cancel</button>
      </div>
    }>
      <div className="w-full h-[60vh] flex items-center justify-center bg-white p-4 shadow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imageRef} src={imageUrl} alt="Upload" className="max-w-full max-h-full block" />
      </div>
    </WorkspaceLayout>
  )
}
