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
      <div className="flex-grow p-8 overflow-y-auto bg-gray-200 flex flex-col justify-between items-center relative">
        <div className="w-full flex flex-wrap content-start justify-center gap-6 mb-8">
          {children}
        </div>
        
        {/* SEO Brand-Intercepting Privacy & Comparison Copy */}
        <div className="w-full max-w-5xl bg-white/70 backdrop-blur-sm rounded-3xl border border-gray-200/80 p-8 text-left shadow-xs mt-12 mb-4">
          <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span className="text-base">🔒</span> 100% Private Offline Alternative to iLovePDF, iLoveIMG & Pi7
          </h3>
          <p className="text-xs text-gray-600 leading-relaxed mb-4">
            Docuvate is engineered as a secure, zero-server document workspace. Unlike cloud services like <strong>iLovePDF</strong>, <strong>iLoveIMG</strong>, <strong>ImgUpscaler</strong>, and <strong>Pi7 PDF</strong> which upload your sensitive files to external remote servers, Docuvate operates entirely inside your web browser. All processing, calculations, and conversions happen locally on your own machine.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-t border-gray-200/60 pt-4">
            <div>
              <h4 className="font-bold text-gray-700 mb-2">Why Local Browser Processing is Superior:</h4>
              <ul className="list-disc pl-4 space-y-1.5 text-gray-600">
                <li><strong>No File Size Restrictions:</strong> Process large files restricted by conventional cloud tools.</li>
                <li><strong>Guaranteed Data Privacy:</strong> Perfect for confidential, financial, medical, and legal documents.</li>
                <li><strong>Full Offline Capability:</strong> Once loaded, works completely offline without an active internet connection.</li>
                <li><strong>Zero Telemetry:</strong> No tracking cookies, no logins, and zero advertising banners.</li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-gray-700 mb-2">High-Fidelity Offline Outputs:</h4>
              <p className="text-gray-600 leading-relaxed mb-3">
                Docuvate utilizes local WebAssembly (WASM), WebGL context rendering, and offline neural networks (ONNX) to produce identical high-quality outputs matching cloud-based alternatives like <strong>ilovepdf.com</strong>, <strong>iloveimg.com</strong>, <strong>imgupscaler.ai</strong>, and <strong>pi7.org</strong>.
              </p>
              <p className="text-gray-500 font-semibold text-[10px] tracking-wide uppercase">
                ⚡ Client-Side WebAssembly Processing (Zero Cloud Retention)
              </p>
            </div>
          </div>
        </div>
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
