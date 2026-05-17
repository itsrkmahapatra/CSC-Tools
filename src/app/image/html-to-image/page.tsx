import { Wrench } from 'lucide-react'
import Link from 'next/link'

export default function HTMLToImage() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <div className="bg-blue-100 p-6 rounded-full mb-6 relative">
        <Wrench className="w-16 h-16 text-blue-500" />
      </div>
      <h1 className="text-4xl font-bold text-gray-800 mb-4">HTML to Image</h1>
      <p className="text-gray-500 max-w-xl mb-6 text-lg">
        This tool shares the same underlying engine as our HTML to PDF converter. Canvas-capture rendering loops that extract full webpage graphics down into absolute snapshot files.
      </p>
      <Link href="/convert/html-to-pdf" className="bg-blue-600 text-white px-8 py-3 rounded-full font-bold shadow-lg hover:bg-blue-700 transition-colors">
        Try HTML to PDF instead
      </Link>
    </div>
  )
}
