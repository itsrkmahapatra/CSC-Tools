'use client'
import { useState, useRef, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { Eraser, Info, Trash2, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react'

interface BlurZone {
  id: string;
  x: number; // in pixels relative to display width (500px)
  y: number;
  width: number;
  height: number;
  type: 'blur' | 'pixel';
  amount: number;
}

export default function BlurFace() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imgSize, setImgSize] = useState<{ width: number; height: number } | null>(null)
  
  // Workspace configurations
  const [zones, setZones] = useState<BlurZone[]>([]);
  const [activeTool, setActiveTool] = useState<'blur' | 'pixel'>('blur');
  const [blurAmount, setBlurAmount] = useState(15);
  
  // Drawing states
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [tempBox, setTempBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const originalImageRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      const img = new Image()
      img.src = url
      img.onload = () => {
        originalImageRef.current = img
        setImgSize({ width: img.width, height: img.height })
        setZones([])
      }
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  // Redraw canvas with layers in real-time
  const drawLayers = () => {
    const canvas = canvasRef.current
    const img = originalImageRef.current
    if (!canvas || !img || !imgSize) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Match canvas width/height to original high-res image
    canvas.width = imgSize.width
    canvas.height = imgSize.height
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    
    // Draw clean base image
    ctx.drawImage(img, 0, 0)

    // Calculate scale factors
    const displayWidth = 500
    const ratio = imgSize.height / imgSize.width
    const displayHeight = displayWidth * ratio
    
    const scaleX = imgSize.width / displayWidth
    const scaleY = imgSize.height / displayHeight

    // Apply placed blur/pixelation zones
    zones.forEach(zone => {
      const zX = zone.x * scaleX
      const zY = zone.y * scaleY
      const zW = zone.width * scaleX
      const zH = zone.height * scaleY
      
      if (zW <= 0 || zH <= 0) return

      if (zone.type === 'blur') {
        // Gaussian Blur
        ctx.save()
        ctx.beginPath()
        ctx.rect(zX, zY, zW, zH)
        ctx.clip()
        ctx.filter = `blur(${zone.amount}px)`
        ctx.drawImage(img, 0, 0)
        ctx.restore()
      } else {
        // Pixelate
        ctx.save()
        ctx.imageSmoothingEnabled = false
        const blockSize = Math.max(2, zone.amount)
        const smallW = Math.max(1, Math.round(zW / blockSize))
        const smallH = Math.max(1, Math.round(zH / blockSize))
        
        // Draw low-res section onto offscreen canvas
        const temp = document.createElement('canvas')
        temp.width = smallW
        temp.height = smallH
        const tCtx = temp.getContext('2d')
        if (tCtx) {
          tCtx.imageSmoothingEnabled = false
          tCtx.drawImage(img, zX, zY, zW, zH, 0, 0, smallW, smallH)
          
          // Draw back onto canvas stretched
          ctx.drawImage(temp, 0, 0, smallW, smallH, zX, zY, zW, zH)
        }
        ctx.restore()
      }
    })
  }

  // Redraw whenever zones or sizes change
  useEffect(() => {
    if (originalImageRef.current) {
      drawLayers()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [zones, imgSize])

  const handleMouseDown = (e: React.MouseEvent) => {
    // Prevent starting draw if clicking on delete controls
    if ((e.target as HTMLElement).closest('.delete-zone')) return

    e.preventDefault()
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setDragStart({ x, y })
    setTempBox({ x, y, width: 0, height: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
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

  const handleMouseUp = () => {
    if (dragStart && tempBox && tempBox.width > 4 && tempBox.height > 4) {
      const newZone: BlurZone = {
        id: `zone-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: tempBox.x,
        y: tempBox.y,
        width: tempBox.width,
        height: tempBox.height,
        type: activeTool,
        amount: blurAmount
      }
      setZones(prev => [...prev, newZone])
    }
    setDragStart(null)
    setTempBox(null)
  }

  const deleteZone = (id: string) => {
    setZones(prev => prev.filter(z => z.id !== id))
  }

  const handleProcess = () => {
    const canvas = canvasRef.current
    if (!canvas || !file) return
    setIsProcessing(true)
    
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `Sanitized-${file.name}`
        a.click()
        URL.revokeObjectURL(url)
      }
      setIsProcessing(false)
    }, file.type)
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">Blur & Pixelate Photo</h1>
        <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">Click and drag to draw target regions over license plates, sensitive details, or faces to blur/pixelate locally.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/*" multiple={false} theme="blue" label="Select Image to Blur" />
      </div>
    )
  }

  // Calculate scaling for HTML drawing overlays
  const displayWidth = 500
  const displayHeight = imgSize ? displayWidth * (imgSize.height / imgSize.width) : 350

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel={isProcessing ? "Processing..." : `Download Sanitized Image (${zones.length})`} colorTheme="blue" isProcessing={isProcessing} sidebarContent={
      <div className="space-y-6">
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
            <Eraser className="w-4.5 h-4.5 text-blue-500" /> Mask Type
          </h3>
          
          <div className="grid grid-cols-2 gap-2">
            <button 
              onClick={() => setActiveTool('blur')}
              className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${activeTool === 'blur' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-gray-500'}`}
            >
              <Sparkles className="w-4 h-4 text-blue-500" /> Gaussian Blur
            </button>
            <button 
              onClick={() => setActiveTool('pixel')}
              className={`py-2 px-3 rounded-lg border text-xs font-bold flex flex-col items-center gap-1.5 transition-all ${activeTool === 'pixel' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white text-gray-500'}`}
            >
              <Eraser className="w-4 h-4 text-teal-500" /> Pixelate
            </button>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-gray-700">Filter Strength</span>
            <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">{blurAmount}px</span>
          </div>
          <input 
            type="range" min="5" max="40" step="1" value={blurAmount} 
            onChange={(e) => setBlurAmount(parseInt(e.target.value))} 
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600" 
          />
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2 text-xs">
          <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
            <span>Active Masks</span>
            <span className="text-blue-600 font-black">{zones.length}</span>
          </div>
          <p className="text-[10px] text-gray-400 leading-normal">Drawing masks applies clipping bounds on HTML canvas layers dynamically in your browser.</p>
        </div>

        <button onClick={() => { setFile(null); setZones([]); setImgSize(null); }} className="w-full text-xs font-bold text-red-500 py-2.5 hover:bg-red-50 border border-transparent rounded-xl transition-all flex items-center justify-center gap-2">
          <RefreshCw className="w-3.5 h-3.5" /> Start New Sanitization
        </button>
      </div>
    }>
      <div className="flex flex-col items-center p-4">
        <div className="flex items-center gap-2 mb-4 bg-blue-50 border border-blue-100 text-blue-700 px-4 py-2 rounded-xl text-xs max-w-md text-center">
          <Info className="w-4 h-4 shrink-0" />
          <span>Click and drag over the image layout to blur specific spots.</span>
        </div>

        {imgSize ? (
          <div 
            className="relative bg-white border border-gray-300 shadow-2xl rounded-2xl overflow-hidden cursor-crosshair select-none group"
            style={{ width: displayWidth, height: displayHeight }}
            onMouseDown={handleMouseDown}
            onMouseMove={dragStart ? handleMouseMove : undefined}
            onMouseUp={dragStart ? handleMouseUp : undefined}
          >
            {/* Display clean canvas background */}
            <canvas ref={canvasRef} className="absolute inset-0 w-full h-full object-contain pointer-events-none" />

            {/* Transparent click receiver box overlay */}
            <div className="absolute inset-0 z-0 bg-transparent" />

            {/* Drawing box overlay */}
            {dragStart && tempBox && (
              <div 
                className={`absolute border border-dashed z-20 bg-blue-100/20 border-blue-500`}
                style={{ left: tempBox.x, top: tempBox.y, width: tempBox.width, height: tempBox.height }}
              />
            )}

            {/* Display delete labels overlay on hover */}
            {zones.map((zone) => (
              <div 
                key={zone.id}
                className="absolute border border-red-400/50 hover:bg-red-500/10 transition-colors group/item z-10"
                style={{ left: zone.x, top: zone.y, width: zone.width, height: zone.height }}
              >
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteZone(zone.id); }}
                  className="absolute -top-3 -right-3 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 shadow-lg scale-90 group-hover/item:scale-100 opacity-0 group-hover/item:opacity-100 transition-transform delete-zone"
                  title="Remove mask"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <svg className="animate-spin h-8 w-8 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            <p className="text-sm font-bold animate-pulse">Initializing Image Canvas...</p>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
