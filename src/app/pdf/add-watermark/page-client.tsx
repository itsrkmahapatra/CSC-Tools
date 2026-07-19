'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument, rgb, degrees, StandardFonts } from 'pdf-lib'
import { getPdfFirstPageImage } from '@/lib/pdf-utils'
import { Droplets, Type, Ghost, Layout, Trash2 } from 'lucide-react'

type WatermarkPosition = 'Center' | 'Top-Left' | 'Top-Right' | 'Bottom-Left' | 'Bottom-Right' | 'Tile'

export default function AddWatermark() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Settings
  const [text, setText] = useState('CONFIDENTIAL')
  const [opacity, setOpacity] = useState(0.3)
  const [rotation, setRotation] = useState(-45)
  const [fontSize, setFontSize] = useState(60)
  const [position, setPosition] = useState<WatermarkPosition>('Center')
  const [color, setColor] = useState('#ef4444')

  useEffect(() => {
    if (file) {
      getPdfFirstPageImage(file).then(img => setPreview(img))
    }
  }, [file])

  const hexToRgb = (hex: string) => {
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255
    return rgb(r, g, b)
  }

  const handleProcess = async () => {
    if (!file || !text) return
    setIsProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const font = await pdf.embedFont(StandardFonts.HelveticaBold)
      const pages = pdf.getPages()
      const pdfColor = hexToRgb(color)

      pages.forEach((page) => {
        const { width, height } = page.getSize()
        const textWidth = font.widthOfTextAtSize(text, fontSize)
        const textHeight = fontSize

        const draw = (x: number, y: number) => {
          page.drawText(text, {
            x, y,
            size: fontSize,
            font,
            color: pdfColor,
            opacity,
            rotate: degrees(rotation),
          })
        }

        if (position === 'Tile') {
          const stepX = textWidth + 150
          const stepY = textHeight + 150
          for (let x = -width; x < width * 2; x += stepX) {
            for (let y = -height; y < height * 2; y += stepY) {
              draw(x, y)
            }
          }
        } else {
          let x = width / 2 - textWidth / 2
          let y = height / 2 - textHeight / 2
          
          if (position === 'Top-Left') { x = 50; y = height - 100 }
          if (position === 'Top-Right') { x = width - textWidth - 50; y = height - 100 }
          if (position === 'Bottom-Left') { x = 50; y = 50 }
          if (position === 'Bottom-Right') { x = width - textWidth - 50; y = 50 }

          draw(x, y)
        }
      })

      const pdfBytes = await pdf.save()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Docuvate-Watermarked-${file.name}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert("Error adding watermark.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">Add Watermark</h1>
        <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">Protect your documents with professional text branding, opacity control, and multi-page tiling.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Download Watermarked PDF" colorTheme="red" isProcessing={isProcessing} sidebarContent={
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2 mb-4">
            <Type className="w-4 h-4 text-red-500" /> Content
          </h3>
          <div className="space-y-3">
             <input type="text" value={text} onChange={e => setText(e.target.value)} className="w-full border rounded-lg p-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-red-500 outline-none" placeholder="e.g. DRAFT" />
             <div className="flex gap-2">
               <input type="color" value={color} onChange={e => setColor(e.target.value)} className="h-10 w-12 rounded border p-1 bg-white cursor-pointer" />
               <input type="number" value={fontSize} onChange={e => setFontSize(parseInt(e.target.value))} className="flex-grow border rounded-lg p-2 text-sm bg-gray-50" title="Font Size" />
             </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
            <Layout className="w-4 h-4 text-red-500" /> Layout
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {(['Center', 'Tile', 'Top-Left', 'Top-Right', 'Bottom-Left', 'Bottom-Right'] as WatermarkPosition[]).map(p => (
              <button 
                key={p} 
                onClick={() => setPosition(p)}
                className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all ${position === p ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
            <Ghost className="w-4 h-4 text-red-500" /> Appearance
          </h3>
          <div className="space-y-4">
             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Opacity ({Math.round(opacity * 100)}%)</label>
               <input type="range" min="0.05" max="1" step="0.05" value={opacity} onChange={e => setOpacity(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none accent-red-600" />
             </div>
             <div>
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Rotation ({rotation}°)</label>
               <input type="range" min="-180" max="180" step="15" value={rotation} onChange={e => setRotation(parseInt(e.target.value))} className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none accent-red-600" />
             </div>
          </div>
        </div>

        <button onClick={() => { setFile(null); setPreview(null) }} className="w-full text-xs font-bold text-red-500 py-2 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center gap-2">
          <Trash2 className="w-3.5 h-3.5" /> Choose New File
        </button>
      </div>
    }>
      <div className="w-full h-[70vh] flex items-center justify-center bg-gray-100 rounded-3xl p-8 shadow-inner border border-gray-200 overflow-hidden relative">
        <div className="relative bg-white shadow-2xl rounded-lg overflow-hidden max-w-full max-h-full leading-[0]">
          {preview ? (
            <div className="relative group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="PDF Preview" className="max-w-full h-auto border shadow-sm select-none" />
              <div className={`absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center ${position === 'Tile' ? 'flex-wrap gap-12' : ''}`}>
                {position === 'Tile' ? (
                  Array.from({ length: 20 }).map((_, i) => (
                    <span key={i} className="font-black whitespace-nowrap" style={{ opacity, color, fontSize: fontSize/2, transform: `rotate(${rotation}deg)` }}>
                      {text}
                    </span>
                  ))
                ) : (
                  <span 
                    className={`font-black whitespace-nowrap absolute`} 
                    style={{ 
                      opacity, 
                      color, 
                      fontSize: fontSize/2, 
                      transform: `rotate(${rotation}deg)`,
                      ...(position === 'Center' ? {} : 
                         position === 'Top-Left' ? { top: 20, left: 20 } :
                         position === 'Top-Right' ? { top: 20, right: 20 } :
                         position === 'Bottom-Left' ? { bottom: 20, left: 20 } :
                         { bottom: 20, right: 20 })
                    }}
                  >
                    {text}
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="p-20 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">Generating Live Preview</p>
            </div>
          )}
        </div>
        
        <div className="absolute top-6 left-6 flex items-center gap-2 bg-white/80 backdrop-blur-md px-4 py-2 rounded-full border border-white shadow-lg">
           <Droplets className="w-4 h-4 text-red-600" />
           <span className="text-xs font-bold text-gray-800 tracking-tight">Watermark Engine Active</span>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
