import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Docuvate - 100% Private PDF & Image Tools (iLovePDF & iLoveIMG Offline Alternative)',
  description: 'A comprehensive suite of 100% client-side, privacy-first tools to merge, compress, crop, OCR, convert, and sign PDF and Image files locally in your browser. Complete secure alternative to iLovePDF, iLoveIMG, and Pi7.',
  keywords: 'private pdf tools, local image tools, ilovepdf alternative, iloveimg alternative, pi7 pdf alternative, client side documents editor, offline pdf tools',
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
            "name": "Docuvate",
            "operatingSystem": "All",
            "applicationCategory": "BusinessApplication",
            "browserRequirements": "Requires HTML5 Canvas and JavaScript. Runs locally.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "A comprehensive suite of 100% client-side, privacy-first tools to merge, compress, crop, OCR, convert, and sign PDF and Image files locally in your browser. Complete secure alternative to iLovePDF, iLoveIMG, and Pi7."
          })
        }}
      />
      <PageClient />
    </>
  )
}