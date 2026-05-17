const fs = require('fs');
const path = require('path');

const links = [
  '/pdf/merge', '/pdf/split', '/pdf/remove-pages', '/pdf/extract-pages', '/pdf/organize', '/pdf/rotate', '/pdf/crop',
  '/pdf/compress', '/pdf/repair', '/pdf/unlock', '/pdf/protect', '/pdf/sign', '/pdf/add-page-numbers', '/pdf/add-watermark', '/pdf/redact', '/pdf/compare',
  '/convert/jpg-to-pdf', '/convert/word-to-pdf', '/convert/powerpoint-to-pdf', '/convert/excel-to-pdf', '/convert/html-to-pdf', '/convert/pdf-to-jpg', '/convert/pdf-to-word', '/convert/pdf-to-powerpoint', '/convert/pdf-to-excel', '/convert/pdf-to-pdfa', '/convert/ocr-pdf',
  '/image/compress', '/image/resize', '/image/crop', '/image/convert-to-jpg', '/image/convert-from-jpg', '/image/rotate', '/image/flip', '/image/html-to-image', '/image/metadata',
  '/ai/meme-generator', '/ai/photo-editor', '/ai/watermark-image', '/ai/blur', '/ai/remove-background', '/ai/change-background', '/ai/exam-photo'
];

links.forEach(link => {
  const dir = path.join(__dirname, 'src/app', link);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, 'page.tsx'), `
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
    `.trim());
  }
});
