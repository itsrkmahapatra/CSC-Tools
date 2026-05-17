'use client'
import { useState, useRef } from 'react'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

export default function HtmlToPdf() {
  const [htmlCode, setHtmlCode] = useState('<h1>Hello World</h1><p>Write your custom HTML here to generate a PDF.</p>')
  const [isProcessing, setIsProcessing] = useState(false)
  const renderRef = useRef<HTMLDivElement>(null)

  const handleProcess = async () => {
    if (!renderRef.current) return
    setIsProcessing(true)
    try {
      const canvas = await html2canvas(renderRef.current, { scale: 2 })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'px',
        format: [canvas.width, canvas.height]
      })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height)
      pdf.save('rendered-html.pdf')
    } catch (e) {
      console.error(e)
      alert('Error rendering HTML to PDF.')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="py-12 bg-white border-b">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">HTML to PDF</h1>
        <p className="text-center text-gray-500">Render custom HTML code blocks directly to vector standard PDF formats.</p>
      </div>
      
      <WorkspaceLayout onProcess={handleProcess} processLabel="Download PDF" colorTheme="red" isProcessing={isProcessing} sidebarContent={
        <div className="space-y-4">
          <p className="text-xs text-gray-500">Type raw HTML code into the editor. Our client-side engine will render it and snapshot it into a PDF layout.</p>
          <button onClick={() => setHtmlCode('')} className="text-sm text-red-500 hover:underline mt-4 block">Clear HTML</button>
        </div>
      }>
        <div className="w-full flex gap-4 h-[60vh]">
          <div className="flex-1 flex flex-col">
            <h3 className="font-bold text-gray-700 mb-2">HTML Editor</h3>
            <textarea 
              value={htmlCode} 
              onChange={e => setHtmlCode(e.target.value)} 
              className="flex-grow w-full border p-4 font-mono text-sm bg-gray-900 text-green-400 rounded-lg shadow-inner outline-none resize-none"
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
