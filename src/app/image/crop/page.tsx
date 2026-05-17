'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import Cropper from 'cropperjs'
import 'cropperjs/dist/cropper.css'

export default function CropImage() {
  const [file, setFile] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const imageRef = useRef<HTMLImageElement>(null)
  const cropperRef = useRef<Cropper | null>(null)
  const [aspectRatio, setAspectRatio] = useState<number | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const handleFilesDrop = (files: File[]) => {
    if (files.length > 0) {
      setFile(files[0])
      setImageUrl(URL.createObjectURL(files[0]))
    }
  }

  useEffect(() => {
    if (imageRef.current && imageUrl) {
      if (cropperRef.current) {
        cropperRef.current.destroy()
      }
      cropperRef.current = new Cropper(imageRef.current, {
        aspectRatio: aspectRatio === null ? NaN : aspectRatio,
        viewMode: 1,
      })
    }
  }, [imageUrl, aspectRatio])

  const handleProcess = () => {
    if (!cropperRef.current) return
    setIsProcessing(true)
    cropperRef.current.getCroppedCanvas().toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `cropped-${file?.name || 'image.png'}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
      }
      setIsProcessing(false)
    }, file?.type || 'image/png')
  }

  if (!file || !imageUrl) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Crop Image</h1>
        <p className="text-center text-gray-500 mb-8">Crop pictures to the exact size you want in seconds.</p>
        <Dropzone onFilesDrop={handleFilesDrop} accept="image/*" multiple={false} label="Select Image" theme="blue" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Crop Image" 
      colorTheme="blue"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Aspect Ratio</h3>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setAspectRatio(null)} className={`py-2 px-4 rounded border text-sm ${aspectRatio === null ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-gray-600'}`}>Free</button>
              <button onClick={() => setAspectRatio(1)} className={`py-2 px-4 rounded border text-sm ${aspectRatio === 1 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-gray-600'}`}>1:1</button>
              <button onClick={() => setAspectRatio(16/9)} className={`py-2 px-4 rounded border text-sm ${aspectRatio === 16/9 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-gray-600'}`}>16:9</button>
              <button onClick={() => setAspectRatio(4/3)} className={`py-2 px-4 rounded border text-sm ${aspectRatio === 4/3 ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-gray-600'}`}>4:3</button>
            </div>
          </div>
          <button onClick={() => { setFile(null); setImageUrl(null) }} className="text-sm text-red-500 hover:underline">Cancel & Choose another</button>
        </div>
      }
    >
      <div className="w-full h-full flex items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img ref={imageRef} src={imageUrl} alt="Upload" className="max-w-full max-h-full block" style={{ maxWidth: '100%' }} />
      </div>
    </WorkspaceLayout>
  )
}
