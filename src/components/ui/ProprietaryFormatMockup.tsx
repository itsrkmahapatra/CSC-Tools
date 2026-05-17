import { Wrench } from 'lucide-react'
import Link from 'next/link'

export default function ProprietaryFormatMockup() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-gray-100 p-6 rounded-full mb-6 relative">
        <Wrench className="w-16 h-16 text-gray-400" />
        <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-bounce">LIMIT</span>
      </div>
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Enterprise Server Required</h1>
      <p className="text-gray-500 max-w-xl mb-6 text-lg">
        You have reached the limit of the browser sandbox. Converting proprietary document formats like <strong>Word (.docx), PowerPoint (.pptx), and Excel (.xlsx)</strong> requires proprietary headless rendering servers (like LibreOffice or MS Office automation).
      </p>
      <div className="bg-blue-50 text-blue-800 p-4 rounded-lg max-w-xl text-sm mb-8 text-left">
        <strong>Technical Context:</strong> 100% Client-Side applications cannot natively parse Microsoft Office proprietary XML schemas into pixel-perfect PDF vector layouts without injecting massive 50MB+ WebAssembly binaries (which break web performance). In a full commercial setup, this tool would dispatch to an API endpoint.
      </div>
      <Link href="/" className="bg-gray-800 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-gray-900 transition-colors">
        Return to Dashboard
      </Link>
    </div>
  )
}
