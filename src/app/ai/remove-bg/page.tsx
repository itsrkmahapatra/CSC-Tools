'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { removeBackground } from '@imgly/background-removal'
import { Wand2, Image as ImageIcon, Download } from 'lucide-react'

export default function RemoveBackground() {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const [bgColor, setBgColor] = useState<string>('transparent')
  const [bgImage, setBgImage] = useState<string | null>(null)

  const handleFilesDrop = (droppedFiles: File[]) => {
    const f = droppedFiles[0]
    setFile(f)
    setPreview(URL.createObjectURL(f))
    setResult(null)
  }

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    try {
      const blob = await removeBackground(file, {
        progress: (status, progress) => {
          console.log(status, progress)
        }
      })
      const url = URL.createObjectURL(blob)
      setResult(url)
    } catch (e) {
      console.error(e)
      alert("Background removal failed. This tool requires a modern browser with WebAssembly support.")
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!result) return
    
    // If transparent and no BG image, just download the result
    if (bgColor === 'transparent' && !bgImage) {
      const a = document.createElement('a')
      a.href = result
      a.download = `no-bg-${file?.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      return
    }

    // Composite on canvas
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    img.src = result
    img.onload = () => {
      canvas.width = img.width
      canvas.height = img.height
      
      if (bgImage) {
        const bgImg = new Image()
        bgImg.src = bgImage
        bgImg.onload = () => {
          ctx?.drawImage(bgImg, 0, 0, canvas.width, canvas.height)
          ctx?.drawImage(img, 0, 0)
          downloadCanvas(canvas)
        }
      } else {
        ctx!.fillStyle = bgColor
        ctx?.fillRect(0, 0, canvas.width, canvas.height)
        ctx?.drawImage(img, 0, 0)
        downloadCanvas(canvas)
      }
    }
  }

  const downloadCanvas = (canvas: HTMLCanvasElement) => {
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `custom-bg-${file?.name}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleBgImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) {
      setBgImage(URL.createObjectURL(f))
      setBgColor('custom')
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">AI Background Remover</h1>
        <p className="text-center text-gray-500 mb-8">Remove backgrounds instantly and replace them with solid colors or custom images—100% locally.</p>
        <Dropzone onFilesDrop={handleFilesDrop} accept="image/*" multiple={false} theme="indigo" label="Select Image to Remove BG" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={result ? handleDownload : handleProcess} 
      processLabel={result ? "Download Final Image" : (isProcessing ? "Removing BG..." : "Remove Background")} 
      colorTheme="indigo"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          {result && (
            <>
              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase">Background Color</h3>
                <div className="grid grid-cols-5 gap-2">
                  {['transparent', '#ffffff', '#000000', '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'].map(c => (
                    <button 
                      key={c} 
                      onClick={() => { setBgColor(c); setBgImage(null); }}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${bgColor === c ? 'border-indigo-600 scale-110 shadow-md' : 'border-gray-200 hover:scale-105'}`}
                      style={{ backgroundColor: c === 'transparent' ? undefined : c, backgroundImage: c === 'transparent' ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACpJREFUGFdjZEADJgY0QC6AkgAJAAnIAtkgCSQBWSALJIEkIAtkAwM2BQCz8A8LJ0Y4GAAAAABJRU5ErkJggg==")' : undefined }}
                      title={c}
                    />
                  ))}
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-3 text-sm uppercase">Custom Background</h3>
                <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <ImageIcon className="w-6 h-6 text-gray-400 mb-2" />
                    <p className="text-[10px] text-gray-500 uppercase font-bold text-center px-2">Upload BG Image</p>
                  </div>
                  <input type="file" className="hidden" accept="image/*" onChange={handleBgImageUpload} />
                </label>
              </div>
            </>
          )}
          
          {isProcessing && (
            <div className="bg-indigo-50 p-4 rounded border border-indigo-200">
              <p className="text-xs font-bold text-indigo-800 mb-2 animate-pulse text-center">Processing AI Model...</p>
              <p className="text-[10px] text-gray-500 text-center">This may take 10-20 seconds depending on your device.</p>
            </div>
          )}

          <button onClick={() => { setFile(null); setResult(null); setPreview(null); setBgImage(null); setBgColor('transparent') }} disabled={isProcessing} className="text-sm text-red-500 hover:underline">Clear & Reset</button>
        </div>
      }
    >
      <div className="w-full flex flex-col items-center">
        <div 
          className="relative bg-white p-4 shadow-xl border-8 border-white rounded-lg overflow-hidden max-w-2xl w-full"
          style={{ 
            backgroundColor: bgColor === 'transparent' ? '#f3f4f6' : (bgColor === 'custom' ? 'transparent' : bgColor),
            backgroundImage: bgColor === 'transparent' ? 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACpJREFUGFdjZEADJgY0QC6AkgAJAAnIAtkgCSQBWSALJIEkIAtkAwM2BQCz8A8LJ0Y4GAAAAABJRU5ErkJggg==")' : (bgImage ? `url(${bgImage})` : undefined),
            backgroundSize: bgColor === 'transparent' ? 'auto' : 'cover',
            backgroundPosition: 'center'
          }}
        >
          {result ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={result} alt="Result" className="block max-w-full h-auto mx-auto animate-in fade-in zoom-in duration-700" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={preview!} alt="Original" className="block max-w-full h-auto mx-auto opacity-50 grayscale" />
          )}
          
          {!result && !isProcessing && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-indigo-600 text-white px-6 py-3 rounded-full font-bold shadow-xl flex items-center gap-2 cursor-pointer hover:scale-105 transition-transform" onClick={handleProcess}>
                <Wand2 className="w-5 h-5" />
                Magic BG Removal
              </div>
            </div>
          )}
        </div>
        
        {result && (
          <div className="mt-8 flex gap-4">
             <button onClick={handleDownload} className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all">
               <Download className="w-5 h-5" />
               Download Result
             </button>
          </div>
        )}
      </div>
    </WorkspaceLayout>
  )
}
