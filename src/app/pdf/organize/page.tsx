'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument } from 'pdf-lib'
import { getPdfPageImages } from '@/lib/pdf-utils'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Move } from 'lucide-react'

interface PageItem {
  id: string;
  originalIndex: number;
  image: string;
}

export default function OrganizePDF() {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [pages, setPages] = useState<PageItem[]>([])
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (file) {
      setIsProcessing(true)
      getPdfPageImages(file).then(images => {
        setPages(images.map((img, i) => ({ id: `page-${i}-${Date.now()}`, originalIndex: i, image: img })))
        setIsProcessing(false)
      }).catch(err => {
        console.error(err)
        setIsProcessing(false)
      })
    }
  }, [file])

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(pages);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setPages(items);
  }

  const handleDelete = (id: string) => {
    setPages(pages.filter(p => p.id !== id))
  }

  const handleProcess = async () => {
    if (!file || pages.length === 0) return
    setIsProcessing(true)
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await PDFDocument.load(arrayBuffer)
      const newPdf = await PDFDocument.create()
      
      // Copy pages one by one to respect duplicates if the user could duplicate, but right now it's just reordering/deleting.
      const copiedPages = await newPdf.copyPages(pdf, pages.map(p => p.originalIndex))
      copiedPages.forEach(p => newPdf.addPage(p))

      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `organized-${file.name}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
    } catch (e) {
      console.error(e)
      alert("Error organizing PDF.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!file || !isMounted) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4">Organize PDF</h1>
        <p className="text-center text-gray-500 mb-8">Visual drag-and-drop workspace to reorder or delete pages.</p>
        <Dropzone onFilesDrop={(files) => setFile(files[0])} accept="application/pdf" multiple={false} theme="red" label="Select PDF file" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Save Organized PDF" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div>
            <h3 className="font-semibold text-gray-700 mb-3">Reorder & Organize</h3>
            <p className="text-xs text-gray-500 mb-4">Drag and drop the page thumbnails to reorder them in the document. Hover over a page and click the trash icon to delete it.</p>
            <p className="text-xl font-bold text-red-600 mb-2">{pages.length} Pages</p>
          </div>
          <button onClick={() => { setFile(null); setPages([]); }} className="text-sm text-red-500 hover:underline">Clear & Choose another</button>
        </div>
      }
    >
      {pages.length > 0 ? (
        <DragDropContext onDragEnd={onDragEnd}>
          <Droppable droppableId="pdf-pages" direction="horizontal">
            {(provided) => (
              <div 
                {...provided.droppableProps} 
                ref={provided.innerRef}
                className="flex flex-wrap gap-6 justify-center items-start w-full"
              >
                {pages.map((page, index) => (
                  <Draggable key={page.id} draggableId={page.id} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="relative bg-white p-2 rounded-lg shadow-md border-2 border-gray-200 group cursor-move hover:border-red-500 transition-colors"
                      >
                        <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none z-10">
                           <Move className="w-12 h-12 text-red-500" />
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={page.image} alt={`Page ${page.originalIndex + 1}`} className="w-40 h-auto object-contain pointer-events-none" />
                        <button 
                          onClick={() => handleDelete(page.id)}
                          className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 shadow-lg hover:scale-110 z-20"
                          title="Delete Page"
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                        <div className="absolute bottom-2 left-2 bg-black/80 text-white text-xs px-2 py-1 rounded-full font-bold z-20">
                          {index + 1}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      ) : (
        <div className="flex items-center justify-center w-full h-full text-gray-500">
          <p className="animate-pulse">Loading Document Visuals...</p>
        </div>
      )}
    </WorkspaceLayout>
  )
}
