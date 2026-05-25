'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { getPdfjsLib } from '@/lib/pdf-utils'
import { ChevronLeft, ChevronRight, Info, Search, RefreshCw, Layers } from 'lucide-react'

export default function ComparePDF() {
  const [file1, setFile1] = useState<File | null>(null)
  const [file2, setFile2] = useState<File | null>(null)
  const [page, setPage] = useState(1)
  const [numPages, setNumPages] = useState(1)
  const [isProcessing, setIsProcessing] = useState(false)
  const [similarity, setSimilarity] = useState<number | null>(null)
  const [diffPixels, setDiffPixels] = useState(0)
  
  const canvas1Ref = useRef<HTMLCanvasElement>(null)
  const canvas2Ref = useRef<HTMLCanvasElement>(null)
  const canvasDiffRef = useRef<HTMLCanvasElement>(null)

  const renderPages = useCallback(async () => {
    if (!file1 || !file2) return
    setIsProcessing(true)
    try {
      const pdfjsLib = await getPdfjsLib()
      const [data1, data2] = await Promise.all([file1.arrayBuffer(), file2.arrayBuffer()])
      const [pdf1, pdf2] = await Promise.all([
        pdfjsLib.getDocument({ data: data1 }).promise,
        pdfjsLib.getDocument({ data: data2 }).promise
      ])

      setNumPages(Math.min(pdf1.numPages, pdf2.numPages))

      const [p1, p2] = await Promise.all([pdf1.getPage(page), pdf2.getPage(page)])
      const viewport = p1.getViewport({ scale: 1.5 })
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const renderToCanvas = async (pdfPage: any, canvas: HTMLCanvasElement | null) => {
        if (!canvas) return
        canvas.width = viewport.width
        canvas.height = viewport.height
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) return
        await pdfPage.render({ canvasContext: ctx, viewport }).promise
      }

      await Promise.all([
        renderToCanvas(p1, canvas1Ref.current),
        renderToCanvas(p2, canvas2Ref.current)
      ])

      // Calculate Difference
      if (canvas1Ref.current && canvas2Ref.current && canvasDiffRef.current) {
        const ctx1 = canvas1Ref.current.getContext('2d')
        const ctx2 = canvas2Ref.current.getContext('2d')
        const ctxDiff = canvasDiffRef.current.getContext('2d')
        
        if (ctx1 && ctx2 && ctxDiff) {
          canvasDiffRef.current.width = viewport.width
          canvasDiffRef.current.height = viewport.height
          
          const img1 = ctx1.getImageData(0, 0, viewport.width, viewport.height)
          const img2 = ctx2.getImageData(0, 0, viewport.width, viewport.height)
          const diff = ctxDiff.createImageData(viewport.width, viewport.height)
          
          let diffCount = 0
          const threshold = 30
          
          for (let i = 0; i < img1.data.length; i += 4) {
            const rDiff = Math.abs(img1.data[i] - img2.data[i])
            const gDiff = Math.abs(img1.data[i+1] - img2.data[i+1])
            const bDiff = Math.abs(img1.data[i+2] - img2.data[i+2])
            
            if (rDiff > threshold || gDiff > threshold || bDiff > threshold) {
              diffCount++
              diff.data[i] = 255 // Red for diff
              diff.data[i+1] = 0
              diff.data[i+2] = 0
              diff.data[i+3] = 255
            } else {
              diff.data[i] = img1.data[i]
              diff.data[i+1] = img1.data[i+1]
              diff.data[i+2] = img1.data[i+2]
              diff.data[i+3] = 100 // Dim original
            }
          }
          
          ctxDiff.putImageData(diff, 0, 0)
          setDiffPixels(diffCount)
          const total = viewport.width * viewport.height
          setSimilarity(Number(((1 - diffCount / total) * 100).toFixed(2)))
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsProcessing(false)
    }
  }, [file1, file2, page])

  useEffect(() => {
    renderPages()
  }, [renderPages])

  if (!file1 || !file2) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">PDF Compare</h1>
        <p className="text-center text-gray-500 mb-12 max-w-lg mx-auto">Visual audit tool. Highlight text shifts, image swaps, and structural changes between two PDF versions.</p>
        <div className="flex flex-col md:flex-row gap-8 max-w-5xl mx-auto px-4">
          <div className="flex-1 space-y-4">
            <h3 className="text-center font-bold text-gray-400 uppercase tracking-widest text-xs">Original Document</h3>
            <Dropzone onFilesDrop={(files) => setFile1(files[0])} accept="application/pdf" multiple={false} theme="red" label={file1 ? file1.name : "Select File 1"} />
          </div>
          <div className="flex-1 space-y-4">
            <h3 className="text-center font-bold text-gray-400 uppercase tracking-widest text-xs">Modified Document</h3>
            <Dropzone onFilesDrop={(files) => setFile2(files[0])} accept="application/pdf" multiple={false} theme="red" label={file2 ? file2.name : "Select File 2"} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={renderPages} 
      processLabel={isProcessing ? "Analyzing..." : "Refresh Analysis"} 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
              <Search className="w-4 h-4 text-red-500" /> Comparison Result
            </h3>
            <div className="space-y-4">
              <div className="text-center py-4 bg-gray-50 rounded-xl border">
                 <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter mb-1">Similarity Index</p>
                 <p className={`text-3xl font-black ${similarity && similarity > 95 ? 'text-green-600' : 'text-orange-600'}`}>
                   {similarity !== null ? `${similarity}%` : '---'}
                 </p>
              </div>
              <div className="space-y-2">
                 <div className="flex justify-between text-[10px] font-bold">
                   <span className="text-gray-400 uppercase">Page</span>
                   <span className="text-gray-800">{page} of {numPages}</span>
                 </div>
                 <div className="flex justify-between text-[10px] font-bold">
                   <span className="text-gray-400 uppercase">Changed Pixels</span>
                   <span className="text-red-500">{diffPixels.toLocaleString()}</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
             <button 
               disabled={page <= 1}
               onClick={() => setPage(p => p - 1)}
               className="py-2.5 bg-white border rounded-lg flex justify-center hover:bg-gray-50 disabled:opacity-30 transition-all"
             >
               <ChevronLeft className="w-5 h-5" />
             </button>
             <button 
               disabled={page >= numPages}
               onClick={() => setPage(p => p + 1)}
               className="py-2.5 bg-white border rounded-lg flex justify-center hover:bg-gray-50 disabled:opacity-30 transition-all"
             >
               <ChevronRight className="w-5 h-5" />
             </button>
          </div>

          <div className="p-2 space-y-4">
            <div className="flex items-start gap-2 text-[10px] text-gray-400 leading-relaxed bg-gray-50 p-3 rounded-lg border border-dashed">
              <Info className="w-4 h-4 shrink-0" />
              <span>Differences are highlighted in <strong>RED</strong>. Identical areas are shown in faded original colors.</span>
            </div>
            <button onClick={() => { setFile1(null); setFile2(null); setSimilarity(null) }} className="w-full text-xs font-bold text-red-500 py-2 hover:bg-red-50 rounded-lg transition-all">Start Over</button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-6 p-4 h-full overflow-auto items-center">
         <div className="flex gap-4 max-w-full">
           <div className="bg-white p-2 rounded-xl shadow border border-gray-100 shrink-0">
             <p className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest">Original</p>
             <canvas ref={canvas1Ref} className="max-w-[300px] h-auto rounded border" />
           </div>
           <div className="bg-white p-2 rounded-xl shadow border border-gray-100 shrink-0">
             <p className="text-[9px] font-black text-gray-400 uppercase mb-2 tracking-widest">Modified</p>
             <canvas ref={canvas2Ref} className="max-w-[300px] h-auto rounded border" />
           </div>
         </div>

         <div className="bg-white p-6 rounded-2xl shadow-2xl border-2 border-red-50 relative group">
           <div className="absolute top-4 left-6 flex items-center gap-2 z-10">
              <div className="bg-red-600 text-white p-1.5 rounded-lg">
                <Layers className="w-4 h-4" />
              </div>
              <span className="text-[10px] font-black text-gray-800 uppercase tracking-widest bg-white/80 backdrop-blur px-2 py-1 rounded shadow-sm border">Visual Diff Matrix</span>
           </div>
           <div className="bg-gray-50 rounded-xl overflow-hidden border">
             <canvas ref={canvasDiffRef} className="max-w-full h-auto" />
           </div>
           {isProcessing && (
             <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl">
               <RefreshCw className="w-8 h-8 text-red-500 animate-spin mb-4" />
               <p className="text-sm font-bold text-gray-800">Calculating Differences...</p>
             </div>
           )}
         </div>
      </div>
    </WorkspaceLayout>
  )
}
