import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'PDF to JPG Converter Free - 100% Private Alternative to iLovePDF & Pi7',
  description: 'Convert PDF pages to JPEG, PNG, or WebP images and download as a ZIP archive. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF.',
  keywords: 'pdf to jpg converter, convert pdf to images, alternative to ilovepdf, alternative to pi7 pdf, private pdf to jpg, offline converter',
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
            "name": "Docuvate PDF TO JPG",
            "operatingSystem": "All",
            "applicationCategory": "ConverterApplication",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Convert PDF pages to JPEG, PNG, or WebP images and download as a ZIP archive. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF."
          })
        }}
      />
      <PageClient />
    </>
  )
}