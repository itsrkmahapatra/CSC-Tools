'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import imageCompression from 'browser-image-compression'
import { HardDrive, ArrowRight, CheckCircle2, Download, Trash2, Info } from 'lucide-react'

interface CompressedFile {
  original: File;
  compressed?: File;
  status: 'pending' | 'processing' | 'done' | 'error';
}

export default function CompressImage() {
  const [files, setFiles] = useState<CompressedFile[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [maxSizeMB, setMaxSizeMB] = useState(0.5)

  const handleFilesDrop = (newFiles: File[]) => {
    setFiles(prev => [...prev, ...newFiles.map(f => ({ original: f, status: 'pending' as const }))])
  }

  const handleProcess = async () => {
    setIsProcessing(true)
    const updatedFiles = [...files]
    
    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status === 'done') continue
      
      updatedFiles[i].status = 'processing'
      setFiles([...updatedFiles])
      
      try {
        const options = {
          maxSizeMB: maxSizeMB,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        }
        const compressed = await imageCompression(updatedFiles[i].original, options)
        updatedFiles[i].compressed = compressed
        updatedFiles[i].status = 'done'
      } catch (error) {
        console.error(error)
        updatedFiles[i].status = 'error'
      }
      setFiles([...updatedFiles])
    }
    setIsProcessing(false)
  }

  const downloadFile = (file: CompressedFile) => {
    if (!file.compressed) return
    const url = URL.createObjectURL(file.compressed)
    const a = document.createElement('a')
    a.href = url
    a.download = `Docuvate-Compressed-${file.original.name}`
    a.click()
    URL.revokeObjectURL(url)
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB'][i]
  }

  if (files.length === 0) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">Compress Image</h1>
        <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">Shrink image file sizes by up to 90% without losing visible quality. Supports JPG, PNG, and WebP.</p>
        <Dropzone onFilesDrop={handleFilesDrop} accept="image/*" theme="blue" label="Select Images" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel={isProcessing ? "Compressing..." : "Compress All"} 
      colorTheme="blue"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-blue-500" /> Compression Level
            </h3>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Target Max Size</label>
              <input 
                type="range" min="0.1" max="5" step="0.1" value={maxSizeMB} 
                onChange={(e) => setMaxSizeMB(parseFloat(e.target.value))}
                className="w-full h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
              <div className="flex justify-between mt-2">
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">ULTRA ({maxSizeMB}MB)</span>
                <span className="text-[10px] font-bold text-gray-400">5MB</span>
              </div>
            </div>
          </div>

          <div className="p-2 space-y-4">
            <div className="flex items-start gap-2 text-[10px] text-gray-400 leading-relaxed bg-gray-50 p-3 rounded-lg border border-dashed">
              <Info className="w-4 h-4 shrink-0 text-blue-400" />
              <span>Higher compression (lower MB) might result in slight pixelation. For professional prints, stay above 1MB.</span>
            </div>
            <button onClick={() => setFiles([])} className="w-full text-xs font-bold text-red-500 py-2 hover:bg-red-50 rounded-lg transition-all flex items-center justify-center gap-2">
              <Trash2 className="w-3.5 h-3.5" /> Clear All
            </button>
          </div>
        </div>
      }
    >
      <div className="max-w-4xl mx-auto w-full space-y-3 p-4">
        {files.map((file, idx) => (
          <div key={idx} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-6 group hover:border-blue-200 transition-all">
            <div className="w-16 h-16 bg-gray-50 rounded-xl overflow-hidden border border-gray-100 flex items-center justify-center shrink-0">
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src={URL.createObjectURL(file.original)} alt="preview" className="max-w-full max-h-full object-cover" />
            </div>
            
            <div className="flex-grow min-w-0">
              <p className="text-sm font-bold text-gray-800 truncate mb-1">{file.original.name}</p>
              <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-tighter">
                <span className="text-gray-400">{formatSize(file.original.size)}</span>
                {file.status === 'done' && file.compressed && (
                  <>
                    <ArrowRight className="w-3 h-3 text-blue-400" />
                    <span className="text-blue-600">{formatSize(file.compressed.size)}</span>
                    <span className="text-green-500 bg-green-50 px-1.5 py-0.5 rounded">-{Math.round((1 - file.compressed.size / file.original.size) * 100)}%</span>
                  </>
                )}
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-3">
              {file.status === 'pending' && <span className="text-[10px] font-bold text-gray-300 uppercase italic">Waiting</span>}
              {file.status === 'processing' && (
                <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              {file.status === 'done' && (
                <>
                  <CheckCircle2 className="w-6 h-6 text-green-500" />
                  <button 
                    onClick={() => downloadFile(file)}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </>
              )}
              <button 
                onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                className="p-2 text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </WorkspaceLayout>
  )
}
