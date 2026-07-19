import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Watermark Image Free - 100% Private Alternative to iLoveIMG',
  description: 'Add custom text or image watermarks to your photos. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Pi7 Image.',
  keywords: 'watermark image online, add watermark to photo, free watermark maker, alternative to iloveimg, alternative to pi7 image, private watermark',
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
            "name": "Docuvate WATERMARK IMAGE",
            "operatingSystem": "All",
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Add custom text or image watermarks to your photos. Docuvate operates 100% client-side. Your images never leave your computer. Free offline alternative to iLoveIMG and Pi7 Image."
          })
        }}
      />
      <PageClient />
    </>
  )
}