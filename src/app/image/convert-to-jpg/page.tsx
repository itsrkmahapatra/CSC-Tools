import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Convert to JPG Free - 100% Private Alternative to iLoveIMG & Pi7',
  description: 'Convert PNG, WebP, SVG, BMP, or GIF images to JPG format and download as ZIP. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLoveIMG and Pi7.',
  keywords: 'convert to jpg online, image to jpg converter, alternative to iloveimg, alternative to pi7 image, private image converter',
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
            "name": "Docuvate CONVERT TO JPG",
            "operatingSystem": "All",
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Convert PNG, WebP, SVG, BMP, or GIF images to JPG format and download as ZIP. Docuvate operates 100% client-side. Your files never leave your computer. Free alternative to iLoveIMG and Pi7."
          })
        }}
      />
      <PageClient />
    </>
  )
}