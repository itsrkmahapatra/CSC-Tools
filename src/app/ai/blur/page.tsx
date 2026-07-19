import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Blur Image Regions Free - 100% Private Alternative to iLoveIMG',
  description: 'Add regional blur or blocky pixelation to faces, license plates, and sensitive details in your photos. Docuvate works 100% client-side; your files never touch any server. Free alternative to iLoveIMG and Pi7.',
  keywords: 'blur image online, pixelate image, regional blur, face blur photo, alternative to iloveimg, alternative to pi7, offline image blur',
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
            "name": "Docuvate BLUR",
            "operatingSystem": "All",
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Add regional blur or blocky pixelation to faces, license plates, and sensitive details in your photos. Docuvate works 100% client-side; your files never touch any server. Free alternative to iLoveIMG and Pi7."
          })
        }}
      />
      <PageClient />
    </>
  )
}