'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { 
  Undo, Redo, Paintbrush, RotateCw, 
  FlipHorizontal, FlipVertical, Sun, Contrast, Ghost, 
  Trash2, Maximize
} from 'lucide-react'

interface Point {
  x: number;
  y: number;
}

interface Path {
  points: Point[];
  color: string;
  width: number;
}

export default function PhotoEditor() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [bgImage, setBgImage] = useState<string>('')
  
  // Canvas State
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [paths, setPaths] = useState<Path[]>([])
  const [redoStack, setRedoStack] = useState<Path[]>([])
  const [currentPath, setCurrentPath] = useState<Point[]>([])
  
  // Brush Settings
  const [brushColor, setBrushColor] = useState('#ef4444')
  const [brushWidth, setBrushWidth] = useState(5)
  
  // Image Filters/Transform
  const [brightness, setBrightness] = useState(100)
  const [contrast, setContrast] = useState(100)
  const [grayscale, setGrayscale] = useState(0)
  const [rotation, setRotation] = useState(0)
  const [flipH, setFlipH] = useState(false)
  const [flipV, setFlipV] = useState(false)

  // Layout Refs
  const containerRef = useRef<HTMLDivElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setBgImage(url)
      return () => URL.revokeObjectURL(url)
    }
  }, [file])

  const updateCanvasSize = useCallback(() => {
    if (imgRef.current) {
      const { clientWidth, clientHeight } = imgRef.current
      setCanvasSize({ width: clientWidth, height: clientHeight })
    }
  }, [])

  useEffect(() => {
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [updateCanvasSize])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (ctx && canvasSize.width > 0) {
      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)
      ctx.lineJoin = 'round'
      ctx.lineCap = 'round'
      
      const drawPath = (path: Path) => {
        if (path.points.length < 2) return
        ctx.beginPath()
        ctx.strokeStyle = path.color
        ctx.lineWidth = path.width
        ctx.moveTo(path.points[0].x, path.points[0].y)
        for (let i = 1; i < path.points.length; i++) {
          ctx.lineTo(path.points[i].x, path.points[i].y)
        }
        ctx.stroke()
      }

      paths.forEach(drawPath)
      if (currentPath.length > 0) {
        drawPath({ points: currentPath, color: brushColor, width: brushWidth })
      }
    }
  }, [paths, currentPath, canvasSize, brushColor, brushWidth])

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent): Point | null => {
    if (!canvasRef.current) return null
    const rect = canvasRef.current.getBoundingClientRect()
    let clientX, clientY
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = (e as React.MouseEvent).clientX
      clientY = (e as React.MouseEvent).clientY
    }

    return {
      x: clientX - rect.left,
      y: clientY - rect.top
    }
  }

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDrawing(true)
    const coord = getCoordinates(e)
    if (coord) setCurrentPath([coord])
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return
    const coord = getCoordinates(e)
    if (coord) {
      setCurrentPath(prev => [...prev, coord])
    }
  }

  const stopDrawing = () => {
    if (!isDrawing) return
    setIsDrawing(false)
    if (currentPath.length > 1) {
      setPaths(prev => [...prev, { points: currentPath, color: brushColor, width: brushWidth }])
      setRedoStack([])
    }
    setCurrentPath([])
  }

  const undo = () => {
    if (paths.length === 0) return
    const newPaths = [...paths]
    const popped = newPaths.pop()
    if (popped) setRedoStack(prev => [...prev, popped])
    setPaths(newPaths)
  }

  const redo = () => {
    if (redoStack.length === 0) return
    const newRedo = [...redoStack]
    const popped = newRedo.pop()
    if (popped) setPaths(prev => [...prev, popped])
    setRedoStack(newRedo)
  }

  const handleProcess = () => {
    if (!file || !imgRef.current) return
    setIsProcessing(true)
    
    const finalCanvas = document.createElement('canvas')
    const img = new Image()
    img.src = bgImage
    img.onload = () => {
      finalCanvas.width = img.width
      finalCanvas.height = img.height
      const ctx = finalCanvas.getContext('2d')
      if (!ctx) return

      // Apply Transformations
      ctx.save()
      ctx.translate(img.width/2, img.height/2)
      ctx.rotate((rotation * Math.PI) / 180)
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1)
      
      // Apply Filters
      ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%)`
      
      ctx.drawImage(img, -img.width/2, -img.height/2)
      ctx.restore()

      // Draw Paths (Scaled)
      const scaleX = img.width / canvasSize.width
      const scaleY = img.height / canvasSize.height
      
      paths.forEach(path => {
        ctx.beginPath()
        ctx.strokeStyle = path.color
        ctx.lineWidth = path.width * scaleX
        ctx.lineJoin = 'round'
        ctx.lineCap = 'round'
        ctx.moveTo(path.points[0].x * scaleX, path.points[0].y * scaleY)
        path.points.forEach(p => ctx.lineTo(p.x * scaleX, p.y * scaleY))
        ctx.stroke()
      })

      finalCanvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `Docuvate-Edited-${file.name}`
          a.click()
        }
        setIsProcessing(false)
      }, 'image/png')
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">Photo Editor</h1>
        <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">Advanced studio canvas for drawing, filtering, and enhancing images entirely in your browser.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/*" multiple={false} theme="blue" label="Select Image" />
      </div>
    )
  }

  return (
    <WorkspaceLayout onProcess={handleProcess} processLabel="Download Export" colorTheme="blue" isProcessing={isProcessing} sidebarContent={
      <div className="space-y-6">
        {/* Brush Tools */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
            <Paintbrush className="w-4 h-4 text-blue-500" /> Brush Tools
          </h3>
          <div className="flex gap-2">
            {['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#000000', '#ffffff'].map(c => (
              <button 
                key={c} 
                onClick={() => setBrushColor(c)}
                className={`w-6 h-6 rounded-full border-2 ${brushColor === c ? 'border-blue-500 scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <input 
            type="range" min="1" max="50" value={brushWidth} 
            onChange={e => setBrushWidth(parseInt(e.target.value))}
            className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          <div className="flex gap-2">
            <button onClick={undo} className="flex-1 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 flex justify-center border transition-all"><Undo className="w-4 h-4" /></button>
            <button onClick={redo} className="flex-1 py-2 bg-gray-50 rounded-lg hover:bg-gray-100 flex justify-center border transition-all"><Redo className="w-4 h-4" /></button>
            <button onClick={() => setPaths([])} className="flex-1 py-2 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 flex justify-center border border-red-100 transition-all"><Trash2 className="w-4 h-4" /></button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
            <Maximize className="w-4 h-4 text-blue-500" /> Image Filters
          </h3>
          <div className="space-y-3">
             <div className="flex items-center gap-3">
               <Sun className="w-4 h-4 text-gray-400" />
               <input type="range" min="0" max="200" value={brightness} onChange={e => setBrightness(parseInt(e.target.value))} className="flex-grow h-1 bg-gray-100 rounded-lg appearance-none accent-blue-600" />
             </div>
             <div className="flex items-center gap-3">
               <Contrast className="w-4 h-4 text-gray-400" />
               <input type="range" min="0" max="200" value={contrast} onChange={e => setContrast(parseInt(e.target.value))} className="flex-grow h-1 bg-gray-100 rounded-lg appearance-none accent-blue-600" />
             </div>
             <div className="flex items-center gap-3">
               <Ghost className="w-4 h-4 text-gray-400" />
               <input type="range" min="0" max="100" value={grayscale} onChange={e => setGrayscale(parseInt(e.target.value))} className="flex-grow h-1 bg-gray-100 rounded-lg appearance-none accent-blue-600" />
             </div>
          </div>
        </div>

        {/* Transform */}
        <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2 mb-4">
            <RotateCw className="w-4 h-4 text-blue-500" /> Transform
          </h3>
          <div className="grid grid-cols-4 gap-2">
            <button onClick={() => setRotation(r => (r - 90) % 360)} className="p-2 border rounded-lg hover:bg-gray-50 flex justify-center"><RotateCw className="w-4 h-4 -scale-x-100" /></button>
            <button onClick={() => setRotation(r => (r + 90) % 360)} className="p-2 border rounded-lg hover:bg-gray-50 flex justify-center"><RotateCw className="w-4 h-4" /></button>
            <button onClick={() => setFlipH(!flipH)} className="p-2 border rounded-lg hover:bg-gray-50 flex justify-center"><FlipHorizontal className="w-4 h-4" /></button>
            <button onClick={() => setFlipV(!flipV)} className="p-2 border rounded-lg hover:bg-gray-50 flex justify-center"><FlipVertical className="w-4 h-4" /></button>
          </div>
        </div>

        <button onClick={() => setFile(null)} className="w-full text-xs font-bold text-red-500 py-2 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all">Cancel & Clear</button>
      </div>
    }>
      <div className="relative group max-w-4xl mx-auto bg-gray-100 rounded-2xl p-4 shadow-inner border border-gray-200 overflow-hidden min-h-[60vh] flex items-center justify-center">
        <div 
          ref={containerRef}
          className="relative shadow-2xl bg-white leading-[0] transition-transform duration-300"
          style={{ 
            transform: `rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            ref={imgRef}
            src={bgImage} 
            alt="editor" 
            onLoad={updateCanvasSize}
            className="max-h-[70vh] w-auto select-none pointer-events-none" 
            style={{ 
              filter: `brightness(${brightness}%) contrast(${contrast}%) grayscale(${grayscale}%)` 
            }}
          />
          <canvas 
            ref={canvasRef}
            width={canvasSize.width}
            height={canvasSize.height}
            className="absolute inset-0 cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-full text-[10px] text-white font-bold tracking-widest uppercase opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-3">
          <span>{canvasSize.width} x {canvasSize.height}</span>
          <div className="w-1 h-1 bg-white/30 rounded-full"></div>
          <span>Canvas Ready</span>
        </div>
      </div>
    </WorkspaceLayout>
  )
}
