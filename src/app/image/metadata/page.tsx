import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'EXIF Metadata Reader Free - 100% Private Alternative to Verexif',
  description: 'Read camera model, ISO, shutter speed, date, and GPS coordinates from JPEG EXIF metadata locally. Docuvate operates 100% client-side. Your images never leave your computer. Free alternative to Verexif.',
  keywords: 'exif reader online, read photo metadata, check photo gps location, alternative to verexif, private exif viewer',
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
            "name": "Docuvate METADATA",
            "operatingSystem": "All",
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Read camera model, ISO, shutter speed, date, and GPS coordinates from JPEG EXIF metadata locally. Docuvate operates 100% client-side. Your images never leave your computer. Free alternative to Verexif."
          })
        }}
      />
      <PageClient />
    </>
  )
}