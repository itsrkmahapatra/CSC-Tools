'use client'
import { useState, useCallback } from 'react'
import { UploadCloud } from 'lucide-react'

interface DropzoneProps {
  onFilesDrop: (files: File[]) => void
  accept?: string
  multiple?: boolean
  label?: string
  theme?: 'red' | 'blue'
}

export default function Dropzone({ onFilesDrop, accept = "*", multiple = true, label = "Select files", theme = 'red' }: DropzoneProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesDrop(Array.from(e.dataTransfer.files))
    }
  }, [onFilesDrop])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesDrop(Array.from(e.target.files))
    }
  }, [onFilesDrop])

  const borderActive = theme === 'red' ? 'border-red-500 bg-red-50' : 'border-blue-500 bg-blue-50'
  const textActive = theme === 'red' ? 'text-red-500' : 'text-blue-500'
  const btnClass = theme === 'red' ? 'bg-red-500 hover:bg-red-600' : 'bg-blue-500 hover:bg-blue-600'

  return (
    <div 
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`max-w-4xl mx-auto mt-12 border-4 border-dashed rounded-3xl p-24 flex flex-col items-center justify-center transition-colors cursor-pointer
        ${isDragging ? borderActive : 'border-gray-300 bg-gray-50 hover:bg-gray-100'}`}
    >
      <UploadCloud className={`w-24 h-24 mb-6 ${isDragging ? textActive : 'text-gray-400'}`} />
      <h3 className="text-3xl font-bold text-gray-700 mb-6 text-center">{isDragging ? 'Drop files here' : 'Drag and drop your files here'}</h3>
      <label className={`text-white font-bold py-4 px-12 rounded-full cursor-pointer text-xl shadow-lg transition-transform hover:scale-105 ${btnClass}`}>
        {label}
        <input 
          type="file" 
          className="hidden" 
          accept={accept}
          multiple={multiple}
          onChange={handleFileInput}
        />
      </label>
    </div>
  )
}
