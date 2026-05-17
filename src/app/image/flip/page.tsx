import { Wrench } from 'lucide-react'
import Link from 'next/link'

export default function Placeholder() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-gray-100 p-6 rounded-full mb-6">
        <Wrench className="w-16 h-16 text-gray-400" />
      </div>
      <h1 className="text-4xl font-bold text-gray-800 mb-4">Tool Under Construction</h1>
      <p className="text-gray-500 max-w-lg mb-8 text-lg">This 100% client-side tool is currently being compiled. Our WebAssembly and Canvas engines are being tuned for this specific functionality. Check back soon!</p>
      <Link href="/" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition-colors">
        Return to Dashboard
      </Link>
    </div>
  )
}