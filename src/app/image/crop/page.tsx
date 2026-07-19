import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Crop Image Free - 100% Private Alternative to iLoveIMG & Pi7',
  description: 'Crop your images to exact pixel values and ratios locally. Docuvate operates 100% client-side. Your images never leave your computer. Free alternative to iLoveIMG and Pi7 Image.',
  keywords: 'crop image online, image cropper free, alternative to iloveimg, alternative to pi7 image, private image cropper, offline crop',
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
            "name": "Docuvate CROP",
            "operatingSystem": "All",
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Crop your images to exact pixel values and ratios locally. Docuvate operates 100% client-side. Your images never leave your computer. Free alternative to iLoveIMG and Pi7 Image."
          })
        }}
      />
      <PageClient />
    </>
  )
}