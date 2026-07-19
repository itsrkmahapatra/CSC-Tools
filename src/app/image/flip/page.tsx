import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Flip Image Free - 100% Private Alternative to iLoveIMG',
  description: 'Flip images horizontally or vertically. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Pi7 Image.',
  keywords: 'flip image online, mirror image photo, free photo flipper, alternative to iloveimg, private image flipper',
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
            "name": "Docuvate FLIP",
            "operatingSystem": "All",
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Flip images horizontally or vertically. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Pi7 Image."
          })
        }}
      />
      <PageClient />
    </>
  )
}