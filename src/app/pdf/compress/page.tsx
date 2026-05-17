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

  useEffect(() => {
    if (file) {
      // Suggest 50% compression as default target
      setTargetKB(Math.round((file.size / 1024) * 0.5))
    }
  }, [file])

  useEffect(() => {
    // Note: Due to basePath, the worker is loaded from /CSC-Tools/
    workerRef.current = new Worker('/CSC-Tools/compressor.worker.js')
    
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
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Target Size (KB)</h3>
            <div className="flex space-x-2 items-center">
              <input 
                type="number" 
                min="10" 
                value={targetKB} 
                onChange={(e) => setTargetKB(parseInt(e.target.value) || 0)} 
                className="w-full border rounded p-2 text-center" 
                disabled={isProcessing}
              />
              <span className="text-gray-500 text-sm font-bold">KB</span>
            </div>
            <p className="text-xs text-gray-500 mt-2">Original Size: {(file.size / 1024).toFixed(0)} KB. Enter your desired file size footprint.</p>
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
