import type { Metadata } from 'next'
import './globals.css'
import { Lock } from 'lucide-react'
import Link from 'next/link'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'CSC Tools - 100% Private PDF & Image Utilities',
  description: 'A comprehensive suite of 100% client-side, privacy-focused tools for PDF and Image processing. Merge, split, compress, convert, and edit files locally in your browser.',
  keywords: 'PDF tools, image tools, private PDF editor, local file processing, merge PDF, compress image, OCR PDF, secure PDF utilities',
  authors: [{ name: 'Raj Kishor Mahapatra' }],
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Anti-copy / Anti-DevTools script
              document.addEventListener('contextmenu', event => event.preventDefault());
              document.addEventListener('keydown', event => {
                // Prevent F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, Ctrl+U, Ctrl+S
                if (event.keyCode === 123 || 
                   (event.ctrlKey && event.shiftKey && (event.keyCode === 73 || event.keyCode === 74 || event.keyCode === 67)) ||
                   (event.ctrlKey && (event.keyCode === 85 || event.keyCode === 83))) {
                  event.preventDefault();
                }
              });
            `
          }}
        />
      </head>
      <body className="flex flex-col min-h-screen">
        <header className="bg-yellow-100 text-yellow-800 text-sm font-medium py-2 px-4 flex items-center justify-center sticky top-0 z-50 shadow-sm">
          <Lock className="w-4 h-4 mr-2" />
          <span>100% Local Sandboxed Processing. Your files never leave your computer.</span>
        </header>
        <div className="bg-white border-b py-4 px-8 shadow-sm">
          <Link href="/" className="text-2xl font-black text-red-600 tracking-tight flex items-center gap-2 w-max cursor-pointer hover:opacity-80 transition-opacity">
            <span className="bg-red-600 text-white px-2 py-1 rounded-md">CSC</span> Tools
          </Link>
        </div>
        <main className="flex-grow">
          {children}
        </main>
        <footer className="bg-white border-t py-6 text-center text-gray-500 text-sm">
          <p className="mb-2">Engineered by Raj Kishor Mahapatra</p>
          <div className="flex justify-center gap-4">
            <Link href="/terms" className="hover:text-red-600 underline">Terms & Conditions</Link>
            <Link href="/disclaimer" className="hover:text-red-600 underline">Disclaimer</Link>
          </div>
        </footer>
        <script src="/Docuvate/js/upi-widget.js?v=1.4" defer></script>
      </body>
    </html>
  )
}

