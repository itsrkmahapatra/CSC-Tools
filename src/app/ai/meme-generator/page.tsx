'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'

export default function MemeGenerator() {
  const [file, setFile] = useState<File | null>(null)
  const [topText, setTopText] = useState('TOP TEXT')
  const [bottomText, setBottomText] = useState('BOTTOM TEXT')
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (file && canvasRef.current) {
      const img = new Image()
      img.src = URL.createObjectURL(file)
      img.onload = () => {
        const ctx = canvasRef.current?.getContext('2d')
        if (!ctx || !canvasRef.current) return
        canvasRef.current.width = img.width
        canvasRef.current.height = img.height
        
        ctx.drawImage(img, 0, 0)
        
        const fontSize = Math.floor(img.height / 10)
        ctx.font = `bold ${fontSize}px Impact, sans-serif`
        ctx.textAlign = 'center'
        ctx.fillStyle = 'white'
        ctx.strokeStyle = 'black'
        ctx.lineWidth = fontSize / 15

        // Top Text
        ctx.strokeText(topText.toUpperCase(), img.width / 2, fontSize + 10)
        ctx.fillText(topText.toUpperCase(), img.width / 2, fontSize + 10)

        // Bottom Text
        ctx.strokeText(bottomText.toUpperCase(), img.width / 2, img.height - 20)
        ctx.fillText(bottomText.toUpperCase(), img.width / 2, img.height - 20)
      }
    }
  }, [file, topText, bottomText])

  const handleProcess = () => {
    if (!canvasRef.current || !file) return
    canvasRef.current.toBlob((blob) => {
      if (!blob) return
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `meme.jpg`
      a.click()
    }, 'image/jpeg')
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Meme Generator</h1>
        <p className="text-center text-gray-500 mb-8">Apply standard stylized bounding text over templates.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/*" multiple={false} theme="blue" label="Select Template" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Download Meme" colorTheme="blue" sidebarContent={
      <div className="space-y-4">
        <div>
          <label className="text-sm font-bold text-gray-700">Top Text</label>
          <input type="text" value={topText} onChange={e => setTopText(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <div>
          <label className="text-sm font-bold text-gray-700">Bottom Text</label>
          <input type="text" value={bottomText} onChange={e => setBottomText(e.target.value)} className="w-full border rounded p-2" />
        </div>
        <button onClick={() => setFile(null)} className="text-sm text-red-500 hover:underline mt-4 block">Cancel</button>
      </div>
    }>
      <div className="bg-white p-4 shadow border rounded overflow-hidden max-w-2xl max-h-full">
        <canvas ref={canvasRef} className="max-w-full max-h-[60vh] object-contain" />
      </div>
    </WorkspaceLayout>
  )
}
