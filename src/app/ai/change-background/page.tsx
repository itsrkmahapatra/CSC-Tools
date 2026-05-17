import { Wrench } from 'lucide-react'
import Link from 'next/link'

export default function ChangeBackground() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-indigo-100 p-6 rounded-full mb-6 relative">
        <Wrench className="w-16 h-16 text-indigo-500" />
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">AI WAITING</span>
      </div>
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Background Replacement Model Pending</h1>
      <p className="text-gray-500 max-w-xl mb-6 text-lg">
        This tool requires the prerequisite Alpha-channel map from the Background Removal WASM engine. 
      </p>
      <div className="bg-indigo-50 text-indigo-800 p-4 rounded-lg max-w-xl text-sm mb-8 text-left">
        <strong>Implementation Note:</strong> Once the background removal model returns the foreground mask, this page uses a standard HTML5 Canvas <code>globalCompositeOperation = &apos;destination-over&apos;</code> to slide a chosen linear gradient or flat color underneath the subject layer.
      </div>
      <Link href="/" className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-indigo-700 transition-colors">
        Return to Dashboard
      </Link>
    </div>
  )
}
