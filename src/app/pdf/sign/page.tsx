import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Sign PDF Free - 100% Private Alternative to iLovePDF & eSign',
  description: 'Place custom pen drawing, typed name in cursive font, or signature image overlays on PDF pages. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF.',
  keywords: 'sign pdf online, draw signature on pdf, sign document free, alternative to ilovepdf, private pdf signer',
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
            "name": "Docuvate SIGN",
            "operatingSystem": "All",
            "applicationCategory": "BusinessApplication",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Place custom pen drawing, typed name in cursive font, or signature image overlays on PDF pages. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF."
          })
        }}
      />
      <PageClient />
    </>
  )
}