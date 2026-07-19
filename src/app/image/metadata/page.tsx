import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'EXIF Metadata Reader Free - 100% Private Alternative to Verexif',
  description: 'Read camera model, ISO, shutter speed, date, and GPS coordinates from JPEG EXIF metadata locally. Docuvate operates 100% client-side. Your images never leave your computer. Free alternative to Verexif.',
  keywords: 'exif reader online, read photo metadata, check photo gps location, alternative to verexif, private exif viewer',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/image/metadata/',
  },
  openGraph: {
    title: 'EXIF Metadata Reader Free - 100% Private Alternative to Verexif',
    description: 'Read camera model, ISO, shutter speed, date, and GPS coordinates from JPEG EXIF metadata locally. Docuvate operates 100% client-side. Your images never leave your computer. Free alternative to Verexif.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/image/metadata/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'EXIF Metadata Reader Free - 100% Private Alternative to Verexif',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EXIF Metadata Reader Free - 100% Private Alternative to Verexif',
    description: 'Read camera model, ISO, shutter speed, date, and GPS coordinates from JPEG EXIF metadata locally. Docuvate operates 100% client-side. Your images never leave your computer. Free alternative to Verexif.',
    creator: '@itsrkmahapatra',
    images: ['https://itsrkmahapatra.github.io/Docuvate/assets/developer.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
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
            "operatingSystem": "All (Windows, macOS, Linux, iOS, Android)",
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "author": {
              "@type": "Person",
              "name": "Raj Kishor Mahapatra",
              "url": "https://itsrkmahapatra.qzz.io/"
            },
            "description": "Read camera model, ISO, shutter speed, date, and GPS coordinates from JPEG EXIF metadata locally. Docuvate operates 100% client-side. Your images never leave your computer. Free alternative to Verexif."
          })
        }}
      />
      <PageClient />
    </>
  )
}