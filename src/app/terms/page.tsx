import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Terms & Conditions - Docuvate | Free Online PDF & Image Tools',
  description: 'Read the full Terms and Conditions for using Docuvate — a 100% client-side, private, free PDF and image utility suite. Understand your rights, responsibilities, and our policies.',
  keywords: 'docuvate terms and conditions, terms of service, pdf tools terms, image tools terms, user agreement, docuvate legal, privacy policy terms',
  openGraph: {
    title: 'Terms & Conditions - Docuvate',
    description: 'Full legal terms governing your use of Docuvate — the free, private, offline-capable PDF and image tools suite.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/terms/',
    siteName: 'Docuvate',
    locale: 'en_US',
    type: 'website',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://itsrkmahapatra.github.io/Docuvate/terms/' },
}

export default function Terms() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto px-6 py-20">

        {/* Header */}
        <div className="mb-14 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium mb-8 transition-colors">
            ← Back to Docuvate
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Terms &amp; Conditions</h1>
          <p className="text-slate-400 text-lg">Effective Date: <strong className="text-slate-300">July 19, 2026</strong> &nbsp;|&nbsp; Last Updated: <strong className="text-slate-300">July 19, 2026</strong></p>
          <div className="mt-6 h-1 w-24 bg-gradient-to-r from-red-500 to-orange-500 mx-auto rounded-full" />
        </div>

        {/* Intro */}
        <section className="mb-10 bg-slate-800/40 rounded-2xl p-8 border border-slate-700/50">
          <p className="text-slate-300 leading-relaxed text-lg">
            Welcome to <strong className="text-white">Docuvate</strong> (&quot;the Website,&quot; &quot;the Platform,&quot; &quot;we,&quot; &quot;us,&quot; or &quot;our&quot;), accessible at{' '}
            <a href="https://itsrkmahapatra.github.io/Docuvate/" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
              https://itsrkmahapatra.github.io/Docuvate/
            </a>
            . Docuvate is a free, browser-based document and image processing utility suite developed and maintained by{' '}
            <strong className="text-white">Raj Kishor Mahapatra</strong> (&quot;the Developer,&quot; &quot;the Author&quot;).
          </p>
          <p className="text-slate-300 leading-relaxed mt-4">
            These Terms and Conditions (&quot;Terms,&quot; &quot;Agreement&quot;) govern your access to and use of all tools, features, content, and services available on Docuvate. By visiting, accessing, or using this Website in any manner — whether as a registered or unregistered user — you acknowledge that you have read, understood, and agree to be bound by these Terms in their entirety. If you do not agree to any part of these Terms, you must immediately discontinue your use of Docuvate.
          </p>
          <p className="text-slate-300 leading-relaxed mt-4">
            These Terms constitute a legally binding agreement between you (the &quot;User&quot;) and the Developer. They apply to all visits, interactions, and uses of the Website regardless of the device, browser, network, or jurisdiction from which you access it.
          </p>
        </section>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">01.</span> Definitions
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>For the purposes of these Terms, the following definitions shall apply:</p>
            <ul className="list-none space-y-3 pl-4 border-l-2 border-red-500/30">
              <li><strong className="text-white">&quot;Docuvate&quot;</strong> refers to the web platform, its tools, its branding, its user interface, its source code, its compiled assets, and all intellectual property associated therewith.</li>
              <li><strong className="text-white">&quot;User&quot;</strong> means any individual or legal entity that accesses or uses the Website, whether directly or via an embedded frame, API call, or third-party integration.</li>
              <li><strong className="text-white">&quot;Tools&quot;</strong> refers to the individual browser-based utilities provided by Docuvate, including but not limited to: PDF Merge, PDF Split, PDF Compress, PDF Protect, PDF Unlock, PDF Rotate, PDF Crop, PDF Organize, PDF Add Page Numbers, PDF Remove Pages, PDF Compare, PDF Redact, PDF Sign, PDF Repair, PDF Add Watermark, PDF to JPG, JPG to PDF, OCR PDF, PDF to PDF/A, Image Resize, Image Rotate, Image Flip, Image Crop, Image Compress, Image Convert, Image Metadata, AI Background Remove, AI Image Upscale, AI Photo Editor, AI Blur, AI Meme Generator, AI Exam Photo, and AI Watermark Image.</li>
              <li><strong className="text-white">&quot;Content&quot;</strong> means any text, graphics, images, videos, software, source code, compiled code, or other materials made available on or through Docuvate.</li>
              <li><strong className="text-white">&quot;Your Files&quot;</strong> or <strong className="text-white">&quot;User Files&quot;</strong> refers to any documents, images, PDFs, or other digital files you upload to or process through the Tools.</li>
              <li><strong className="text-white">&quot;Client-Side Processing&quot;</strong> means all computation and data manipulation performed exclusively within your web browser on your local device, without data being transmitted to any external server.</li>
            </ul>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">02.</span> Acceptance of Terms
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>By accessing Docuvate, you affirm that you are at least 13 years of age, or the age of digital consent in your jurisdiction if higher, and that you are legally competent to enter into a binding agreement. If you are accessing Docuvate on behalf of an organization, company, or other legal entity, you represent and warrant that you have the authority to bind that entity to these Terms.</p>
            <p>Your continued use of Docuvate following the posting of revised Terms constitutes your acceptance of those revised Terms. We reserve the right to update, amend, or modify these Terms at any time without prior notice. The &quot;Last Updated&quot; date at the top of this page will reflect the most recent revisions. It is your responsibility to review these Terms periodically for changes.</p>
            <p>If at any time you do not agree to these Terms, your sole recourse is to discontinue use of Docuvate immediately. The Developer shall not be liable for any damages, losses, or expenses arising from your choice to discontinue use.</p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">03.</span> Nature of Service — Client-Side Privacy Architecture
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Docuvate is engineered with a privacy-first, client-side architecture. This means that all file processing, document manipulation, and AI inference operations are performed entirely within your web browser using technologies such as JavaScript, WebAssembly, and the Web Workers API. Your files are never uploaded to, stored on, or transmitted to any external server, cloud infrastructure, or third-party service.</p>
            <p>This architecture has the following practical implications:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The Developer has no visibility into, access to, or copies of any files you process using Docuvate&apos;s Tools.</li>
              <li>The Developer cannot recover, restore, or produce any User Files under any circumstance, including lawful compulsion, subpoena, or court order, because such files are never transmitted to or stored on any server controlled by the Developer.</li>
              <li>The quality and speed of processing depend entirely on your device&apos;s hardware capabilities, available memory, and browser version.</li>
              <li>Docuvate may function in offline mode once the page assets have been loaded, depending on your browser&apos;s caching behavior.</li>
              <li>The Developer makes no representation that client-side processing produces results identical to commercial server-side solutions.</li>
            </ul>
            <p>You understand and acknowledge that the privacy benefits of client-side architecture also mean that Docuvate cannot provide recovery services for corrupted or lost files. All file operations are irreversible once completed. You are solely responsible for maintaining backups of your original files before using any Tool.</p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">04.</span> Permitted Use
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Subject to your compliance with these Terms, Docuvate grants you a limited, non-exclusive, non-transferable, revocable license to access and use the Website and its Tools solely for your personal, educational, research, or internal business purposes.</p>
            <p>You may use Docuvate to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Process, convert, compress, merge, split, organize, protect, and manipulate PDF documents and image files that you own or have the legal right to process.</li>
              <li>Use AI-powered tools such as background removal, image upscaling, OCR, and photo editing on files you own or have authorization to use.</li>
              <li>Share the URL of Docuvate with colleagues, friends, and communities for legitimate educational or productivity purposes.</li>
              <li>Embed links to specific tool pages in articles, blog posts, or educational content, provided such embedding does not misrepresent the nature of Docuvate.</li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">05.</span> Prohibited Activities
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>You agree that you will not, under any circumstance, use Docuvate to engage in any of the following prohibited activities:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Unauthorized Reproduction:</strong> Copying, cloning, mirroring, scraping, or reproducing any part of the Website&apos;s source code, compiled assets, design system, user interface, or intellectual property without express written permission from the Developer.</li>
              <li><strong className="text-white">Commercial Exploitation:</strong> Reselling, sublicensing, offering paid access to, or incorporating Docuvate&apos;s codebase or tools into a commercial product or service without prior written authorization.</li>
              <li><strong className="text-white">Reverse Engineering:</strong> Decompiling, disassembling, reverse-engineering, or attempting to extract the underlying source code of any compiled or minified asset of Docuvate.</li>
              <li><strong className="text-white">Malicious Use:</strong> Using Docuvate to process files containing malware, ransomware, viruses, or any harmful code intended to damage systems or compromise user privacy.</li>
              <li><strong className="text-white">Illegal Content:</strong> Processing, distributing, or creating documents containing child sexual abuse material (CSAM), terrorist propaganda, incitement to violence, or any content that is illegal under applicable law.</li>
              <li><strong className="text-white">Intellectual Property Infringement:</strong> Using Docuvate to manipulate, alter, or reproduce copyrighted materials, trademarks, or other intellectual property belonging to third parties without proper authorization or fair use justification.</li>
              <li><strong className="text-white">Fraudulent Documents:</strong> Using Docuvate&apos;s Tools (including PDF editing, watermarking, signing, or redaction) to create, alter, or produce fraudulent identity documents, contracts, academic credentials, legal instruments, financial records, or any document intended to deceive another party.</li>
              <li><strong className="text-white">Automated Abuse:</strong> Using bots, crawlers, scrapers, or automated scripts to access, scrape, download, or interact with the Website in a manner that imposes an unreasonable load or disrupts service for other users.</li>
              <li><strong className="text-white">Misrepresentation:</strong> Impersonating Docuvate, the Developer, or any affiliate in any communication, social media profile, or publication; or claiming ownership, authorship, or affiliation with Docuvate without authorization.</li>
              <li><strong className="text-white">Circumvention:</strong> Attempting to bypass, disable, or undermine any security measure, access control, or content protection mechanism implemented on the Website.</li>
            </ul>
            <p>Violation of any of the above prohibitions may result in immediate termination of your access to Docuvate and may expose you to civil and/or criminal liability under applicable law.</p>
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">06.</span> Intellectual Property Rights
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>All content, design elements, branding, source code (to the extent not separately open-sourced), compiled assets, tool logic, documentation, and other materials available on or through Docuvate are the exclusive intellectual property of Raj Kishor Mahapatra (&quot;the Developer&quot;) unless otherwise indicated. This includes, without limitation:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The Docuvate brand name, logo, and visual identity.</li>
              <li>The layout, design architecture, and user interface of the Website.</li>
              <li>All custom JavaScript, TypeScript, CSS, and React components authored by the Developer.</li>
              <li>All documentation, help text, and legal pages, including these Terms.</li>
              <li>SEO metadata, structured data (JSON-LD), and page-specific copy authored by the Developer.</li>
            </ul>
            <p>Certain third-party libraries used within Docuvate (such as pdf-lib, PDF.js, Tesseract.js, TensorFlow.js, and others) are licensed under their respective open-source licenses. Their inclusion in Docuvate does not imply any transfer of rights from those license holders to you beyond what those respective licenses provide.</p>
            <p>You retain full ownership of any files you process through Docuvate. The Developer claims no ownership over Your Files and acquires no license, right, or interest in any file by virtue of you processing it through the Tools.</p>
            <p>Any feedback, suggestions, bug reports, or feature requests you submit to the Developer may be used freely by the Developer without any obligation of compensation, attribution, or acknowledgment.</p>
          </div>
        </section>

        {/* Section 7 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">07.</span> Third-Party Services and External Links
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Docuvate may contain hyperlinks to third-party websites, resources, or services. These links are provided for informational and convenience purposes only. The Developer has no control over the content, privacy practices, availability, or accuracy of third-party websites and expressly disclaims any responsibility for them.</p>
            <p>Your use of any third-party service, website, or resource accessed through Docuvate is entirely at your own risk and is governed by the terms and privacy policies of that third party. The inclusion of a link to a third-party website does not constitute the Developer&apos;s endorsement, sponsorship, or recommendation of that website or its content.</p>
            <p>Docuvate may integrate third-party open-source libraries and AI model weights. While the Developer takes reasonable steps to vet such integrations, the Developer makes no warranty regarding the performance, accuracy, security, or fitness for purpose of any third-party component.</p>
          </div>
        </section>

        {/* Section 8 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">08.</span> Privacy and Data Handling
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Docuvate is designed to handle no personally identifiable information (PII) on any server controlled by the Developer. All file processing is executed client-side within your browser. However, the following contextual data practices apply:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong className="text-white">Analytics:</strong> Docuvate may use anonymized, aggregated analytics tools that collect non-personally-identifiable usage statistics, including pages visited, approximate geographic region (country level), browser type, and session duration. No personally identifiable information is collected.</li>
              <li><strong className="text-white">Local Storage:</strong> Docuvate may store user preferences (such as theme settings or last-used tool) in your browser&apos;s localStorage. This data never leaves your device.</li>
              <li><strong className="text-white">No Tracking Cookies:</strong> Docuvate does not use tracking cookies, advertising cookies, or cross-site tracking technologies.</li>
              <li><strong className="text-white">GitHub Pages Hosting:</strong> Docuvate is hosted on GitHub Pages. GitHub, as the hosting provider, may collect certain technical information such as IP addresses and access logs in accordance with GitHub&apos;s own Privacy Policy. The Developer has no control over GitHub&apos;s data collection practices.</li>
            </ul>
            <p>By using Docuvate, you acknowledge and consent to these data practices. If you have privacy concerns regarding GitHub&apos;s hosting practices, please review the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-privacy-statement" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">GitHub Privacy Statement</a>.</p>
          </div>
        </section>

        {/* Section 9 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">09.</span> Disclaimers and Warranties
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>DOCUVATE AND ALL OF ITS TOOLS, CONTENT, AND SERVICES ARE PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS, WITHOUT ANY REPRESENTATIONS OR WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. TO THE FULLEST EXTENT PERMITTED BY APPLICABLE LAW, THE DEVELOPER EXPRESSLY DISCLAIMS ALL WARRANTIES, INCLUDING BUT NOT LIMITED TO:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Warranties of merchantability, fitness for a particular purpose, non-infringement, or title.</li>
              <li>Warranties that the Website will be available, uninterrupted, timely, secure, or error-free.</li>
              <li>Warranties regarding the accuracy, completeness, reliability, or currency of any content or tool output.</li>
              <li>Warranties that defects in the Website will be corrected.</li>
              <li>Warranties that the Website or the server that makes it available are free of viruses or other harmful components.</li>
            </ul>
            <p>The Developer makes no warranty that the output produced by any Tool will be suitable for any specific purpose, meet professional, legal, regulatory, or archival standards, or produce results equivalent to dedicated commercial software. You are solely responsible for verifying the accuracy and suitability of all tool output before relying on it for any purpose.</p>
          </div>
        </section>

        {/* Section 10 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">10.</span> Limitation of Liability
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL THE DEVELOPER, RAJ KISHOR MAHAPATRA, BE LIABLE TO YOU OR ANY THIRD PARTY FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES ARISING OUT OF OR RELATED TO YOUR USE OF OR INABILITY TO USE DOCUVATE, INCLUDING BUT NOT LIMITED TO:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Loss of data, files, or documents.</li>
              <li>Loss of profits, revenue, business, goodwill, or anticipated savings.</li>
              <li>Corruption of data or documents produced or processed by any Tool.</li>
              <li>Unauthorized access to or disclosure of your files resulting from browser vulnerabilities, malware, or network interception outside the Developer&apos;s control.</li>
              <li>Errors, inaccuracies, or omissions in tool output.</li>
              <li>Any reliance on content, tool output, or information provided by Docuvate.</li>
              <li>Interruption, suspension, or discontinuation of the Website or any Tool.</li>
            </ul>
            <p>This limitation of liability applies regardless of the theory of liability — whether in contract, tort (including negligence), strict liability, or otherwise — and even if the Developer has been advised of the possibility of such damages. The Developer&apos;s aggregate liability to you for all claims arising out of your use of Docuvate shall not exceed zero Indian Rupees (INR ₹0) or zero United States Dollars (USD $0), as the Website is provided entirely free of charge.</p>
          </div>
        </section>

        {/* Section 11 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">11.</span> Indemnification
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>You agree to indemnify, defend, and hold harmless the Developer, Raj Kishor Mahapatra, and any affiliated contributors, from and against any and all claims, damages, losses, liabilities, costs, and expenses (including reasonable legal fees) arising out of or related to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your use or misuse of Docuvate or any of its Tools.</li>
              <li>Your violation of these Terms or any applicable law, regulation, or third-party right.</li>
              <li>Your use of Docuvate to process files you do not own or do not have authorization to process.</li>
              <li>Your use of Docuvate to create fraudulent, defamatory, infringing, or illegal documents.</li>
              <li>Any content you share or distribute that incorporates tool output from Docuvate.</li>
            </ul>
            <p>The Developer reserves the right, at his own expense, to assume the exclusive defense and control of any matter subject to indemnification by you, in which event you agree to cooperate fully with the Developer&apos;s defense of such claim.</p>
          </div>
        </section>

        {/* Section 12 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">12.</span> Modifications and Availability of the Service
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>The Developer reserves the right to modify, suspend, limit, or permanently discontinue Docuvate or any of its Tools at any time, with or without notice. The Developer may also add new tools, features, or content areas, or remove existing ones, without any obligation to notify users in advance.</p>
            <p>Docuvate is hosted on GitHub Pages, a free static hosting platform. Availability of the Website is subject to the uptime and service terms of GitHub Pages. The Developer makes no representation or warranty regarding the continuous availability of Docuvate and accepts no liability for any downtime, service interruptions, or changes in GitHub Pages hosting policies that affect Docuvate&apos;s availability.</p>
            <p>The Developer may, from time to time, update the underlying libraries, AI models, or algorithms used by specific Tools. Such updates may change the quality, speed, or behavior of tool output. The Developer is not obligated to maintain backward compatibility with previous versions of any Tool.</p>
          </div>
        </section>

        {/* Section 13 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">13.</span> User Responsibilities Regarding File Ownership
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>You represent and warrant that for every file you process through Docuvate&apos;s Tools, you:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Own the file or have obtained all necessary rights, licenses, and permissions from the rightful owner(s) to process it.</li>
              <li>Are not violating any copyright, trademark, trade secret, privacy right, or other intellectual property or proprietary right of any third party.</li>
              <li>Are not processing any file that contains unlawful, harmful, threatening, abusive, harassing, defamatory, tortious, obscene, or otherwise objectionable content.</li>
              <li>Are complying with all applicable laws and regulations of your jurisdiction, including data protection laws such as GDPR, PDPA, CCPA, and equivalent statutes.</li>
              <li>Have obtained appropriate consents where your files contain personal data of third parties (e.g., passports, identity cards, medical records, contracts).</li>
            </ul>
            <p>The fact that Docuvate processes files locally in your browser does not relieve you of your legal obligations regarding the files you choose to process. You remain fully responsible for ensuring that your use of any Tool is lawful and does not infringe upon the rights of any third party.</p>
          </div>
        </section>

        {/* Section 14 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">14.</span> Open-Source Components and Third-Party Licenses
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Docuvate leverages a number of third-party open-source libraries to deliver its functionality. These include but are not limited to: <strong className="text-white">pdf-lib</strong> (MIT License), <strong className="text-white">PDF.js</strong> (Apache 2.0), <strong className="text-white">Tesseract.js</strong> (Apache 2.0), <strong className="text-white">TensorFlow.js</strong> (Apache 2.0), <strong className="text-white">@imgly/background-removal</strong> (AGPL-3.0 for open-source use), <strong className="text-white">Upscaler.js</strong> (MIT License), <strong className="text-white">JSZip</strong> (MIT License), <strong className="text-white">jsPDF</strong> (MIT License), <strong className="text-white">html2canvas</strong> (MIT License), <strong className="text-white">CropperJS</strong> (MIT License), <strong className="text-white">Lucide React</strong> (ISC License), and others.</p>
            <p>These libraries are used in accordance with their respective licenses. Nothing in these Terms shall be construed to override or supersede the terms of any open-source license under which a third-party component is distributed. The inclusion of these libraries does not grant you any additional rights over those libraries beyond what their respective licenses already provide.</p>
            <p>The AI models used in Docuvate&apos;s AI-powered tools are sourced from reputable open-source model repositories. The Developer makes no representations regarding the accuracy, fitness, or bias-free nature of these AI models. AI-generated outputs should always be reviewed by a qualified human professional before use in any consequential context.</p>
          </div>
        </section>

        {/* Section 15 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">15.</span> Governing Law and Dispute Resolution
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. Any dispute, controversy, or claim arising out of or relating to these Terms, or the breach, termination, or validity thereof, shall be subject to the exclusive jurisdiction of the courts located in Odisha, India.</p>
            <p>Before initiating any legal proceeding, you agree to make a good-faith effort to resolve any dispute informally by contacting the Developer at the contact information provided on the Website. Both parties agree to engage in at least thirty (30) days of good-faith negotiation before filing any legal action.</p>
            <p>If any provision of these Terms is found to be invalid, illegal, or unenforceable under applicable law, such provision shall be deemed modified to the minimum extent necessary to make it enforceable, and the remaining provisions shall continue in full force and effect.</p>
          </div>
        </section>

        {/* Section 16 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">16.</span> Accessibility and Browser Compatibility
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Docuvate is designed to function on modern web browsers that support contemporary JavaScript APIs, WebAssembly, and the HTML5 File API. The Developer endeavors to maintain reasonable cross-browser compatibility but does not guarantee identical behavior or full functionality across all browsers, operating systems, or device configurations.</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>AI-powered Tools require substantial RAM and GPU resources. Performance may be significantly degraded or non-functional on low-end devices.</li>
              <li>Very large files (e.g., multi-hundred-page PDFs) may exceed browser memory limits and cause tab crashes. Processing large files in smaller batches is recommended.</li>
              <li>Certain features may not function in private or incognito browsing modes due to localStorage restrictions.</li>
              <li>The Developer does not provide official support for Internet Explorer, legacy Edge, or browsers more than two major versions behind the current release.</li>
            </ul>
          </div>
        </section>

        {/* Section 17 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">17.</span> Severability and Waiver
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>If any provision of these Terms is held by a court of competent jurisdiction to be invalid, unlawful, or unenforceable, such provision shall be severed from these Terms and the remaining provisions shall remain in full force and effect, provided the severed provision did not go to the essence of these Terms.</p>
            <p>The Developer&apos;s failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision. A waiver of any breach or default under these Terms shall not constitute a waiver of any subsequent breach or default. All waivers must be in writing to be effective.</p>
          </div>
        </section>

        {/* Section 18 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">18.</span> Entire Agreement
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>These Terms, together with the <Link href="/disclaimer/" className="text-red-400 hover:underline">Disclaimer</Link>, constitute the entire agreement between you and the Developer concerning your use of Docuvate, and supersede all prior agreements, representations, warranties, and understandings — whether oral or written — with respect to the subject matter hereof.</p>
            <p>No modification of these Terms shall be binding upon the Developer unless made in writing and expressly designated as an amendment to these Terms by the Developer.</p>
          </div>
        </section>

        {/* Section 19 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-red-400">19.</span> Contact Information
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>If you have any questions, concerns, or requests regarding these Terms and Conditions, please contact:</p>
            <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-700/50 space-y-2">
              <p><strong className="text-white">Developer:</strong> Raj Kishor Mahapatra</p>
              <p><strong className="text-white">Portfolio:</strong> <a href="https://itsrkmahapatra.qzz.io/" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">itsrkmahapatra.qzz.io</a></p>
              <p><strong className="text-white">Platform:</strong> <a href="https://itsrkmahapatra.github.io/Docuvate/" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">itsrkmahapatra.github.io/Docuvate</a></p>
              <p><strong className="text-white">GitHub:</strong> <a href="https://github.com/itsrkmahapatra" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">github.com/itsrkmahapatra</a></p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="mt-14 pt-8 border-t border-slate-700/50 text-center space-y-4">
          <p className="text-slate-400 text-sm">Last updated: <strong className="text-slate-300">July 19, 2026</strong>. By using Docuvate, you confirm that you have read, understood, and agree to these Terms in their entirety.</p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Link href="/" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">← Back to Home</Link>
            <Link href="/disclaimer/" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">View Disclaimer →</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
