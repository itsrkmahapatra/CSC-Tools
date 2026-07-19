'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'
import { getPdfPageImages } from '@/lib/pdf-utils'
import SignatureCanvas from 'react-signature-canvas'
import { 
  FileText, Info, Trash2, Edit3, Image as ImageIcon, Type, 
  Trash, ArrowRight, RotateCw, PlusCircle, CheckCircle
} from 'lucide-react'

interface PlacedSignature {
  id: string;
  pageIndex: number;
  x: number; // relative to page display width (500px)
  y: number; // relative to page display height
  width: number;
  height: number;
  imgUrl: string;
}

type SignatureType = 'draw' | 'type' | 'upload'

export default function SignPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pageImages, setPageImages] = useState<string[]>([])
  const [pageSizes, setPageSizes] = useState<{ width: number; height: number }[]>([])
  
  // Signature Creator Settings
  const [sigType, setSigType] = useState<SignatureType>('draw')
  const [penColor, setPenColor] = useState('black')
  const [typedText, setTypedText] = useState('John Doe')
  const [typedFont, setTypedFont] = useState('Dancing Script')
  const [uploadedSigUrl, setUploadedSigUrl] = useState<string | null>(null)
  
  // Workspace Placed Items
  const [activeSignatureUrl, setActiveSignatureUrl] = useState<string | null>(null)
  const [placedSignatures, setPlacedSignatures] = useState<PlacedSignature[]>([])
  
  // Drag and drop / Resize states
  const [activeAction, setActiveAction] = useState<{
    type: 'drag' | 'resize';
    sigId: string;
    startX: number;
    startY: number;
    initX: number;
    initY: number;
    initW: number;
    initH: number;
  } | null>(null)

  const sigCanvas = useRef<SignatureCanvas>(null)
  const canvasWorkspaceRef = useRef<HTMLDivElement>(null)

  // CSS for cursive fonts
  useEffect(() => {
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&family=Great+Vibes&family=Pacifico&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)
    return () => {
      document.head.removeChild(link)
    }
  }, [])

  useEffect(() => {
    if (file) {
      setIsProcessing(true)
      getPdfPageImages(file).then(async (images) => {
        setPageImages(images)
        
        // Also load page sizes via pdf-lib
        const arrayBuffer = await file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const sizes = pdf.getPages().map(p => p.getSize())
        setPageSizes(sizes)
        setPlacedSignatures([])
        setIsProcessing(false)
      }).catch(err => {
        console.error(err)
        alert("Error loading PDF preview.")
        setIsProcessing(false)
      })
    }
  }, [file])

  // Process typed text signature to Image URL
  const generateTypedSignature = (): string => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 150
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Choose font mapping
    let fontStr = 'bold 36px "Dancing Script", cursive'
    if (typedFont === 'Pacifico') fontStr = '32px "Pacifico", cursive'
    if (typedFont === 'Great Vibes') fontStr = '40px "Great Vibes", cursive'
    
    ctx.font = fontStr
    ctx.fillStyle = penColor
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(typedText, canvas.width / 2, canvas.height / 2)
    
    return canvas.toDataURL('image/png')
  }

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const f = e.target.files[0]
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedSigUrl(event.target.result as string)
        }
      }
      reader.readAsDataURL(f)
    }
  }

  // Generate active signature Data URL based on inputs
  const createActiveSignature = (): string | null => {
    if (sigType === 'draw') {
      if (!sigCanvas.current || sigCanvas.current.isEmpty()) return null
      return sigCanvas.current.getTrimmedCanvas().toDataURL('image/png')
    }
    if (sigType === 'type') {
      if (!typedText.trim()) return null
      return generateTypedSignature()
    }
    if (sigType === 'upload') {
      return uploadedSigUrl
    }
    return null
  }

  const applySignatureToPage = (pageIdx: number) => {
    const sigUrl = createActiveSignature()
    if (!sigUrl) {
      alert("Please draw, type, or upload a signature first.")
      return
    }
    
    // Create new signature visual item in workspace
    const newSig: PlacedSignature = {
      id: `sig-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      pageIndex: pageIdx,
      x: 175, // Centered default (page displayWidth is 500)
      y: 100,
      width: 150,
      height: 60,
      imgUrl: sigUrl
    }
    
    setPlacedSignatures(prev => [...prev, newSig])
  }

  const deletePlacedSignature = (id: string) => {
    setPlacedSignatures(prev => prev.filter(s => s.id !== id))
  }

  // Coordinate conversion and Embedding process
  const handleProcess = async () => {
    if (!file || placedSignatures.length === 0) {
      alert("Please place at least one signature on the document.")
      return
    }
    setIsProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const pages = pdf.getPages()

      for (const sig of placedSignatures) {
        const pageIdx = sig.pageIndex
        if (pageIdx >= pages.length) continue

        const pdfPage = pages[pageIdx]
        const { width: pdfWidth, height: pdfHeight } = pdfPage.getSize()

        // Fetch signature bytes
        const response = await fetch(sig.imgUrl)
        const sigBytes = await response.arrayBuffer()
        const pngImage = await pdf.embedPng(sigBytes)

        // Translate Display Scale (width = 500px) to PDF scale points
        const displayWidth = 500
        const ratio = pageSizes[pageIdx].height / pageSizes[pageIdx].width
        const displayHeight = displayWidth * ratio

        const xFactor = pdfWidth / displayWidth
        const yFactor = pdfHeight / displayHeight

        const embeddedX = sig.x * xFactor
        // PDF (0, 0) starts bottom-left, HTML top-left
        const embeddedY = (displayHeight - sig.y - sig.height) * yFactor
        const embeddedW = sig.width * xFactor
        const embeddedH = sig.height * yFactor

        pdfPage.drawImage(pngImage, {
          x: embeddedX,
          y: embeddedY,
          width: embeddedW,
          height: embeddedH
        })
      }

      const pdfBytes = await pdf.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Signed-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert("Error embedding signatures to PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Visual Interactive Drag/Resize Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent, type: 'drag' | 'resize', id: string) => {
    e.preventDefault()
    e.stopPropagation()
    const sig = placedSignatures.find(s => s.id === id)
    if (!sig) return

    setActiveAction({
      type,
      sigId: id,
      startX: e.clientX,
      startY: e.clientY,
      initX: sig.x,
      initY: sig.y,
      initW: sig.width,
      initH: sig.height
    })
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!activeAction) return
      const { type, sigId, startX, startY, initX, initY, initW, initH } = activeAction
      const dx = e.clientX - startX
      const dy = e.clientY - startY

      setPlacedSignatures(prev => prev.map(sig => {
        if (sig.id !== sigId) return sig

        const displayWidth = 500
        const pageHeight = displayWidth * (pageSizes[sig.pageIndex]?.height / pageSizes[sig.pageIndex]?.width || 1.4)

        if (type === 'drag') {
          const nextX = Math.max(0, Math.min(displayWidth - sig.width, initX + dx))
          const nextY = Math.max(0, Math.min(pageHeight - sig.height, initY + dy))
          return { ...sig, x: nextX, y: nextY }
        } else {
          const nextW = Math.max(30, initW + dx)
          const nextH = Math.max(15, initH + dy)
          return { ...sig, width: nextW, height: nextH }
        }
      }))
    }

    const handleMouseUp = () => {
      setActiveAction(null)
    }

    if (activeAction) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [activeAction, pageSizes])

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">Sign PDF Document</h1>
        <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">Create beautiful hand-drawn, typed, or uploaded signatures and drag them onto any page in your PDF document.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF to Sign" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel={isProcessing ? "Embedding..." : `Save signed PDF (${placedSignatures.length} signatures)`} 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-red-500" /> Signature Creator
            </h3>
            
            <div className="grid grid-cols-3 gap-1 bg-gray-50 p-1 rounded-lg border">
              <button onClick={() => setSigType('draw')} className={`py-1.5 text-[10px] font-bold rounded transition-all ${sigType === 'draw' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-800'}`}>Draw</button>
              <button onClick={() => setSigType('type')} className={`py-1.5 text-[10px] font-bold rounded transition-all ${sigType === 'type' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-800'}`}>Type</button>
              <button onClick={() => setSigType('upload')} className={`py-1.5 text-[10px] font-bold rounded transition-all ${sigType === 'upload' ? 'bg-white shadow text-red-600' : 'text-gray-500 hover:text-gray-800'}`}>Upload</button>
            </div>

            {/* Draw Interface */}
            {sigType === 'draw' && (
              <div className="space-y-2">
                <div className="border border-gray-200 rounded-lg bg-gray-50 overflow-hidden">
                  <SignatureCanvas 
                    ref={sigCanvas} 
                    penColor={penColor} 
                    canvasProps={{width: 250, height: 120, className: 'sigCanvas w-full cursor-crosshair'}} 
                  />
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex gap-1.5">
                    {['black', 'blue', 'red'].map(c => (
                      <button 
                        key={c} 
                        onClick={() => setPenColor(c)} 
                        className={`w-4 h-4 rounded-full border ${penColor === c ? 'border-gray-800 ring-2 ring-red-500/20' : 'border-transparent'}`}
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                  <button onClick={() => sigCanvas.current?.clear()} className="text-[10px] text-gray-500 hover:text-red-500 font-bold uppercase">Clear</button>
                </div>
              </div>
            )}

            {/* Type Interface */}
            {sigType === 'type' && (
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Enter Name</label>
                  <input type="text" value={typedText} onChange={e => setTypedText(e.target.value)} className="w-full border rounded-lg p-2 text-sm bg-gray-50 focus:ring-2 focus:ring-red-500 outline-none" />
                </div>
                <div>
                  <label className="text-[9px] font-black text-gray-400 uppercase block mb-1">Font Family</label>
                  <select value={typedFont} onChange={e => setTypedFont(e.target.value)} className="w-full border rounded-lg p-2 text-sm bg-gray-50 focus:ring-2 focus:ring-red-500 outline-none">
                    <option value="Dancing Script">Dancing Script</option>
                    <option value="Great Vibes">Great Vibes</option>
                    <option value="Pacifico">Pacifico</option>
                  </select>
                </div>
                {/* Font Color */}
                <div className="flex gap-1.5">
                  {['black', 'blue', 'red'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => setPenColor(c)} 
                      className={`w-4 h-4 rounded-full border ${penColor === c ? 'border-gray-800 ring-2 ring-red-500/20' : 'border-transparent'}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                {/* Visual Preview */}
                <div className="border border-dashed p-3 rounded-lg bg-gray-50 flex items-center justify-center min-h-[50px] overflow-hidden select-none">
                  <p 
                    style={{ 
                      fontFamily: typedFont === 'Dancing Script' ? '"Dancing Script", cursive' : typedFont === 'Pacifico' ? '"Pacifico", cursive' : '"Great Vibes", cursive',
                      color: penColor,
                      fontSize: '24px'
                    }}
                  >
                    {typedText || 'Preview'}
                  </p>
                </div>
              </div>
            )}

            {/* Upload Interface */}
            {sigType === 'upload' && (
              <div className="space-y-2">
                <input type="file" accept="image/*" onChange={handleUploadImage} className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-red-50 file:text-red-700 hover:file:bg-red-100" />
                {uploadedSigUrl && (
                  <div className="border p-2 rounded bg-gray-50 flex justify-center max-h-[80px] overflow-hidden">
                    <img src={uploadedSigUrl} className="h-full object-contain" alt="Uploaded signature" />
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3 text-xs">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>Placed signatures</span>
              <span className="text-red-500 font-black">{placedSignatures.length}</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-normal">After drawing or typing your signature, click the <strong>&quot;+ Apply Signature&quot;</strong> button appearing on any page layout in the workspace to place it.</p>
          </div>

          <button onClick={() => { setFile(null); setPageImages([]); setPlacedSignatures([]); }} className="w-full text-xs font-bold text-red-500 py-2.5 hover:bg-red-50 border border-transparent rounded-xl transition-all">Choose Another PDF</button>
        </div>
      }
    >
      <div ref={canvasWorkspaceRef} className="flex flex-col items-center p-4">
        {pageImages.length > 0 ? (
          pageImages.map((src, pageIdx) => {
            const size = pageSizes[pageIdx] || { width: 595, height: 842 }
            const ratio = size.height / size.width
            const displayWidth = 500
            const displayHeight = displayWidth * ratio

            return (
              <div 
                key={pageIdx} 
                className="relative bg-white border border-gray-300 shadow-xl mb-12 select-none group"
                style={{ width: displayWidth, height: displayHeight }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} className="w-full h-full pointer-events-none" alt={`Page ${pageIdx + 1}`} />
                
                <div className="absolute top-3 left-3 bg-black/60 text-white text-[9px] font-black tracking-widest px-2.5 py-1 rounded shadow-md z-10 uppercase">
                  Page {pageIdx + 1}
                </div>

                {/* Overlaid Apply Signature Trigger */}
                <button 
                  onClick={() => applySignatureToPage(pageIdx)}
                  className="absolute top-3 right-3 bg-red-600 hover:bg-red-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 hover:scale-105 active:scale-100 z-10"
                >
                  <PlusCircle className="w-3.5 h-3.5" /> Place Signature Here
                </button>
                
                {/* Placed Signatures on this specific page */}
                {placedSignatures.filter(s => s.pageIndex === pageIdx).map(sig => (
                  <div 
                    key={sig.id}
                    className="absolute border border-blue-400 bg-blue-100/10 cursor-move group/sig select-none touch-none hover:bg-blue-100/20 active:border-blue-600 active:bg-blue-100/30"
                    style={{ left: sig.x, top: sig.y, width: sig.width, height: sig.height }}
                    onMouseDown={(e) => handleMouseDown(e, 'drag', sig.id)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={sig.imgUrl} className="w-full h-full pointer-events-none object-contain" alt="embedded signature" />
                    
                    {/* Delete signature item */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); deletePlacedSignature(sig.id); }}
                      className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg transition-transform hover:scale-110 active:scale-100 opacity-0 group-hover/sig:opacity-100 z-20"
                      title="Remove signature"
                    >
                      <Trash className="w-3 h-3" />
                    </button>
                    
                    {/* Corner Drag Resize Handle */}
                    <div 
                      className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 cursor-se-resize rounded-tl border-l border-t border-white shadow active:bg-blue-700 z-20"
                      onMouseDown={(e) => handleMouseDown(e, 'resize', sig.id)}
                    />
                  </div>
                ))}
              </div>
            )
          })
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <svg className="animate-spin h-8 w-8 text-red-500 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-sm font-bold animate-pulse">Rendering Multi-page Preview Grid...</p>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
