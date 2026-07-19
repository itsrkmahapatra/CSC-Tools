import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Organize PDF Pages Free - 100% Private Alternative to iLovePDF',
  description: 'Reorder, delete, rotate, or insert blank pages in a PDF document using a drag-and-drop grid. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF.',
  keywords: 'organize pdf pages, delete pages from pdf, rotate pdf pages, alternative to ilovepdf, private pdf organizer',
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
            "name": "Docuvate ORGANIZE",
            "operatingSystem": "All",
            "applicationCategory": "BusinessApplication",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Reorder, delete, rotate, or insert blank pages in a PDF document using a drag-and-drop grid. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF."
          })
        }}
      />
      <PageClient />
    </>
  )
}