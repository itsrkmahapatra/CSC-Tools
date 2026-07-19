'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument, degrees } from 'pdf-lib'
import { getPdfPageImages } from '@/lib/pdf-utils'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { Move, Trash2, RotateCw, PlusCircle, FileText, Upload } from 'lucide-react'

interface PageItem {
  id: string;
  sourceFileId: string;
  sourceFileName: string;
  originalIndex: number;
  image: string;
  rotation: number;
  isBlank: boolean;
}

export default function OrganizePDF() {
  const [pages, setPages] = useState<PageItem[]>([])
  const [sourceFiles, setSourceFiles] = useState<Record<string, File>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Process files dropped into workspace
  const handleFilesDrop = async (droppedFiles: File[]) => {
    setIsProcessing(true)
    const newPages: PageItem[] = []
    const newSourceFiles = { ...sourceFiles }

    for (const file of droppedFiles) {
      if (file.type !== 'application/pdf') continue
      const fileId = `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      newSourceFiles[fileId] = file

      try {
        const images = await getPdfPageImages(file)
        images.forEach((img, idx) => {
          newPages.push({
            id: `page-${fileId}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
            sourceFileId: fileId,
            sourceFileName: file.name,
            originalIndex: idx,
            image: img,
            rotation: 0,
            isBlank: false
          })
        })
      } catch (err) {
        console.error("Failed to load PDF pages", err)
      }
    }

    setSourceFiles(newSourceFiles)
    setPages(prev => [...prev, ...newPages])
    setIsProcessing(false)
  }

  const addBlankPage = () => {
    const blankId = `blank-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const blankItem: PageItem = {
      id: blankId,
      sourceFileId: 'blank',
      sourceFileName: 'Blank Page',
      originalIndex: -1,
      image: '', // empty image for blank page placeholder
      rotation: 0,
      isBlank: true
    }
    setPages(prev => [...prev, blankItem])
  }

  const handleRotate = (id: string) => {
    setPages(prev => prev.map(p => {
      if (p.id !== id) return p
      return { ...p, rotation: (p.rotation + 90) % 360 }
    }))
  }

  const handleDelete = (id: string) => {
    setPages(pages.filter(p => p.id !== id))
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(pages)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    setPages(items)
  }

  const handleProcess = async () => {
    if (pages.length === 0) return
    setIsProcessing(true)
    try {
      const newPdf = await PDFDocument.create()
      const fileCache = new Map<string, PDFDocument>()

      for (const pageItem of pages) {
        if (pageItem.isBlank) {
          // A4 dimensions: 595.28 x 841.89 points
          const blankPage = newPdf.addPage([595.28, 841.89])
          if (pageItem.rotation !== 0) {
            blankPage.setRotation(degrees(pageItem.rotation))
          }
        } else {
          let sourcePdf = fileCache.get(pageItem.sourceFileId)
          if (!sourcePdf) {
            const fileObj = sourceFiles[pageItem.sourceFileId]
            if (!fileObj) continue
            const arrayBuffer = await fileObj.arrayBuffer()
            sourcePdf = await PDFDocument.load(arrayBuffer)
            fileCache.set(pageItem.sourceFileId, sourcePdf)
          }

          const [copiedPage] = await newPdf.copyPages(sourcePdf, [pageItem.originalIndex])
          if (pageItem.rotation !== 0) {
            const curRot = copiedPage.getRotation().angle
            copiedPage.setRotation(degrees((curRot + pageItem.rotation) % 360))
          }
          newPdf.addPage(copiedPage)
        }
      }

      const pdfBytes = await newPdf.save()
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `organized-document.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert("Error organizing PDF document.")
    } finally {
      setIsProcessing(false)
    }
  }

  if (!isMounted) return null

  if (pages.length === 0) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-black text-center text-gray-800 mb-4 tracking-tight">Organize PDF Suite</h1>
        <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">Reorder pages, merge multiple documents, insert blank pages, delete specific sheets, and rotate individual pages visually.</p>
        <Dropzone onFilesDrop={handleFilesDrop} accept="application/pdf" multiple={true} theme="red" label="Select PDF files to Organize" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel={isProcessing ? "Assembling..." : `Save Organized PDF (${pages.length} Pages)`} 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-800 text-xs uppercase tracking-widest flex items-center gap-2">
              <FileText className="w-4 h-4 text-red-500" /> Document Assembly
            </h3>
            
            <div className="space-y-2">
              <button 
                onClick={addBlankPage}
                className="w-full py-2.5 bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 uppercase text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all"
              >
                <PlusCircle className="w-4 h-4" /> Insert Blank Page
              </button>
              
              <label className="w-full py-2.5 bg-white text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 uppercase text-[10px] font-bold tracking-wider flex items-center justify-center gap-1.5 transition-all cursor-pointer">
                <Upload className="w-4 h-4 text-gray-400" /> Add Another PDF
                <input 
                  type="file" 
                  accept="application/pdf" 
                  multiple 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      handleFilesDrop(Array.from(e.target.files))
                    }
                  }} 
                />
              </label>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-2 text-xs">
            <div className="flex justify-between text-[10px] font-bold text-gray-400 uppercase">
              <span>Total Sheets</span>
              <span className="text-red-500 font-black">{pages.length}</span>
            </div>
            <p className="text-[10px] text-gray-400 leading-normal">Drag page thumbnails to reorder them. Click rotate to change orientation, or trash to discard.</p>
          </div>

          <button onClick={() => { setPages([]); setSourceFiles({}); }} className="w-full text-xs font-bold text-red-500 py-2.5 hover:bg-red-50 border border-transparent rounded-xl transition-all">Clear Workspace</button>
        </div>
      }
    >
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="pdf-pages" direction="horizontal">
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef}
              className="flex flex-wrap gap-6 justify-center items-start w-full max-w-6xl p-4 min-h-[50vh]"
            >
              {pages.map((page, index) => (
                <Draggable key={page.id} draggableId={page.id} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="relative bg-white p-2 rounded-xl shadow-lg border border-gray-200 group cursor-move hover:border-red-500 transition-colors w-44"
                    >
                      {/* drag handle indicator */}
                      <div className="absolute inset-0 bg-red-500/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity pointer-events-none z-10 rounded-xl">
                        <Move className="w-8 h-8 text-red-500/50" />
                      </div>

                      {/* Display thumbnail */}
                      <div className="w-full h-44 flex items-center justify-center bg-gray-50 rounded-lg overflow-hidden border border-gray-100 select-none">
                        {page.isBlank ? (
                          <div className="flex flex-col items-center justify-center text-gray-300 font-bold text-xs gap-1 select-none">
                            <FileText className="w-8 h-8" />
                            <span>Blank Page</span>
                          </div>
                        ) : (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={page.image} 
                            alt={page.sourceFileName} 
                            className="max-w-full max-h-full object-contain pointer-events-none transition-transform duration-200" 
                            style={{ transform: `rotate(${page.rotation}deg)` }}
                          />
                        )}
                      </div>

                      {/* Tool Controls Overlay */}
                      <div className="absolute top-3 right-3 flex gap-1 z-20">
                        <button 
                          onClick={() => handleRotate(page.id)}
                          className="p-1.5 bg-white text-gray-600 hover:text-red-500 rounded-full shadow-md border hover:scale-105 transition-all"
                          title="Rotate Page"
                        >
                          <RotateCw className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(page.id)}
                          className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-md hover:scale-105 transition-all"
                          title="Remove Page"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Index / Origin Label */}
                      <div className="mt-2.5 flex justify-between items-center px-1 text-[10px] font-bold">
                        <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full">{index + 1}</span>
                        <span className="text-gray-400 truncate max-w-[100px]" title={page.sourceFileName}>
                          {page.isBlank ? 'Blank' : page.sourceFileName}
                        </span>
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
    </WorkspaceLayout>
  )
}
