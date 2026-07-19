'use client'
import { useState } from 'react'
import Dropzone from '@/components/ui/Dropzone'
import WorkspaceLayout from '@/components/ui/WorkspaceLayout'
import { PDFDocument, degrees } from 'pdf-lib'
import { Move, Trash2, RotateCw, FileText, Info, CheckCircle2, Grid3X3, List } from 'lucide-react'
import { getPdfPageImages } from '@/lib/pdf-utils'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'

interface PageItem {
  id: string;
  file: File;
  pageIndex: number;
  preview: string | null;
  rotation: number;
  selected: boolean;
  fileName: string;
}

export default function MergePDF() {
  const [pages, setPages] = useState<PageItem[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  const handleFilesDrop = async (droppedFiles: File[]) => {
    setIsProcessing(true)
    const newPages: PageItem[] = []
    
    for (const f of droppedFiles) {
      try {
        const previews = await getPdfPageImages(f)
        previews.forEach((preview, idx) => {
          newPages.push({
            id: `${f.name}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
            file: f,
            pageIndex: idx,
            preview,
            rotation: 0,
            selected: true,
            fileName: f.name
          })
        })
      } catch (e) {
        console.error(`Error processing ${f.name}:`, e)
      }
    }
    
    setPages(prev => [...prev, ...newPages])
    setIsProcessing(false)
  }

  const onDragEnd = (result: DropResult) => {
    if (!result.destination) return
    const items = Array.from(pages)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)
    setPages(items)
  }

  const handleProcess = async () => {
    const selectedPages = pages.filter(p => p.selected)
    if (selectedPages.length < 1) {
      alert("Please select at least 1 page to create a PDF.")
      return
    }
    
    setIsProcessing(true)
    try {
      const mergedPdf = await PDFDocument.create()
      
      // Cache file array buffers to avoid redundant reading
      const fileCache = new Map<string, ArrayBuffer>()
      
      for (const item of selectedPages) {
        let arrayBuffer = fileCache.get(item.fileName)
        if (!arrayBuffer) {
          arrayBuffer = await item.file.arrayBuffer()
          fileCache.set(item.fileName, arrayBuffer)
        }
        
        const pdf = await PDFDocument.load(arrayBuffer)
        const [copiedPage] = await mergedPdf.copyPages(pdf, [item.pageIndex])
        
        if (item.rotation !== 0) {
          copiedPage.setRotation(degrees((copiedPage.getRotation().angle + item.rotation) % 360))
        }
        
        mergedPdf.addPage(copiedPage)
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
      alert("Error merging selected pages.")
    } finally {
      setIsProcessing(false)
    }
  }

  const toggleSelectAll = (val: boolean) => {
    setPages(pages.map(p => ({ ...p, selected: val })))
  }

  if (pages.length === 0) {
    return (
      <div className="py-24">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-4 tracking-tight">Merge & Organize PDF</h1>
        <p className="text-center text-gray-500 mb-8 max-w-lg mx-auto">Upload multiple PDFs to see all pages. Reorder, select, or rotate individual pages to build your perfect document.</p>
        <Dropzone onFilesDrop={handleFilesDrop} accept="application/pdf" label="Select PDF files" theme="red" />
      </div>
    )
  }

  return (
    <WorkspaceLayout 
      onProcess={handleProcess} 
      processLabel={isProcessing ? "Processing..." : `Merge ${pages.filter(p => p.selected).length} Pages`}
      colorTheme="red"
      isProcessing={isProcessing}
      sidebarContent={
        <div className="space-y-6">
          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-4">
            <h3 className="flex items-center gap-2 font-bold text-gray-800 text-xs uppercase tracking-widest">
              <Info className="w-4 h-4 text-red-500" /> Summary
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Total Pages:</span>
                <span className="text-gray-800 font-bold">{pages.length}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Selected:</span>
                <span className="text-red-600 font-bold">{pages.filter(p => p.selected).length}</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm space-y-3">
             <h3 className="font-bold text-gray-800 text-[10px] uppercase tracking-widest">Controls</h3>
             <div className="grid grid-cols-2 gap-2">
               <button onClick={() => toggleSelectAll(true)} className="py-2 text-[10px] font-bold border rounded-lg hover:bg-gray-50 uppercase">Select All</button>
               <button onClick={() => toggleSelectAll(false)} className="py-2 text-[10px] font-bold border rounded-lg hover:bg-gray-50 uppercase">Deselect All</button>
             </div>
             <button 
               onClick={() => {
                 const newPages = pages.filter(p => !p.selected);
                 if (newPages.length !== pages.length) {
                   setPages(newPages);
                 }
               }} 
               disabled={!pages.some(p => p.selected)}
               className="w-full py-2 text-[10px] font-bold bg-red-50 text-red-600 border border-red-100 rounded-lg hover:bg-red-100 uppercase transition-all disabled:opacity-30 flex items-center justify-center gap-2"
             >
               <Trash2 className="w-3 h-3" /> Delete Selected
             </button>
             <div className="flex gap-2 border-t pt-3 mt-3">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`flex-1 flex justify-center py-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-red-50 text-red-600 border border-red-100' : 'text-gray-400 border border-transparent'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`flex-1 flex justify-center py-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-red-50 text-red-600 border border-red-100' : 'text-gray-400 border border-transparent'}`}
                >
                  <List className="w-4 h-4" />
                </button>
             </div>
          </div>
          
          <button onClick={() => setPages([])} className="w-full py-2.5 text-xs font-bold text-red-500 border border-red-100 rounded-xl hover:bg-red-50 transition-colors flex items-center justify-center gap-2">
            <Trash2 className="w-3.5 h-3.5" /> Clear Workspace
          </button>
        </div>
      }
    >
      <DragDropContext onDragEnd={onDragEnd}>
        <Droppable droppableId="pdf-pages" direction={viewMode === 'grid' ? 'horizontal' : 'vertical'}>
          {(provided) => (
            <div 
              {...provided.droppableProps} 
              ref={provided.innerRef} 
              className={viewMode === 'grid' 
                ? "flex flex-wrap gap-4 p-4 justify-center md:justify-start" 
                : "flex flex-col gap-2 p-4 max-w-2xl mx-auto"
              }
            >
              {pages.map((item, idx) => (
                <Draggable key={item.id} draggableId={item.id} index={idx}>
                  {(provided, snapshot) => (
                    <div 
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      onClick={() => {
                        const newPages = [...pages];
                        newPages[idx].selected = !newPages[idx].selected;
                        setPages(newPages);
                      }}
                      className={`relative bg-white rounded-xl shadow-sm border-2 transition-all group cursor-pointer ${
                        viewMode === 'grid' ? 'w-40 p-2' : 'w-full p-3 flex items-center gap-4'
                      } ${item.selected ? 'border-red-500' : 'border-gray-100 opacity-60 grayscale'} ${
                        snapshot.isDragging ? 'rotate-2 scale-105 z-50 shadow-2xl' : 'hover:border-red-200'
                      }`}
                    >
                      <div className={`${viewMode === 'grid' ? 'aspect-[3/4] w-full mb-2' : 'w-16 h-20'} bg-gray-50 rounded-lg overflow-hidden border flex items-center justify-center relative shrink-0`}>
                        {item.preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img 
                            src={item.preview} 
                            alt={`Page ${item.pageIndex + 1}`} 
                            style={{ transform: `rotate(${item.rotation}deg)` }}
                            className="w-full h-full object-contain transition-transform" 
                          />
                        ) : (
                          <FileText className="w-8 h-8 text-red-200" />
                        )}
                        
                        {item.selected && (
                          <div className="absolute top-1 right-1 bg-red-600 text-white rounded-full p-0.5 shadow-lg">
                            <CheckCircle2 className="w-3 h-3" />
                          </div>
                        )}
                      </div>

                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-end">
                           <div className="min-w-0">
                             <p className="text-[10px] font-black text-red-600 uppercase tracking-tighter">Page {item.pageIndex + 1}</p>
                             <p className="text-[9px] text-gray-400 truncate w-full uppercase font-bold">{item.fileName}</p>
                           </div>
                           <div className="flex items-center gap-1.5">
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const newPages = [...pages];
                                  newPages[idx].rotation = (newPages[idx].rotation + 90) % 360;
                                  setPages(newPages);
                                }}
                                className="p-1.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg border border-transparent hover:border-red-100 transition-all shadow-sm"
                                title="Rotate Page"
                              >
                                <RotateCw className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPages(pages.filter((_, i) => i !== idx));
                                }}
                                className="p-1.5 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 rounded-lg border border-transparent hover:border-red-100 transition-all shadow-sm"
                                title="Delete Page"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                           </div>
                        </div>
                      </div>

                      <div className="absolute -top-2 -left-2 bg-gray-900 text-white w-5 h-5 flex items-center justify-center rounded-full text-[9px] font-black shadow-lg">
                        {idx + 1}
                      </div>

                      <div className="absolute bottom-2 right-2 p-1 bg-gray-100/50 rounded-md backdrop-blur-sm cursor-grab active:cursor-grabbing">
                        <Move className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
              
              <button 
                onClick={() => document.getElementById('merge-upload')?.click()}
                className={`${viewMode === 'grid' ? 'w-40 aspect-[3/4]' : 'w-full h-20'} border-2 border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center text-gray-400 hover:border-red-300 hover:text-red-400 transition-all bg-gray-50/50 group`}
              >
                <div className="w-8 h-8 rounded-full bg-white border border-gray-100 flex items-center justify-center mb-1 group-hover:scale-110 transition-transform shadow-sm">
                   <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                </div>
                <span className="text-[9px] font-black uppercase tracking-widest">Add PDFs</span>
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
