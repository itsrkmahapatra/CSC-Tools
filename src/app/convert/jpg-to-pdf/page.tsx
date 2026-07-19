import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'JPG to PDF Converter Free - 100% Private Alternative to iLovePDF & Pi7',
  description: 'Convert JPEG, PNG, WebP, SVG, BMP, and GIF images to PDF documents. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF.',
  keywords: 'jpg to pdf converter, convert images to pdf, alternative to ilovepdf, alternative to pi7 pdf, private image to pdf, offline converter',
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
            "name": "Docuvate JPG TO PDF",
            "operatingSystem": "All",
            "applicationCategory": "ConverterApplication",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Convert JPEG, PNG, WebP, SVG, BMP, and GIF images to PDF documents. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF."
          })
        }}
      />
      <PageClient />
    </>
  )
}