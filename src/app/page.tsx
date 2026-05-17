import Link from 'next/link'
import { FileDown, FileImage, Layers, FileSignature, FileHeart, Scissors, Expand, Image as ImageIcon } from 'lucide-react'

const tools = [
  {
    category: 'Organize PDF',
    items: [
      { name: 'Merge PDF', description: 'Combine PDFs in the order you want with the easiest PDF merger available.', icon: Layers, color: 'text-red-500', bg: 'hover:bg-red-50', link: '/pdf/merge' },
      { name: 'Split PDF', description: 'Separate one page or a whole set for easy conversion into independent PDF files.', icon: Scissors, color: 'text-red-500', bg: 'hover:bg-red-50', link: '/pdf/split' },
    ]
  },
  {
    category: 'Convert PDF',
    items: [
      { name: 'PDF to JPG', description: 'Convert each PDF page into a JPG or extract all images contained in a PDF.', icon: FileImage, color: 'text-red-500', bg: 'hover:bg-red-50', link: '/pdf/to-jpg' },
      { name: 'HTML to PDF', description: 'Convert webpages in HTML to PDF.', icon: FileDown, color: 'text-red-500', bg: 'hover:bg-red-50', link: '/pdf/html-to-pdf' },
    ]
  },
  {
    category: 'Edit PDF',
    items: [
      { name: 'Sign PDF', description: 'Sign yourself or request signatures from others.', icon: FileSignature, color: 'text-red-500', bg: 'hover:bg-red-50', link: '/pdf/sign' },
      { name: 'Compress PDF', description: 'Reduce file size while optimizing for maximal PDF quality.', icon: FileHeart, color: 'text-red-500', bg: 'hover:bg-red-50', link: '/pdf/compress' },
    ]
  },
  {
    category: 'Edit Image',
    items: [
      { name: 'Compress Image', description: 'Compress JPG, PNG, SVG, and GIFs while saving space and maintaining quality.', icon: Expand, color: 'text-blue-500', bg: 'hover:bg-blue-50', link: '/image/compress' },
      { name: 'Crop Image', description: 'Crop pictures to the exact size you want.', icon: ImageIcon, color: 'text-blue-500', bg: 'hover:bg-blue-50', link: '/image/crop' },
      { name: 'Convert to JPG', description: 'Turn PNG, GIF, TIF, PSD, SVG, WEBP, or RAW to JPG.', icon: FileImage, color: 'text-blue-500', bg: 'hover:bg-blue-50', link: '/image/convert' },
    ]
  }
]

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-bold text-center mb-4 text-gray-800">Every tool you need to work with PDFs and Images</h1>
      <h2 className="text-xl text-center text-gray-500 mb-12">100% Client-Side. Private, Fast, and Free.</h2>

      <div className="space-y-12">
        {tools.map((section, idx) => (
          <div key={idx}>
            <h3 className="text-2xl font-bold mb-6 border-b pb-2 text-gray-800">{section.category}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.items.map((tool, toolIdx) => {
                const Icon = tool.icon
                return (
                  <Link href={tool.link} key={toolIdx} className={`block bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md ${tool.bg} cursor-pointer`}>
                    <div className="flex items-center space-x-4 mb-4">
                      <Icon className={`w-10 h-10 ${tool.color}`} />
                      <h4 className="text-xl font-bold text-gray-800">{tool.name}</h4>
                    </div>
                    <p className="text-gray-500 text-sm leading-relaxed">{tool.description}</p>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
