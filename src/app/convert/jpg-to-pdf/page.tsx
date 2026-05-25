'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'
import { Settings, Maximize } from 'lucide-react'

type PageSize = 'A4' | 'Letter' | 'Legal' | 'Original'
type Orientation = 'Portrait' | 'Landscape'
type ImageScaling = 'Fit' | 'Fill' | 'Stretch'

export default function JPGtoPDF() {
  const [files, setFiles] = useState<File[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Settings
  const [pageSize, setPageSize] = useState<PageSize>('A4')
  const [orientation, setOrientation] = useState<Orientation>('Portrait')
  const [margin, setMargin] = useState(20)
  const [imageScaling, setImageScaling] = useState<ImageScaling>('Fit')

  useEffect(() => {
    const saved = localStorage.getItem('jpg-to-pdf-settings')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setPageSize(parsed.pageSize || 'A4')
        setOrientation(parsed.orientation || 'Portrait')
        setMargin(parsed.margin ?? 20)
        setImageScaling(parsed.imageScaling || 'Fit')
      } catch (e) {
        console.error("Failed to load settings", e)
      }
    }
  }, [])

  useEffect(() => {
    localStorage.setItem('jpg-to-pdf-settings', JSON.stringify({ pageSize, orientation, margin, imageScaling }))
  }, [pageSize, orientation, margin, imageScaling])

  const getPageDimensions = (size: PageSize, orient: Orientation): [number, number] => {
    let dims: [number, number] = [595.28, 841.89] // A4
    if (size === 'Letter') dims = [612, 792]
    if (size === 'Legal') dims = [612, 1008]
    
    if (orient === 'Landscape') {
      return [dims[1], dims[0]]
    }
    return dims
  }

  const handleProcess = async () => {
    setIsProcessing(true)
    try {
      const pdf = await PDFDocument.create()
      
      for (const file of files) {
        const bytes = await file.arrayBuffer()
        let image;
        if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
          image = await pdf.embedJpg(bytes)
        } else if (file.type === 'image/png') {
          image = await pdf.embedPng(bytes)
        } else {
          continue;
        }

        const [width, height] = pageSize === 'Original' ? [image.width, image.height] : getPageDimensions(pageSize, orientation)
        const page = pdf.addPage([width, height])
        
        const safeWidth = width - (margin * 2)
        const safeHeight = height - (margin * 2)
        
        let drawWidth = safeWidth
        let drawHeight = safeHeight
        let x = margin
        let y = margin

        if (imageScaling === 'Fit') {
          const ratio = Math.min(safeWidth / image.width, safeHeight / image.height)
          drawWidth = image.width * ratio
          drawHeight = image.height * ratio
          x = margin + (safeWidth - drawWidth) / 2
          y = margin + (safeHeight - drawHeight) / 2
        } else if (imageScaling === 'Fill') {
          const ratio = Math.max(safeWidth / image.width, safeHeight / image.height)
          drawWidth = image.width * ratio
          drawHeight = image.height * ratio
          x = margin + (safeWidth - drawWidth) / 2
          y = margin + (safeHeight - drawHeight) / 2
          // Clipping is handled by page boundaries or we could use a path
        }

        page.drawImage(image, { 
          x, 
          y, 
          width: drawWidth, 
          height: drawHeight 
        })
      }
      
      const pdfBytes = await pdf.save()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Docuvate-Converted.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert("Error converting images.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (files.length === 0) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4 tracking-tight">JPG to PDF</h1>
        <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">Convert standalone or bulk image assets directly into a professional compiled PDF with layout controls.</p>
        <Dropzone onFilesDrop={setFiles} accept="image/jpeg, image/png" theme="red" label="Select Images" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Convert to PDF" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
            <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">
              <Settings className="w-4 h-4" /> Page Settings
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Page Size</label>
                <select 
                  value={pageSize} 
                  onChange={(e) => setPageSize(e.target.value as PageSize)}
                  className="w-full mt-1 border rounded-lg p-2 text-sm bg-white shadow-sm focus:ring-2 focus:ring-red-500 outline-none"
                >
                  <option value="A4">A4 (595 x 842)</option>
                  <option value="Letter">US Letter (612 x 792)</option>
                  <option value="Legal">US Legal (612 x 1008)</option>
                  <option value="Original">Same as Image</option>
                </select>
              </div>

              {pageSize !== 'Original' && (
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase">Orientation</label>
                  <div className="flex gap-2 mt-1">
                    <button 
                      onClick={() => setOrientation('Portrait')}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${orientation === 'Portrait' ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      Portrait
                    </button>
                    <button 
                      onClick={() => setOrientation('Landscape')}
                      className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-all ${orientation === 'Landscape' ? 'bg-red-600 border-red-600 text-white shadow-md' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      Landscape
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Margin ({margin}px)</label>
                <input 
                  type="range" min="0" max="100" step="5" value={margin} 
                  onChange={(e) => setMargin(parseInt(e.target.value))}
                  className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-red-600 mt-2"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase">Image Scaling</label>
                <div className="grid grid-cols-1 gap-2 mt-1">
                  {(['Fit', 'Fill', 'Stretch'] as ImageScaling[]).map((s) => (
                    <button 
                      key={s}
                      onClick={() => setImageScaling(s)}
                      className={`text-left px-3 py-2 text-xs font-medium rounded-lg border transition-all ${imageScaling === s ? 'bg-red-50 border-red-500 text-red-700 font-bold' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                    >
                      {s === 'Fit' && 'Fit (Best for full view)'}
                      {s === 'Fill' && 'Fill (No white spaces)'}
                      {s === 'Stretch' && 'Stretch (Fill page exactly)'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-600">{files.length} images</span>
              <button onClick={() => setFiles([])} className="text-xs text-red-500 hover:font-bold transition-all">Clear all</button>
            </div>
            <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
               <div className="h-full bg-red-500 transition-all" style={{ width: '100%' }}></div>
            </div>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
        {files.map((f, i) => (
          <div key={i} className="group relative bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-xl hover:border-red-300 transition-all">
            <div className="aspect-[3/4] bg-gray-50 flex items-center justify-center p-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={URL.createObjectURL(f)} 
                alt="preview" 
                className={`max-w-full max-h-full shadow-lg ${imageScaling === 'Fill' ? 'object-cover w-full h-full' : 'object-contain'}`} 
              />
            </div>
            <div className="absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-sm p-2 border-t border-gray-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] font-bold text-gray-500 truncate max-w-[100px] uppercase">{f.name}</span>
              <button 
                onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                className="p-1 hover:bg-red-100 text-red-500 rounded-full"
              >
                <Maximize className="w-3 h-3 rotate-45" />
              </button>
            </div>
            <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
              PAGE {i + 1}
            </div>
          </div>
        ))}
      </div>
    </WorkspaceLayout>
  )
}
