import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Convert from JPG Free - 100% Private Alternative to iLoveIMG',
  description: 'Convert JPG images to PNG, WebP, SVG, BMP, or GIF format locally. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLoveIMG.',
  keywords: 'convert jpg online, jpg to png converter, alternative to iloveimg, alternative to pi7 image, private image converter',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/image/convert-from-jpg/',
  },
  openGraph: {
    title: 'Convert from JPG Free - 100% Private Alternative to iLoveIMG',
    description: 'Convert JPG images to PNG, WebP, SVG, BMP, or GIF format locally. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLoveIMG.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/image/convert-from-jpg/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Convert from JPG Free - 100% Private Alternative to iLoveIMG',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Convert from JPG Free - 100% Private Alternative to iLoveIMG',
    description: 'Convert JPG images to PNG, WebP, SVG, BMP, or GIF format locally. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLoveIMG.',
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
            "name": "Docuvate CONVERT FROM JPG",
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
            "description": "Convert JPG images to PNG, WebP, SVG, BMP, or GIF format locally. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLoveIMG."
          })
        }}
      />
      <PageClient />
    </>
  )
}