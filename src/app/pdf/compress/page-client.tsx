'use client'
import { useState, useEffect, useRef } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'

export default function CompressPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [targetKB, setTargetKB] = useState<number>(500)
  const [progressMsg, setProgressMsg] = useState('')
  const [progressPct, setProgressPct] = useState(0)
  const workerRef = useRef<Worker | null>(null)
  const [preset, setPreset] = useState<'extreme' | 'recommended' | 'low' | 'custom'>('recommended')

  useEffect(() => {
    if (file) {
      const originalKB = file.size / 1024
      if (preset === 'extreme') setTargetKB(Math.round(originalKB * 0.3))
      if (preset === 'recommended') setTargetKB(Math.round(originalKB * 0.55))
      if (preset === 'low') setTargetKB(Math.round(originalKB * 0.8))
    }
  }, [file, preset])

  useEffect(() => {
    // Note: Due to basePath, the worker is loaded from /Docuvate/
    workerRef.current = new Worker('/Docuvate/compressor.worker.js')
    
    workerRef.current.onmessage = (e) => {
      const { type, message, percent, buffer, error } = e.data
      
      if (type === 'PROGRESS') {
        setProgressMsg(message)
        setProgressPct(percent)
      } else if (type === 'COMPLETE') {
        const blob = new Blob([buffer], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `compressed-${file?.name}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        setIsProcessing(false)
        setProgressMsg('Done!')
        setProgressPct(100)
      } else if (type === 'ERROR') {
        console.error(error)
        alert(`Compression Error: ${error}`)
        setIsProcessing(false)
        setProgressMsg('')
      }
    }

    return () => {
      workerRef.current?.terminate()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  const handleProcess = async () => {
    if (!file || !workerRef.current) return
    setIsProcessing(true)
    setProgressMsg('Initializing Web Worker...')
    setProgressPct(0)
    
    try {
      const arrayBuffer = await file.arrayBuffer()
      // Dispatch payload to isolated Web Worker thread
      workerRef.current.postMessage({
        fileBuffer: arrayBuffer,
        targetKB: targetKB
      }, [arrayBuffer])
    } catch (e) {
      console.error(e)
      alert("Failed to read file.")
      setIsProcessing(false)
    }
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Compress PDF</h1>
        <p className="text-center text-gray-500 mb-8">Reduce file size dynamically by targeting a specific KB threshold utilizing an Adaptive Web Worker Loop.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel={isProcessing ? "Processing..." : "Start Adaptive Compression"} 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest">Compression Preset</h3>
            <div className="grid grid-cols-2 gap-2">
              <button 
                onClick={() => setPreset('extreme')}
                className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all ${preset === 'extreme' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                Extreme (30%)
              </button>
              <button 
                onClick={() => setPreset('recommended')}
                className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all ${preset === 'recommended' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                Recommended (55%)
              </button>
              <button 
                onClick={() => setPreset('low')}
                className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all ${preset === 'low' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                Low (80%)
              </button>
              <button 
                onClick={() => setPreset('custom')}
                className={`py-2 px-1 text-[10px] font-bold rounded-lg border text-center transition-all ${preset === 'custom' ? 'bg-red-50 border-red-500 text-red-700' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
              >
                Custom KB
              </button>
            </div>

            {preset === 'custom' && (
              <div className="space-y-2 pt-2 border-t border-dashed">
                <label className="text-[9px] font-black text-gray-400 uppercase">Target Size (KB)</label>
                <div className="flex space-x-2 items-center">
                  <input 
                    type="number" 
                    min="10" 
                    value={targetKB} 
                    onChange={(e) => setTargetKB(parseInt(e.target.value) || 0)} 
                    className="w-full border rounded p-2 text-center text-sm font-bold bg-gray-50" 
                    disabled={isProcessing}
                  />
                  <span className="text-gray-500 text-sm font-bold">KB</span>
                </div>
              </div>
            )}
            <p className="text-[10px] text-gray-400 mt-2">Original Size: {(file.size / 1024).toFixed(0)} KB. Selected Target: {targetKB} KB.</p>
          </div>
          
          {isProcessing && (
            <div className="bg-red-50 p-4 rounded border border-red-200">
              <p className="text-xs font-bold text-red-800 mb-2 animate-pulse">{progressMsg}</p>
              <div className="w-full bg-red-200 rounded-full h-2.5">
                <div className="bg-red-600 h-2.5 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
              </div>
            </div>
          )}

          <button onClick={() => setFile(null)} disabled={isProcessing} className="text-sm text-red-500 hover:underline disabled:opacity-50">Cancel</button>
        </div>
      }
    >
      <div className="bg-white p-8 rounded-lg shadow-xl border border-gray-200 flex flex-col items-center justify-center relative w-full max-w-sm">
        <div className="text-red-500 mb-4 text-6xl text-center">🗜️</div>
        <p className="text-lg text-center text-gray-800 font-bold truncate w-full mt-4">{file.name}</p>
        <p className="text-sm text-gray-500 mt-2 text-center w-full">Original Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
      </div>
    </WorkspaceLayout>
  )
}

