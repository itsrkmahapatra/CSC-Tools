import type { Metadata } from 'next'
import PageClient from './page-client'

export const metadata: Metadata = {
  title: 'Compare PDF side-by-side Free - 100% Private Alternative to Copyleaks',
  description: 'Compare two PDF documents side-by-side to highlight page, text, or layout changes. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to Copyleaks.',
  keywords: 'compare pdf side by side, pdf comparison tool, alternative to copyleaks, alternative to ilovepdf, private pdf comparator',
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
            "name": "Docuvate COMPARE",
            "operatingSystem": "All",
            "applicationCategory": "BusinessApplication",
            "browserRequirements": "Requires JavaScript and modern browser context. Runs 100% client-side offline.",
            "offers": {
              "@type": "Offer",
              "price": "0",
              "priceCurrency": "USD"
            },
            "description": "Compare two PDF documents side-by-side to highlight page, text, or layout changes. Docuvate operates 100% client-side. Your files never touch any server. Free alternative to Copyleaks."
          })
        }}
      />
      <PageClient />
    </>
  )
}