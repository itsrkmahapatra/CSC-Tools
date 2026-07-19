'use client'
import { useState, useEffect, useRef } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument, rgb } from 'pdf-lib'
import { getPdfPageImages } from '@/lib/pdf-utils'
import { Eraser, Info, Trash2, Eye, ShieldAlert, CheckCircle } from 'lucide-react'

interface PlacedRedaction {
  id: string;
  pageIndex: number;
  x: number; // in pixels relative to display width (500px)
  y: number;
  width: number;
  height: number;
  color: 'black' | 'red' | 'gray';
}

export default function RedactPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [pageImages, setPageImages] = useState<string[]>([])
  const [pageSizes, setPageSizes] = useState<{ width: number; height: number }[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  // Redaction Workspace Items
  const [redactions, setRedactions] = useState<PlacedRedaction[]>([])
  const [redactColor, setRedactColor] = useState<'black' | 'red' | 'gray'>('black')

  // Drawing state
  const [dragStart, setDragStart] = useState<{ pageIndex: number; x: number; y: number } | null>(null)
  const [tempBox, setTempBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)

  useEffect(() => {
    if (file) {
      setIsProcessing(true)
      getPdfPageImages(file).then(async (images) => {
        setPageImages(images)
        
        // Load actual PDF dimensions
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const sizes = pdf.getPages().map(p => p.getSize())
        setPageSizes(sizes)
        setRedactions([])
        setIsProcessing(false)
      }).catch(err => {
        console.error(err)
        alert("Error loading PDF preview.")
        setIsProcessing(false)
      })
    }
  }, [file])

  // Mouse handlers for drawing boxes
  const handlePageMouseDown = (e: React.MouseEvent, pageIdx: number) => {
    // Avoid drawing if clicking on a delete button
    if ((e.target as HTMLElement).closest('.delete-redact')) return

    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setDragStart({ pageIndex: pageIdx, x, y })
    setTempBox({ x, y, width: 0, height: 0 })
  }

  const handlePageMouseMove = (e: React.MouseEvent) => {
    if (!dragStart || !tempBox) return
    const rect = e.currentTarget.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    const x = Math.min(dragStart.x, currentX)
    const y = Math.min(dragStart.y, currentY)
    const width = Math.abs(dragStart.x - currentX)
    const height = Math.abs(dragStart.y - currentY)

    setTempBox({ x, y, width, height })
  }

  const handlePageMouseUp = () => {
    if (dragStart && tempBox && tempBox.width > 4 && tempBox.height > 4) {
      const newRedact: PlacedRedaction = {
        id: `redact-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        pageIndex: dragStart.pageIndex,
        x: tempBox.x,
        y: tempBox.y,
        width: tempBox.width,
        height: tempBox.height,
        color: redactColor
      }
      setRedactions(prev => [...prev, newRedact])
    }
    setDragStart(null)
    setTempBox(null)
  }

  const deleteRedaction = (id: string) => {
    setRedactions(prev => prev.filter(r => r.id !== id))
  }

  const handleProcess = async () => {
    if (!file || redactions.length === 0) {
      alert("Please draw at least one redaction box on the document.")
      return
    }
    setIsProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const pages = pdf.getPages()

      for (const redact of redactions) {
        const pageIdx = redact.pageIndex
        if (pageIdx >= pages.length) continue

        const pdfPage = pages[pageIdx]
        const { width: pdfWidth, height: pdfHeight } = pdfPage.getSize()

        // Page display proportions
        const displayWidth = 500
        const ratio = pageSizes[pageIdx].height / pageSizes[pageIdx].width
        const displayHeight = displayWidth * ratio

        const xFactor = pdfWidth / displayWidth
        const yFactor = pdfHeight / displayHeight

        const pdfX = redact.x * xFactor
        const pdfY = (displayHeight - redact.y - redact.height) * yFactor
        const pdfW = redact.width * xFactor
        const pdfH = redact.height * yFactor

        let colorRgb = rgb(0, 0, 0) // default black
        if (redact.color === 'red') colorRgb = rgb(1, 0, 0)
        if (redact.color === 'gray') colorRgb = rgb(0.5, 0.5, 0.5)

        pdfPage.drawRectangle({
          x: pdfX,
          y: pdfY,
          width: pdfW,
          height: pdfH,
          color: colorRgb
        })
      }

      const pdfBytes = await pdf.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Redacted-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert("Error applying redactions to PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">Redact PDF Document</h1>
        <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">Permanently sanitize and black out sensitive numbers, text arrays, or image pixels in your PDF document.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF to Redact" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel={isProcessing ? "Processing..." : `Apply redactions (${redactions.length})`}
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
              <Eraser className="w-4.5 h-4.5 text-red-500" /> Redact Styles
            </h3>
            
            <div>
              <label className="text-[9px] font-black text-gray-400 uppercase block mb-2">Mask Fill Color</label>
              <div className="grid grid-cols-3 gap-2">
                <button 
                  onClick={() => setRedactColor('black')}
                  className={`py-2 text-[10px] font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${redactColor === 'black' ? 'bg-black text-white border-black' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-black border border-white"></span> Black
                </button>
                <button 
                  onClick={() => setRedactColor('red')}
                  className={`py-2 text-[10px] font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${redactColor === 'red' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-red-600"></span> Red
                </button>
                <button 
                  onClick={() => setRedactColor('gray')}
                  className={`py-2 text-[10px] font-bold rounded-lg border flex items-center justify-center gap-1.5 transition-all ${redactColor === 'gray' ? 'bg-gray-100 text-gray-800 border-gray-300' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span> Gray
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3 text-xs">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>Sanitization blocks</span>
              <span className="text-red-600 font-black">{redactions.length}</span>
            </div>
            
            <div className="flex items-start gap-2 text-[10px] text-gray-400 leading-normal border-t pt-3 mt-3">
              <ShieldAlert className="w-4.5 h-4.5 text-red-500 shrink-0 mt-0.5" />
              <span>Redaction draws vector rectangles directly onto the document content stream. Text and pixels underneath are strictly non-recoverable once saved.</span>
            </div>
          </div>

          <button onClick={() => { setFile(null); setPageImages([]); setRedactions([]); }} className="w-full text-xs font-bold text-red-500 py-2.5 hover:bg-red-50 border border-transparent rounded-xl transition-all">Choose Another PDF</button>
        </div>
      }
    >
      <div className="flex flex-col items-center p-4">
        <div className="flex items-center gap-2 mb-4 bg-red-50 border border-red-100 text-red-700 px-4 py-2 rounded-xl text-xs max-w-md text-center">
          <Info className="w-4 h-4 shrink-0" />
          <span>Click and drag over the page preview images to draw redaction blocks.</span>
        </div>

        {pageImages.length > 0 ? (
          pageImages.map((src, pageIdx) => {
            const size = pageSizes[pageIdx] || { width: 595, height: 842 }
            const ratio = size.height / size.width
            const displayWidth = 500
            const displayHeight = displayWidth * ratio

            // Check if drawing on this page
            const isDrawingThisPage = dragStart?.pageIndex === pageIdx

            return (
              <div 
                key={pageIdx} 
                className="relative bg-white border border-gray-300 shadow-xl mb-12 select-none group cursor-crosshair"
                style={{ width: displayWidth, height: displayHeight }}
                onMouseDown={(e) => handlePageMouseDown(e, pageIdx)}
                onMouseMove={isDrawingThisPage ? handlePageMouseMove : undefined}
                onMouseUp={isDrawingThisPage ? handlePageMouseUp : undefined}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} className="w-full h-full pointer-events-none" alt={`Page ${pageIdx + 1}`} />
                
                <div className="absolute top-3 left-3 bg-black/60 text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded shadow-md z-10 uppercase">
                  Page {pageIdx + 1}
                </div>

                {/* Drawing visual block in-progress */}
                {isDrawingThisPage && tempBox && (
                  <div 
                    className={`absolute border border-dashed z-20 ${
                      redactColor === 'black' ? 'bg-black/60 border-black' : redactColor === 'red' ? 'bg-red-500/30 border-red-500' : 'bg-gray-500/40 border-gray-500'
                    }`}
                    style={{ left: tempBox.x, top: tempBox.y, width: tempBox.width, height: tempBox.height }}
                  />
                )}

                {/* Committed Redactions */}
                {redactions.filter(r => r.pageIndex === pageIdx).map(redact => (
                  <div 
                    key={redact.id}
                    className={`absolute redact-box z-10 border group/item hover:ring-2 hover:ring-red-500 transition-all ${
                      redact.color === 'black' ? 'bg-black border-black' : redact.color === 'red' ? 'bg-red-600 border-red-700' : 'bg-gray-500 border-gray-600'
                    }`}
                    style={{ left: redact.x, top: redact.y, width: redact.width, height: redact.height }}
                  >
                    {/* Delete button displayed on hover */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); deleteRedaction(redact.id); }}
                      className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-transform hover:scale-110 active:scale-100 opacity-0 group-hover/item:opacity-100 delete-redact z-20"
                      title="Remove redaction"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <svg className="animate-spin h-8 w-8 text-red-500 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-sm font-bold animate-pulse">Preparing Document Visuals...</p>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
