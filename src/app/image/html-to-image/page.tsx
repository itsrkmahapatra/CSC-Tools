'use client'
import { useState, useRef } from 'react'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import html2canvas from 'html2canvas'

export default function HtmlToImage() {
  const [inputType, setInputType] = useState<'code' | 'url'>('code')
  const [htmlCode, setHtmlCode] = useState('<h1>Hello World</h1><p>Write your custom HTML here to generate an Image.</p>')
  const [url, setUrl] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const renderRef = useRef<HTMLDivElement>(null)

  const handleFetchUrl = async () => {
    if (!url) return
    setIsProcessing(true)
    try {
      const response = await fetch(url)
      const text = await response.text()
      setHtmlCode(text)
      setInputType('code')
    } catch (e) {
      console.error(e)
      alert('Error fetching URL. The site might be blocking cross-origin requests (CORS). Paste HTML manually instead.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleProcess = async () => {
    if (!renderRef.current) return
    setIsProcessing(true)
    try {
      const canvas = await html2canvas(renderRef.current, { scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const a = document.createElement('a')
      a.href = imgData
      a.download = 'rendered-html.png'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert('Error rendering HTML to Image.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col h-full min-h-[calc(100vh-120px)]">
      <div className="py-12 bg-white border-b">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">HTML to Image</h1>
        <p className="text-center text-gray-500">Render custom HTML code blocks or URLs directly to a PNG image snapshot.</p>
      </div>
      
      <WorkspaceLayout onProcess={handleProcess} processLabel="Download Image" colorTheme="blue" isProcessing={isProcessing} sidebarContent={
        <div className="space-y-6">
          <div>
             <h3 className="font-semibold text-gray-700 mb-3">Input Method</h3>
             <div className="flex flex-col gap-2">
               <button onClick={() => setInputType('code')} className={`py-2 px-4 rounded border text-sm ${inputType === 'code' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}>Raw HTML Code</button>
               <button onClick={() => setInputType('url')} className={`py-2 px-4 rounded border text-sm ${inputType === 'url' ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white'}`}>Fetch URL</button>
             </div>
          </div>
          {inputType === 'code' ? (
            <p className="text-xs text-gray-500">Type raw HTML code into the editor. Our client-side engine will render it and snapshot it into a PNG.</p>
          ) : (
            <div className="space-y-2">
              <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://example.com" className="w-full border rounded p-2 text-sm" />
              <button onClick={handleFetchUrl} disabled={isProcessing} className="w-full bg-blue-500 text-white font-bold py-2 rounded shadow hover:bg-blue-600 disabled:opacity-50">Fetch HTML</button>
              <p className="text-xs text-gray-500 mt-2"><strong>Note:</strong> Due to strict browser security (CORS), many external websites cannot be fetched directly. If it fails, please paste the HTML source code manually.</p>
            </div>
          )}
          <button onClick={() => {setHtmlCode(''); setUrl('')}} className="text-sm text-red-500 hover:underline mt-4 block">Clear Inputs</button>
        </div>
      }>
        <div className="w-full flex gap-4 h-[60vh] max-w-6xl mx-auto">
          <div className="flex-1 flex flex-col">
            <h3 className="font-bold text-gray-700 mb-2">HTML Editor</h3>
            <textarea 
              value={htmlCode} 
              onChange={e => setHtmlCode(e.target.value)} 
              className="flex-grow w-full border p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-lg shadow-inner outline-none resize-none"
              disabled={inputType === 'url'}
            />
          </div>
          <div className="flex-1 flex flex-col">
            <h3 className="font-bold text-gray-700 mb-2">Live Render</h3>
            <div className="flex-grow bg-white border rounded-lg p-8 overflow-auto shadow-inner relative">
              <div ref={renderRef} dangerouslySetInnerHTML={{ __html: htmlCode }} className="absolute inset-0 p-8" />
            </div>
          </div>
        </div>
      </WorkspaceLayout>
    </div>
  )
}
