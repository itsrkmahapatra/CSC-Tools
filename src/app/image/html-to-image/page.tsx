import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'HTML to Image Snapshot Free - 100% Private Alternative to URLbox',
  description: 'Render HTML code markup locally and save it as an image. Docuvate operates 100% client-side. Your code never leaves your computer. Free alternative to URLbox and iLoveIMG.',
  keywords: 'html to image, html snapshot online, convert html code to png, alternative to urlbox, private html renderer',
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
            "name": "Docuvate HTML TO IMAGE",
            "operatingSystem": "All",
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Render HTML code markup locally and save it as an image. Docuvate operates 100% client-side. Your code never leaves your computer. Free alternative to URLbox and iLoveIMG."
          })
        }}
      />
      <PageClient />
    </>
  )
}