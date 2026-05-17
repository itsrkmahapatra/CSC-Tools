'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import Tesseract from 'tesseract.js'

export default function OCRPDF() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [text, setText] = useState<string>('')
  const [progress, setProgress] = useState(0)

  const handleProcess = async () => {
    if (!file) return
    setIsProcessing(true)
    setText('')
    try {
      const url = URL.createObjectURL(file)
      const result = await Tesseract.recognize(url, 'eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(Math.round(m.progress * 100))
          }
        }
      })
      setText(result.data.text)
    } catch (e) {
      console.error(e)
      alert("Error processing OCR.")
    } finally {
      setIsProcessing(false)
    }
  }

  const downloadText = () => {
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `extracted-${file?.name}.txt`
    a.click()
  }

  if (!file) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">OCR Image to Text</h1>
        <p className="text-center text-gray-500 mb-8">Leverage compiled browser WASM engines to read flat scanned images and stitch selectable text arrays.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="image/*" multiple={false} theme="red" label="Select Scanned Image" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel={isProcessing ? `Scanning... ${progress}%` : "Run OCR Scan"} 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Tesseract.js Engine</h3>
            <p className="text-xs text-gray-500">The browser will download the language models and analyze the image entirely locally.</p>
          </div>
          <button onClick={() => { setFile(null); setText('') }} className="text-sm text-red-500 hover:underline">Cancel</button>
        </div>
      }
    >
      <div className="w-full flex gap-4 h-full">
        <div className="flex-1 bg-white p-2 border shadow overflow-hidden flex items-center justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={URL.createObjectURL(file)} alt="preview" className="max-w-full max-h-full object-contain" />
        </div>
        <div className="flex-1 bg-white p-4 border shadow flex flex-col relative">
          <h3 className="font-bold text-gray-700 mb-2">Extracted Text</h3>
          <textarea readOnly value={text} className="w-full flex-grow border p-2 text-sm text-gray-800 bg-gray-50 resize-none outline-none" placeholder="Text will appear here..." />
          {text && (
            <button onClick={downloadText} className="mt-4 bg-orange-500 text-white py-2 rounded shadow hover:bg-orange-600 font-bold">Download .TXT</button>
          )}
        </div>
      </div>
    </WorkspaceLayout>
  )
}
