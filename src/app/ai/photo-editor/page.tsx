import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Photo Editor Free - 100% Private Alternative to iLoveIMG & Canva',
  description: 'Edit photos, adjust filters, and add annotations locally. Docuvate operates 100% client-side. Your photos never touch any server. Free alternative to iLoveIMG and Canva.',
  keywords: 'photo editor online, edit photo online, free image editor, alternative to iloveimg, private image editor, offline photo editor',
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
            "name": "Docuvate PHOTO EDITOR",
            "operatingSystem": "All",
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Edit photos, adjust filters, and add annotations locally. Docuvate operates 100% client-side. Your photos never touch any server. Free alternative to iLoveIMG and Canva."
          })
        }}
      />
      <PageClient />
    </>
  )
}