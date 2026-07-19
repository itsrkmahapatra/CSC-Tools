import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Exam Photo Size Editor Free - 100% Private Alternative to Pi7 Image',
  description: 'Resize and crop passport and visa photos to match exact exam board guidelines. Docuvate runs entirely client-side. Your files never touch any server. Free offline alternative to Pi7 Image and iLoveIMG.',
  keywords: 'passport photo size, visa photo editor, exam photo resizer, alternative to pi7 image, alternative to iloveimg, offline photo resizer',
  alternatives: {
    canonical: 'https://itsrkmahapatra.github.io/Docuvate/ai/exam-photo/',
  },
  openGraph: {
    title: 'Exam Photo Size Editor Free - 100% Private Alternative to Pi7 Image',
    description: 'Resize and crop passport and visa photos to match exact exam board guidelines. Docuvate runs entirely client-side. Your files never touch any server. Free offline alternative to Pi7 Image and iLoveIMG.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/ai/exam-photo/',
    siteName: 'Docuvate',
    images: [
      {
        url: 'https://itsrkmahapatra.github.io/Docuvate/assets/developer.png',
        width: 800,
        height: 600,
        alt: 'Exam Photo Size Editor Free - 100% Private Alternative to Pi7 Image',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Exam Photo Size Editor Free - 100% Private Alternative to Pi7 Image',
    description: 'Resize and crop passport and visa photos to match exact exam board guidelines. Docuvate runs entirely client-side. Your files never touch any server. Free offline alternative to Pi7 Image and iLoveIMG.',
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
            "name": "Docuvate EXAM PHOTO",
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
            "description": "Resize and crop passport and visa photos to match exact exam board guidelines. Docuvate runs entirely client-side. Your files never touch any server. Free offline alternative to Pi7 Image and iLoveIMG."
          })
        }}
      />
      <PageClient />
    </>
  )
}