import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Remove Background Free - 100% Private Offline Alternative to iLoveIMG',
  description: 'Isolate subjects and remove backgrounds locally using browser-native AI. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLoveIMG and remove.bg.',
  keywords: 'remove background offline, remove bg online, bg remover free, alternative to iloveimg, alternative to remove.bg, private bg remover',
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
            "name": "Docuvate REMOVE BG",
            "operatingSystem": "All",
            "applicationCategory": "ImageEditor",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Isolate subjects and remove backgrounds locally using browser-native AI. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to iLoveIMG and remove.bg."
          })
        }}
      />
      <PageClient />
    </>
  )
}