import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Organize PDF Pages Free - 100% Private Alternative to iLovePDF',
  description: 'Reorder, delete, rotate, or insert blank pages in a PDF document using a drag-and-drop grid. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF.',
  keywords: 'organize pdf pages, delete pages from pdf, rotate pdf pages, alternative to ilovepdf, private pdf organizer',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/pdf/organize/',
  },
  openGraph: {
    title: 'Organize PDF Pages Free - 100% Private Alternative to iLovePDF',
    description: 'Reorder, delete, rotate, or insert blank pages in a PDF document using a drag-and-drop grid. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/pdf/organize/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Organize PDF Pages Free - 100% Private Alternative to iLovePDF',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Organize PDF Pages Free - 100% Private Alternative to iLovePDF',
    description: 'Reorder, delete, rotate, or insert blank pages in a PDF document using a drag-and-drop grid. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF.',
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
            "name": "Docuvate ORGANIZE",
            "operatingSystem": "All (Windows, macOS, Linux, iOS, Android)",
            "applicationCategory": "BusinessApplication",
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
            "description": "Reorder, delete, rotate, or insert blank pages in a PDF document using a drag-and-drop grid. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF."
          })
        }}
      />
      <PageClient />
    </>
  )
}