import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'PDF to PDF/A Converter Free - 100% Private Alternative to iLovePDF',
  description: 'Convert PDF files to standard PDF/A-1b archiving documents. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF.',
  keywords: 'pdf to pdfa converter, convert pdf to pdf/a, alternative to ilovepdf, alternative to pi7 pdf, private pdf to pdfa, offline converter',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/convert/pdf-to-pdfa/',
  },
  openGraph: {
    title: 'PDF to PDF/A Converter Free - 100% Private Alternative to iLovePDF',
    description: 'Convert PDF files to standard PDF/A-1b archiving documents. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/convert/pdf-to-pdfa/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'PDF to PDF/A Converter Free - 100% Private Alternative to iLovePDF',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PDF to PDF/A Converter Free - 100% Private Alternative to iLovePDF',
    description: 'Convert PDF files to standard PDF/A-1b archiving documents. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF.',
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
            "name": "Docuvate PDF TO PDFA",
            "operatingSystem": "All (Windows, macOS, Linux, iOS, Android)",
            "applicationCategory": "ConverterApplication",
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
            "description": "Convert PDF files to standard PDF/A-1b archiving documents. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLovePDF and Pi7 PDF."
          })
        }}
      />
      <PageClient />
    </>
  )
}