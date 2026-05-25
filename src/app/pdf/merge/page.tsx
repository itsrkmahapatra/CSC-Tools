'use client'
import { useState, useEffect } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument, degrees } from 'pdf-lib'
import { Move, Trash2, RotateCw, FileText, Info } from 'lucide-react'
import { getPdfFirstPageImage } from '@/lib/pdf-utils'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

interface FileWithPreview {
  id: string;
  file: File;
  preview: string | null;
  rotation: number;
}

export default function MergePDF() {
  const [files, setFiles] = useState<FileWithPreview[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [totalSize, setTotalSize] = useState(0)

  useEffect(() => {
    const size = files.reduce((acc, curr) => acc + curr.file.size, 0)
    setTotalSize(size)
  }, [files])

  const handleFilesDrop = async (droppedFiles: File[]) => {
    setIsProcessing(true)
    const newFilesWithPreviews: FileWithPreview[] = []
    
    for (const f of droppedFiles) {
      const preview = await getPdfFirstPageImage(f)
      newFilesWithPreviews.push({ 
        id: Math.random().toString(36).substr(2, 9),
        file: f, 
        preview,
        rotation: 0
      })
    }
    
    setFiles(prev => [...prev, ...newFilesWithPreviews])
    setIsProcessing(false)
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(files)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    setFiles(items)
  }

  const handleProcess = async () => {
    if (files.length < 2) {
      alert("Please upload at least 2 PDF files to merge.")
      return
    }
    setIsProcessing(true)
    try {
      const mergedPdf = await PDFDocument.create()
      for (const item of files) {
        const arrayBuffer = await item.file.arrayBuffer()
        const pdf = await PDFDocument.load(arrayBuffer)
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices())
        copiedPages.forEach((page) => {
          if (item.rotation !== 0) {
            page.setRotation(degrees((page.getRotation().angle + item.rotation) % 360))
          }
          mergedPdf.addPage(page)
        })
      }
      const pdfBytes = await mergedPdf.save()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const blob = new Blob([pdfBytes as any], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'Docuvate-Merged.pdf'
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      console.error(e)
      alert("Error merging PDFs.")
    } finally {
      setIsProcessing(false)
    }
  }

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (files.length === 0) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4 tracking-tight">Merge PDF</h1>
        <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">Combine multiple PDF documents into a single professional file with visual reordering.</p>
        <Dropzone onFilesDrop={handleFilesDrop} accept="application/pdf" label="Select PDF files" theme="red" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel="Merge PDF" 
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="flex items-center gap-2 font-bold text-gray-800 mb-4 text-sm uppercase tracking-wider">
              <Info className="w-4 h-4 text-red-500" /> Summary
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Files:</span>
                <span className="text-gray-800 font-bold">{files.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500 font-medium">Estimated Size:</span>
                <span className="text-red-600 font-bold">{formatSize(totalSize)}</span>
              </div>
            </div>
          </div>
          
          <div className="p-2">
            <p className="text-xs text-gray-400 mb-4 bg-gray-50 p-3 rounded-lg border border-dashed">
              Tip: Drag and drop files to change their order in the final document. Use the rotation tool for landscape-heavy files.
            </p>
            <button onClick={() => setFiles([])} className="w-full py-2 text-sm font-bold text-red-500 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
              Clear All Files
            </button>
          </div>
        </div>
      }
    >
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="pdf-files" direction="horizontal">
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef} 
              className="flex flex-wrap gap-6 p-4 justify-center md:justify-start"
            >
              {files.map((item, idx) => (
                <Draggable key={item.id} draggableId={item.id} index={idx}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`relative bg-white p-3 rounded-xl shadow-sm border-2 transition-all w-48 group ${snapshot.isDragging ? 'border-red-500 rotate-2 scale-105 z-50 shadow-2xl' : 'border-gray-100 hover:border-red-300'}`}
                    >
                      <div className="aspect-[3/4] bg-gray-50 rounded-lg mb-3 overflow-hidden border flex items-center justify-center relative">
                        {item.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={item.preview} 
                            alt={item.file.name} 
                            style={{ transform: `rotate(${item.rotation}deg)` }}
                            className="w-full h-full object-contain transition-transform" 
                          />
                        ) : (
                          <div className="flex flex-col items-center text-red-300">
                            <FileText className="w-12 h-12 mb-1" />
                            <span className="text-[10px] font-bold">PDF READY</span>
                          </div>
                        )}
                        
                        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                           <button 
                             onClick={() => {
                               const newFiles = [...files];
                               newFiles[idx].rotation = (newFiles[idx].rotation + 90) % 360;
                               setFiles(newFiles);
                             }}
                             className="p-1.5 bg-white shadow-md rounded-full text-gray-600 hover:text-red-500 transition-colors"
                             title="Rotate Document"
                           >
                             <RotateCw className="w-3.5 h-3.5" />
                           </button>
                           <button 
                             onClick={() => setFiles(files.filter((_, i) => i !== idx))}
                             className="p-1.5 bg-white shadow-md rounded-full text-red-500 hover:bg-red-50 transition-colors"
                             title="Remove"
                           >
                             <Trash2 className="w-3.5 h-3.5" />
                           </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-gray-800 truncate">{item.file.name}</p>
                        <p className="text-[10px] text-gray-400 font-medium uppercase tracking-tighter">{formatSize(item.file.size)}</p>
                      </div>

                      <div className="absolute -bottom-2 -right-2 bg-red-600 text-white w-6 h-6 flex items-center justify-center rounded-full text-xs font-black shadow-lg">
                        {idx + 1}
                      </div>
                      
                      <div className="absolute top-2 left-2 p-1 bg-gray-100/50 rounded-md backdrop-blur-sm cursor-grab active:cursor-grabbing">
                        <Move className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              <button 
                onClick={() => document.getElementById('merge-upload')?.click()}
                className="w-48 aspect-[3/4] border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-400 transition-all bg-gray-50/50 group"
              >
                <div className="w-10 h-10 rounded-full bg-white border border-gray-100 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform shadow-sm">
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
                <span className="text-xs font-bold uppercase tracking-widest">Add Files</span>
                <input 
                  id="merge-upload" 
                  type="file" 
                  accept="application/pdf" 
                  multiple 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files) handleFilesDrop(Array.from(e.target.files))
                  }}
                />
              </button>
            </div>
          )}
        </Droppable>
      </DragDropContext>
    </WorkspaceLayout>
  )
}
