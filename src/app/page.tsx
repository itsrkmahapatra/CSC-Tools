import Link from 'next/link'
import { 
  FileDown, FileImage, Layers, FileSignature, FileHeart, Scissors, Expand, Image as ImageIcon,
  RotateCw, Crop, Wrench, Unlock, Lock, Hash, Droplet, FileMinus, Columns,
  FileText, Presentation, Table, Globe, FileCheck, ScanText, RefreshCw, FlipHorizontal, Camera, 
  Smile, Paintbrush, Eraser, User
} from 'lucide-react'

const tools = [
  {
    category: 'PDF Core & Organization Tools',
    theme: 'text-red-500',
    bg: 'hover:bg-red-50',
    items: [
      { name: 'Merge PDF', description: 'Combine multiple PDF documents into a single file in any chosen order.', icon: Layers, link: '/pdf/merge' },
      { name: 'Split PDF', description: 'Separate one page, a specific range, or split all pages into independent PDF files.', icon: Scissors, link: '/pdf/split' },
      { name: 'Remove Pages', description: 'View a thumbnail grid of a document and click to delete specific pages.', icon: FileMinus, link: '/pdf/remove-pages' },
      { name: 'Extract Pages', description: 'Pull specific pages out of a PDF and compile them into a brand-new document.', icon: FileDown, link: '/pdf/extract-pages' },
      { name: 'Organize PDF', description: 'Visual drag-and-drop workspace to reorder, delete, or insert blank pages.', icon: Columns, link: '/pdf/organize' },
      { name: 'Rotate PDF', description: 'Change the orientation (90, 180, 270 degrees) of entire files or individual pages.', icon: RotateCw, link: '/pdf/rotate' },
      { name: 'Crop PDF', description: 'Adjust the printable visible bounding box area of a PDF document page.', icon: Crop, link: '/pdf/crop' },
    ]
  },
  {
    category: 'PDF Optimization & Security',
    theme: 'text-rose-700',
    bg: 'hover:bg-rose-50',
    items: [
      { name: 'Compress PDF', description: 'Shrunk file size while maintaining resolution using client-side image downscaling.', icon: FileHeart, link: '/pdf/compress' },
      { name: 'Repair PDF', description: 'Scan broken streams, fix corrupted cross-reference tables (XREFs), and salvage unreadable PDF bytes.', icon: Wrench, link: '/pdf/repair' },
      { name: 'Unlock PDF', description: 'Strip password protections and restrictions if the security pass is provided.', icon: Unlock, link: '/pdf/unlock' },
      { name: 'Protect PDF', description: 'Encrypt documents using standard AES 256-bit passwords to prevent unauthorized access.', icon: Lock, link: '/pdf/protect' },
      { name: 'Sign PDF', description: 'Secure visual overlay matrix to affix hand-drawn signatures, text names, or digital stamps.', icon: FileSignature, link: '/pdf/sign' },
      { name: 'Add Page Numbers', description: 'Inject custom dynamic numbering scripts onto specific margins (header/footer).', icon: Hash, link: '/pdf/add-page-numbers' },
      { name: 'Add Watermark', description: 'Stamped text blocks or asset images across chosen coordinate layers with adjustable opacity.', icon: Droplet, link: '/pdf/add-watermark' },
      { name: 'Redact PDF', description: 'Permanently black out/sanitize sensitive structural text layers or image chunks locally.', icon: Eraser, link: '/pdf/redact' },
      { name: 'Compare PDF', description: 'Visual double-pane window layout to highlight text or positional changes between two versions.', icon: Columns, link: '/pdf/compare' },
    ]
  },
  {
    category: 'Advanced PDF Inter-Convert Matrix',
    theme: 'text-orange-500',
    bg: 'hover:bg-orange-50',
    items: [
      { name: 'JPG to PDF', description: 'Convert standalone or bulk image assets directly into individual pages or single compiled files.', icon: FileImage, link: '/convert/jpg-to-pdf' },
      { name: 'WORD to PDF', description: 'Client-side parsing layouts to convert .docx text files cleanly to PDF schemas.', icon: FileText, link: '/convert/word-to-pdf' },
      { name: 'POWERPOINT to PDF', description: 'Map .pptx slides into structured presentation pages.', icon: Presentation, link: '/convert/powerpoint-to-pdf' },
      { name: 'EXCEL to PDF', description: 'Scale spreadsheet grids natively to fit within precise print-margins.', icon: Table, link: '/convert/excel-to-pdf' },
      { name: 'HTML to PDF', description: 'Take raw HTML blocks or canvas snapshots and vector render them directly to standard formats.', icon: Globe, link: '/convert/html-to-pdf' },
      { name: 'PDF to JPG', description: 'Rasterize vector pages into high-resolution discrete images.', icon: FileImage, link: '/convert/pdf-to-jpg' },
      { name: 'PDF to WORD', description: 'Read absolute textual coordinate arrays and reconstruct editable paragraph structures.', icon: FileText, link: '/convert/pdf-to-word' },
      { name: 'PDF to POWERPOINT', description: 'Extract graphics and localized bounding text boxes to form distinct slide grids.', icon: Presentation, link: '/convert/pdf-to-powerpoint' },
      { name: 'PDF to EXCEL', description: 'Scrape underlying data grids and compile raw values into neat .xlsx or .csv sheets.', icon: Table, link: '/convert/pdf-to-excel' },
      { name: 'PDF to PDF/A', description: 'Standardize output structures into the ISO-compliant format safe for long-term document archiving.', icon: FileCheck, link: '/convert/pdf-to-pdfa' },
      { name: 'OCR PDF', description: 'Leverage compiled browser WASM engines to read flat scanned images and stitch selectable text arrays.', icon: ScanText, link: '/convert/ocr-pdf' },
    ]
  },
  {
    category: 'Image Processing & Optimization',
    theme: 'text-teal-500',
    bg: 'hover:bg-teal-50',
    items: [
      { name: 'Compress IMAGE', description: 'Optimize .png, .jpg, .svg, and .gif assets by safely tweaking pixel depth compression ratios.', icon: Expand, link: '/image/compress' },
      { name: 'Resize IMAGE', description: 'Scale dimensions up or down using width/height rules or scaling percentage bars.', icon: ImageIcon, link: '/image/resize' },
      { name: 'Crop IMAGE', description: 'Drag-and-drop boundary frame select to trim edges matching fixed layout aspects.', icon: Crop, link: '/image/crop' },
      { name: 'Convert to JPG', description: 'Batch transform miscellaneous standard files straight into basic .jpg structures.', icon: RefreshCw, link: '/image/convert-to-jpg' },
      { name: 'Convert from JPG', description: 'Export standard .jpg files into target transparency arrays like .png, looping .gif, or .webp.', icon: RefreshCw, link: '/image/convert-from-jpg' },
      { name: 'Rotate IMAGE', description: 'Shift portrait/landscape visuals dynamically by fractional or standard degree rotations.', icon: RotateCw, link: '/image/rotate' },
      { name: 'Flip Image', description: 'Flip any visual instantly along horizontal or vertical mirrors.', icon: FlipHorizontal, link: '/image/flip' },
      { name: 'HTML to IMAGE', description: 'Canvas-capture rendering loops that extract full webpage graphics down into absolute snapshot files.', icon: Globe, link: '/image/html-to-image' },
      { name: 'View Image Metadata', description: 'Read and display underlying embedded metadata files (EXIF, GPS logs) securely.', icon: Camera, link: '/image/metadata' },
    ]
  },
  {
    category: 'Visual Creators & Modern AI Tools',
    theme: 'text-indigo-500',
    bg: 'hover:bg-indigo-50',
    items: [
      { name: 'Meme Generator', description: 'Custom structural overlay environment to apply standard stylized bounding text over templates.', icon: Smile, link: '/ai/meme-generator' },
      { name: 'Photo Editor', description: 'Comprehensive studio canvas tool for sketching freehand paths, adding shapes, or deploying filters.', icon: Paintbrush, link: '/ai/photo-editor' },
      { name: 'Watermark IMAGE', description: 'Overlay transparent branding marks or text configurations in batch loops.', icon: Droplet, link: '/ai/watermark-image' },
      { name: 'Blur Face / Photo', description: 'Mask target regions, license plates, or faces using pixelation filters or gaussian blur boxes.', icon: Eraser, link: '/ai/blur' },
      { name: 'Remove Background (AI)', description: 'Utilize on-device WASM models to isolate foreground subjects and strip background pixels locally.', icon: Scissors, link: '/ai/remove-background' },
      { name: 'Change Background Color', description: 'Swap out isolated alpha-channel backgrounds for official passport gradients inside the local app tab.', icon: Paintbrush, link: '/ai/change-background' },
      { name: 'Exam Photo Resizer', description: 'Strict rigid cropping tool matching target dimension guidelines required by official registration boards.', icon: User, link: '/ai/exam-photo' },
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
                  <Link href={tool.link} key={toolIdx} className={`block bg-white p-6 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md ${section.bg} cursor-pointer`}>
                    <div className="flex items-center space-x-4 mb-4">
                      <Icon className={`w-10 h-10 ${section.theme}`} />
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
