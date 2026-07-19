import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Exam Photo Size Editor Free - 100% Private Alternative to Pi7 Image',
  description: 'Resize and crop passport and visa photos to match exact exam board guidelines. Docuvate runs entirely client-side. Your files never touch any server. Free offline alternative to Pi7 Image and iLoveIMG.',
  keywords: 'passport photo size, visa photo editor, exam photo resizer, alternative to pi7 image, alternative to iloveimg, offline photo resizer',
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
            "operatingSystem": "All",
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Resize and crop passport and visa photos to match exact exam board guidelines. Docuvate runs entirely client-side. Your files never touch any server. Free offline alternative to Pi7 Image and iLoveIMG."
          })
        }}
      />
      <PageClient />
    </>
  )
}