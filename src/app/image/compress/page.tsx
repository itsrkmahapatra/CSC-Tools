import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Compress Image Free - 100% Private Alternative to iLoveIMG & Pi7',
  description: 'Compress images with custom quality and size presets locally. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLoveIMG and Pi7 Image.',
  keywords: 'compress image online, image compressor, alternative to iloveimg, alternative to pi7 image, private image compressor, offline compress',
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
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Compress images with custom quality and size presets locally. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLoveIMG and Pi7 Image."
          })
        }}
      />
      <PageClient />
    </>
  )
}