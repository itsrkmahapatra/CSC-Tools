import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'OCR Searchable PDF Maker Free - 100% Private Alternative to iLovePDF',
  description: 'Compile scanned PDFs and images into searchable PDF documents with selectable text layers locally using Tesseract.js. Docuvate operates 100% client-side. Your files never leave your computer.',
  keywords: 'ocr pdf online, searchable pdf maker, alternative to ilovepdf, alternative to pi7 pdf, private ocr pdf, offline ocr',
}

export default function Page() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            "name": "Docuvate OCR PDF",
            "operatingSystem": "All",
            "applicationCategory": "ConverterApplication",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Compile scanned PDFs and images into searchable PDF documents with selectable text layers locally using Tesseract.js. Docuvate operates 100% client-side. Your files never leave your computer."
          })
        }}
      />
      <PageClient />
    </>
  )
}