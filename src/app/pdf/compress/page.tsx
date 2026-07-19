import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Compress PDF Free - 100% Private Alternative to iLovePDF & Pi7',
  description: 'Compress and reduce PDF size with balance, quality, and custom target KB size presets. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLovePDF and Pi7 PDF.',
  keywords: 'compress pdf online, reduce pdf size, pdf compressor free, alternative to ilovepdf, alternative to pi7 pdf, private pdf compressor',
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
            "name": "Docuvate COMPRESS",
            "operatingSystem": "All",
            "applicationCategory": "BusinessApplication",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Compress and reduce PDF size with balance, quality, and custom target KB size presets. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLovePDF and Pi7 PDF."
          })
        }}
      />
      <PageClient />
    </>
  )
}