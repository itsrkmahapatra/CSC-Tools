import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Repair PDF Free - 100% Private Alternative to iLovePDF',
  description: 'Repair corrupted page streams and rebuild PDF documents locally. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLovePDF and Pi7 PDF.',
  keywords: 'repair pdf online, fix corrupted pdf, alternative to ilovepdf, alternative to pi7 pdf, private pdf repair tool',
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
            "name": "Docuvate REPAIR",
            "operatingSystem": "All",
            "applicationCategory": "BusinessApplication",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Repair corrupted page streams and rebuild PDF documents locally. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLovePDF and Pi7 PDF."
          })
        }}
      />
      <PageClient />
    </>
  )
}