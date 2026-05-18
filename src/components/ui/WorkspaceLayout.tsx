'use client'
import { ReactNode } from 'react'
import { Settings, Play } from 'lucide-react'

interface WorkspaceLayoutProps {
  children: ReactNode
  sidebarContent: ReactNode
  onProcess: () => void
  processLabel?: string
  colorTheme?: 'red' | 'blue' | 'indigo' | 'teal' | 'orange' | 'rose'
  isProcessing?: boolean
}

export default function WorkspaceLayout({ children, sidebarContent, onProcess, processLabel = "Process", colorTheme = "red", isProcessing = false }: WorkspaceLayoutProps) {
  const themes = {
    red: 'bg-red-500 hover:bg-red-600',
    blue: 'bg-blue-500 hover:bg-blue-600',
    indigo: 'bg-indigo-500 hover:bg-indigo-600',
    teal: 'bg-teal-500 hover:bg-teal-600',
    orange: 'bg-orange-500 hover:bg-orange-600',
    rose: 'bg-rose-500 hover:bg-rose-600',
  }
  const themeClass = themes[colorTheme] || themes.red
  
  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-120px)] w-full bg-gray-200 overflow-hidden">
      {/* Canvas Area */}
      <div className="flex-grow p-8 overflow-y-auto bg-gray-200 flex flex-wrap content-start justify-center gap-6 relative">
        {children}
      </div>

      {/* Sidebar Configurations */}
      <div className="w-full md:w-80 bg-white border-l shadow-xl flex flex-col shrink-0">
        <div className="p-6 border-b flex items-center bg-gray-50">
          <Settings className="w-5 h-5 mr-2 text-gray-600" />
          <h2 className="text-lg font-bold text-gray-800">Settings</h2>
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
          {sidebarContent}
        </div>
        <div className="p-6 border-t bg-gray-50">
          <button 
            onClick={onProcess}
            disabled={isProcessing}
            className={`w-full text-white font-bold py-4 px-6 rounded-xl shadow-lg flex items-center justify-center space-x-2 transition-transform hover:scale-105 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed ${themeClass}`}
          >
            <span>{isProcessing ? 'Processing...' : processLabel}</span>
            {!isProcessing && <Play className="w-5 h-5 fill-current" />}
          </button>
        </div>
      </div>
    </div>
  )
}
