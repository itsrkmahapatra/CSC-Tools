import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'HTML to Image Snapshot Free - 100% Private Alternative to URLbox',
  description: 'Render HTML code markup locally and save it as an image. Docuvate operates 100% client-side. Your code never leaves your computer. Free alternative to URLbox and iLoveIMG.',
  keywords: 'html to image, html snapshot online, convert html code to png, alternative to urlbox, private html renderer',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/image/html-to-image/',
  },
  openGraph: {
    title: 'HTML to Image Snapshot Free - 100% Private Alternative to URLbox',
    description: 'Render HTML code markup locally and save it as an image. Docuvate operates 100% client-side. Your code never leaves your computer. Free alternative to URLbox and iLoveIMG.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/image/html-to-image/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'HTML to Image Snapshot Free - 100% Private Alternative to URLbox',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'HTML to Image Snapshot Free - 100% Private Alternative to URLbox',
    description: 'Render HTML code markup locally and save it as an image. Docuvate operates 100% client-side. Your code never leaves your computer. Free alternative to URLbox and iLoveIMG.',
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
            "name": "Docuvate HTML TO IMAGE",
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
            "description": "Render HTML code markup locally and save it as an image. Docuvate operates 100% client-side. Your code never leaves your computer. Free alternative to URLbox and iLoveIMG."
          })
        }}
      />
      <PageClient />
    </>
  )
}