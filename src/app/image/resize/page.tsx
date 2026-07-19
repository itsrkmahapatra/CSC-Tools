import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Resize Image Free - 100% Private Alternative to iLoveIMG & Pi7',
  description: 'Resize images by percentage or custom width and height. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLoveIMG and Pi7 Image.',
  keywords: 'resize image online, image resizer free, alternative to iloveimg, alternative to pi7 image, private image resizer, offline resize',
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
            "name": "Docuvate RESIZE",
            "operatingSystem": "All",
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Resize images by percentage or custom width and height. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLoveIMG and Pi7 Image."
          })
        }}
      />
      <PageClient />
    </>
  )
}