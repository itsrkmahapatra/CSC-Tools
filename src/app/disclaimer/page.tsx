import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Disclaimer - Docuvate | Free Online PDF & Image Tools',
  description: 'Read the full Disclaimer for Docuvate — a 100% client-side, private PDF and image tool suite. Understand the limitations of liability, warranty disclaimers, AI tool limitations, and your responsibilities as a user.',
  keywords: 'docuvate disclaimer, liability disclaimer, warranty disclaimer, pdf tools disclaimer, ai tools disclaimer, docuvate legal notice, no liability',
  openGraph: {
    title: 'Disclaimer - Docuvate',
    description: 'Full legal disclaimer governing the use of Docuvate — the free, private, offline-capable PDF and image tools suite.',
    url: 'https://itsrkmahapatra.github.io/Docuvate/disclaimer/',
    siteName: 'Docuvate',
    locale: 'en_US',
    type: 'website',
  },
  robots: { index: true, follow: true },
  alternates: { canonical: 'https://itsrkmahapatra.github.io/Docuvate/disclaimer/' },
}

export default function Disclaimer() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      <div className="max-w-4xl mx-auto px-6 py-20">

        {/* Header */}
        <div className="mb-14 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-red-400 hover:text-red-300 text-sm font-medium mb-8 transition-colors">
            ← Back to Docuvate
          </Link>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">Disclaimer</h1>
          <p className="text-slate-400 text-lg">Effective Date: <strong className="text-slate-300">July 19, 2026</strong> &nbsp;|&nbsp; Last Updated: <strong className="text-slate-300">July 19, 2026</strong></p>
          <div className="mt-6 h-1 w-24 bg-gradient-to-r from-orange-500 to-red-500 mx-auto rounded-full" />
        </div>

        {/* Intro Notice */}
        <section className="mb-10 bg-orange-950/30 rounded-2xl p-8 border border-orange-700/30">
          <p className="text-orange-200 leading-relaxed text-lg font-medium">
            ⚠️ IMPORTANT LEGAL NOTICE
          </p>
          <p className="text-slate-300 leading-relaxed mt-3">
            The information, tools, and services provided on <strong className="text-white">Docuvate</strong> (&quot;the Website,&quot; &quot;the Platform&quot;), accessible at{' '}
            <a href="https://itsrkmahapatra.github.io/Docuvate/" className="text-red-400 hover:underline" target="_blank" rel="noopener noreferrer">
              https://itsrkmahapatra.github.io/Docuvate/
            </a>
            , are made available by <strong className="text-white">Raj Kishor Mahapatra</strong> (&quot;the Developer,&quot; &quot;the Author&quot;) on a strictly &quot;as is&quot; and &quot;as available&quot; basis, without any representation, warranty, guarantee, or condition of any kind, whether express, implied, statutory, or otherwise. By using Docuvate, you expressly acknowledge and accept all terms set forth in this Disclaimer.
          </p>
          <p className="text-slate-300 leading-relaxed mt-4">
            This Disclaimer should be read in conjunction with our <Link href="/terms/" className="text-red-400 hover:underline">Terms and Conditions</Link>. Together, these documents constitute the complete legal framework governing your use of Docuvate. If you do not accept the terms of this Disclaimer, you must discontinue your use of Docuvate immediately.
          </p>
        </section>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">01.</span> General Disclaimer of Warranties
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>TO THE FULLEST EXTENT PERMISSIBLE UNDER APPLICABLE LAW, THE DEVELOPER EXPRESSLY DISCLAIMS ALL WARRANTIES, REPRESENTATIONS, AND CONDITIONS OF ANY KIND, WHETHER EXPRESS, IMPLIED, STATUTORY, OR OTHERWISE, WITH RESPECT TO DOCUVATE AND ALL OF ITS TOOLS, CONTENT, FEATURES, SERVICES, AND ANY OUTPUT GENERATED THEREBY, INCLUDING BUT NOT LIMITED TO THE FOLLOWING:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong className="text-white">Implied Warranty of Merchantability:</strong> The Developer makes no warranty that Docuvate or any of its Tools are of merchantable quality, are fit for a general or ordinary purpose, or meet any trade standard or practice.</li>
              <li><strong className="text-white">Implied Warranty of Fitness for a Particular Purpose:</strong> The Developer makes no warranty that Docuvate is suited to any specific use case, professional workflow, industry standard, or regulatory requirement. You are solely responsible for determining whether Docuvate is appropriate for your intended purpose.</li>
              <li><strong className="text-white">Warranty of Non-Infringement:</strong> The Developer does not warrant that your use of Docuvate, or any output generated by its Tools, will not infringe the intellectual property rights of any third party. The responsibility for ensuring that the files you process and the outputs you generate comply with applicable copyright, trademark, and other intellectual property laws rests entirely with you.</li>
              <li><strong className="text-white">Warranty of Accuracy or Completeness:</strong> The Developer does not warrant that the output produced by any Tool is accurate, complete, error-free, or fit for professional, legal, medical, financial, archival, or any other specific use. All outputs should be independently verified by a qualified professional before being relied upon.</li>
              <li><strong className="text-white">Warranty of Availability or Continuity:</strong> The Developer does not warrant that Docuvate will be available, accessible, or operational at any given time, without interruption, or free from technical errors or defects.</li>
              <li><strong className="text-white">Warranty of Security:</strong> While Docuvate&apos;s client-side architecture minimizes server-side privacy risks, the Developer does not warrant that the Website, your browser environment, or your device are free from security vulnerabilities, malware, or unauthorized access risks. Your use of Docuvate on a compromised device or network remains at your own risk.</li>
            </ul>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">02.</span> Disclaimer of Liability for File Loss and Data Corruption
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Docuvate processes all files locally within your browser environment. While every effort has been made to ensure that the Tools function reliably and produce accurate outputs, the Developer explicitly disclaims all liability for the following:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong className="text-white">File Loss:</strong> The Developer accepts no liability for any loss of files, documents, or data that may occur as a result of using Docuvate&apos;s Tools, whether due to a software bug, browser crash, device failure, out-of-memory error, power interruption, or any other cause.</li>
              <li><strong className="text-white">Data Corruption:</strong> The Developer accepts no liability for any corruption, alteration, degradation, or destruction of file content that may result from any processing operation performed by the Tools. This includes but is not limited to: PDF compression artifacts, OCR recognition errors, image quality degradation, incorrect page ordering after merge or organize operations, and AI processing artifacts.</li>
              <li><strong className="text-white">Irrecoverability:</strong> Because Docuvate operates client-side and the Developer retains no copies of your files, any file loss or corruption that occurs during processing cannot be recovered by the Developer. You are solely responsible for maintaining full backups of all original files before using any Tool.</li>
              <li><strong className="text-white">Browser Crashes:</strong> Processing extremely large files or running multiple AI operations simultaneously may cause your browser tab to crash due to system memory exhaustion. The Developer accepts no liability for any loss of progress, partial processing, or data loss that may occur as a result of such crashes.</li>
              <li><strong className="text-white">Output File Integrity:</strong> The Developer does not guarantee that files output by Docuvate will be readable by, or compatible with, all third-party software applications, operating systems, or devices. In particular, PDF files produced or modified by Docuvate may not conform to all versions of the PDF specification and may render differently in different PDF viewers.</li>
            </ul>
            <p className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/40 text-amber-200">
              <strong>Critical Advisory:</strong> Always maintain a backup of your original files before processing them with any Tool. Docuvate operations may be irreversible. The Developer strongly recommends processing a test file before applying any Tool to important or unique documents.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">03.</span> Disclaimer for AI-Powered Tools
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Docuvate offers a suite of AI-powered tools including but not limited to: AI Background Removal, AI Image Upscale, AI Photo Editor, AI Blur, AI Meme Generator, AI Exam Photo Enhancer, and AI Watermark Image. These tools employ machine learning models running within the browser via TensorFlow.js and WebAssembly. The following disclaimers apply specifically to all AI-powered features:</p>

            <h3 className="text-lg font-semibold text-white mt-4">3.1 Accuracy and Reliability of AI Outputs</h3>
            <p>AI models are probabilistic systems. Their outputs are not deterministic and may vary across runs, browser versions, hardware configurations, and input file characteristics. The Developer makes no representation that AI-generated outputs are accurate, complete, aesthetically pleasing, or fit for any particular purpose. AI outputs should always be reviewed and approved by a qualified human professional before use in any consequential context.</p>

            <h3 className="text-lg font-semibold text-white mt-4">3.2 Bias and Fairness</h3>
            <p>AI models may reflect biases present in the training data used to create them. The Developer does not warrant that AI-powered tools are free from bias with respect to race, gender, age, body type, skin tone, cultural background, or any other characteristic. If you observe biased or discriminatory outputs from any AI tool, you are encouraged to report this to the Developer, but the Developer accepts no liability for harm arising from such outputs.</p>

            <h3 className="text-lg font-semibold text-white mt-4">3.3 AI Limitations and Failure Cases</h3>
            <p>AI tools may perform poorly or fail entirely in the following scenarios, among others:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Low-resolution or heavily compressed input images.</li>
              <li>Images with complex or intricate backgrounds (for background removal).</li>
              <li>Documents with unusual fonts, handwriting, or non-Latin scripts (for OCR).</li>
              <li>Images of historical or archival significance that contain artifacts.</li>
              <li>Devices with insufficient RAM or GPU acceleration capabilities.</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-4">3.4 Ethical Use of AI Tools</h3>
            <p>You agree to use all AI-powered tools in an ethical, lawful, and responsible manner. Specifically, you agree not to use AI tools to:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Create, enhance, or distribute non-consensual intimate images (deepfakes) of any individual.</li>
              <li>Manipulate images to defame, harass, impersonate, or harm any individual or group.</li>
              <li>Generate or enhance images that violate the rights, dignity, or privacy of any person.</li>
              <li>Create misleading or deceptive visual content for propaganda, misinformation, or fraud.</li>
            </ul>
            <p>The Developer accepts no liability for harms arising from unethical use of AI tools and reserves the right to disable or restrict any AI tool that is found to be systematically misused.</p>

            <h3 className="text-lg font-semibold text-white mt-4">3.5 Model Weights and Intellectual Property</h3>
            <p>The AI models used in Docuvate are sourced from open-source repositories and are used in accordance with their respective licenses. The Developer makes no representation regarding the origin of the training data used to develop these models and accepts no liability for any intellectual property claims arising from the use of AI-generated outputs.</p>
          </div>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">04.</span> Disclaimer for OCR (Optical Character Recognition) Tools
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>The OCR PDF tool and any other character-recognition features within Docuvate use the Tesseract.js library, which performs text recognition locally within your browser. The following specific disclaimers apply to OCR functionality:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong className="text-white">Recognition Accuracy:</strong> OCR accuracy varies significantly based on input image quality, font type, text size, language, page layout complexity, and the presence of handwriting or special characters. The Developer does not warrant any minimum accuracy level for OCR outputs.</li>
              <li><strong className="text-white">Language Support:</strong> While Tesseract.js supports over 100 languages, recognition quality varies considerably across languages. The Developer makes no warranty regarding OCR accuracy for any specific language.</li>
              <li><strong className="text-white">Legal and Regulatory Use:</strong> OCR-extracted text should not be used as the sole basis for legal filings, regulatory submissions, medical records, financial reporting, or other high-stakes applications without independent human verification. The Developer accepts no liability for decisions made based on OCR-extracted text.</li>
              <li><strong className="text-white">Sensitive Documents:</strong> If you process sensitive documents (such as medical records, legal contracts, financial statements, or government-issued identification) through the OCR tool, you do so at your own risk. The Developer accepts no liability for any exposure, misinterpretation, or misuse of content extracted from such documents.</li>
            </ul>
          </div>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">05.</span> Disclaimer for PDF Password Protection and Security Tools
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Docuvate provides PDF password protection (encryption) and PDF unlock (decryption) tools powered by the pdf-lib library. The following disclaimers apply specifically to these security-related tools:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong className="text-white">No Security Guarantee:</strong> The Developer does not warrant that PDF files protected using Docuvate&apos;s Protect tool provide any specific level of security or are resistant to all forms of unauthorized access. PDF encryption standards vary in strength and may be susceptible to cracking techniques.</li>
              <li><strong className="text-white">PDF Unlock Tool — User Responsibility:</strong> The PDF Unlock tool is provided solely for the purpose of helping users access their own legitimately owned, password-protected documents. It must not be used to circumvent password protection on documents you do not own or do not have authorization to access. Using this tool to gain unauthorized access to protected documents may constitute a criminal offence under applicable law, including but not limited to the Information Technology Act, 2000 (India), the Computer Fraud and Abuse Act (USA), and equivalent legislation in other jurisdictions.</li>
              <li><strong className="text-white">Encryption Compatibility:</strong> PDF files protected using Docuvate may not be compatible with all PDF readers or may render differently depending on the reader&apos;s support for the specific encryption standard applied. The Developer accepts no liability for compatibility issues arising from protected files.</li>
              <li><strong className="text-white">Key Management:</strong> The Developer does not store or have access to any passwords used to protect PDF files through Docuvate. If you lose the password for a file protected using the Protect tool, the Developer cannot assist in recovery. You are solely responsible for securely storing your passwords.</li>
            </ul>
          </div>
        </section>

        {/* Section 6 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">06.</span> Disclaimer for PDF Signature Tools
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Docuvate provides a PDF Sign tool that allows users to annotate PDF documents with handwritten, typed, or image-based signatures. The following critical disclaimers apply:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong className="text-white">Not a Legally Binding Electronic Signature:</strong> The signatures applied using Docuvate&apos;s Sign tool are graphical annotations added to the PDF. They do NOT constitute legally binding electronic signatures as defined by applicable e-signature legislation, including but not limited to the Information Technology Act, 2000 (India), the Electronic Signatures in Global and National Commerce Act (ESIGN) (USA), the Electronic Identification and Authentication Regulation (eIDAS) (EU), and equivalent statutes. For legally binding electronic signatures, please use a certified e-signature platform.</li>
              <li><strong className="text-white">No Signature Authentication:</strong> Docuvate does not verify the identity of the person applying a signature. The signature applied through this tool carries no cryptographic certificate, digital identity verification, timestamp authority, or non-repudiation guarantee.</li>
              <li><strong className="text-white">Professional and Legal Documents:</strong> You should not use Docuvate&apos;s Sign tool to sign contracts, deeds, affidavits, legal instruments, financial agreements, government forms, or any document where a legally binding signature is required. The Developer accepts no liability for any legal dispute arising from the use of graphical signatures applied via this tool.</li>
              <li><strong className="text-white">Third-Party Acceptance:</strong> The Developer makes no representation that signatures applied using Docuvate will be accepted by courts, government agencies, financial institutions, employers, or other third parties as valid or authentic signatures.</li>
            </ul>
          </div>
        </section>

        {/* Section 7 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">07.</span> Disclaimer for Comparison, Redaction, and Sensitive Document Tools
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Docuvate offers tools including PDF Compare and PDF Redact that may be used in workflows involving sensitive, confidential, or legally privileged information. The following disclaimers apply:</p>

            <h3 className="text-lg font-semibold text-white mt-4">7.1 PDF Redact Tool</h3>
            <p>The PDF Redact tool allows users to visually obscure or black out portions of a PDF document. The following limitations and disclaimers apply:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>The redaction tool applies a visual overlay to specified areas of the PDF. Depending on the nature of the original PDF (e.g., whether it is text-based or image-based), the underlying text data may or may not be fully removed from the file&apos;s internal structure.</li>
              <li>For documents where it is legally or contractually required that underlying data be completely and irrecoverably removed (e.g., legal discovery documents, court filings, classified information), the Developer strongly recommends using a certified, specialized redaction tool rather than Docuvate&apos;s browser-based implementation.</li>
              <li>The Developer accepts no liability for any inadvertent disclosure of redacted content arising from the technical limitations of browser-based PDF redaction.</li>
            </ul>

            <h3 className="text-lg font-semibold text-white mt-4">7.2 PDF Compare Tool</h3>
            <p>The PDF Compare tool performs a visual or textual comparison between two PDF documents to highlight differences. The Developer does not warrant that this tool will identify all differences between documents, particularly in complex layouts, multi-column text, or documents with embedded images. The PDF Compare tool should not be used as the sole method of verifying document integrity in legal, financial, or regulatory contexts.</p>
          </div>
        </section>

        {/* Section 8 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">08.</span> Disclaimer Regarding Third-Party Content and External Links
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Docuvate may contain references, hyperlinks, or integrations involving third-party content, services, or websites. The Developer expressly disclaims all responsibility for such third-party content, including but not limited to:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong className="text-white">Accuracy of Third-Party Content:</strong> The Developer does not verify the accuracy, reliability, or completeness of any content available on third-party websites linked from Docuvate. Any reliance on such third-party content is at your own risk.</li>
              <li><strong className="text-white">Third-Party Privacy Practices:</strong> The Developer has no control over the privacy practices of third-party websites and expressly disclaims all responsibility for their data collection, use, or sharing practices.</li>
              <li><strong className="text-white">Third-Party Open-Source Libraries:</strong> Docuvate uses several third-party open-source libraries. While the Developer takes reasonable care to select reliable, well-maintained libraries, the Developer makes no warranty regarding the security, correctness, or continued availability of such libraries. In the event a third-party library introduces a security vulnerability, the Developer will endeavor to address it promptly but accepts no liability for harms occurring before a patch is applied.</li>
              <li><strong className="text-white">Availability of External Resources:</strong> Some AI tools within Docuvate may download model weights or other assets from external CDN sources (such as the npm CDN or Hugging Face Hub) during use. The Developer does not control the availability or integrity of these external resources and accepts no liability for failures arising from the unavailability of such resources.</li>
            </ul>
          </div>
        </section>

        {/* Section 9 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">09.</span> Disclaimer of Professional Advice
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Nothing on Docuvate constitutes legal advice, financial advice, medical advice, tax advice, regulatory compliance guidance, or any other form of professional advice. The information and tools provided are for general informational and productivity purposes only. Specifically:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong className="text-white">Legal Documents:</strong> Docuvate&apos;s tools should not be relied upon for preparing, reviewing, or certifying legal documents. Always consult a qualified legal professional for legal matters.</li>
              <li><strong className="text-white">Medical Records:</strong> Docuvate&apos;s tools should not be used to alter, obscure, or reproduce medical records in ways that could compromise the accuracy or integrity of those records. Always work with qualified healthcare professionals and comply with applicable health information laws (e.g., HIPAA, DPDP Act).</li>
              <li><strong className="text-white">Financial Documents:</strong> Docuvate&apos;s tools should not be used to alter financial statements, invoices, tax documents, or audit records in any manner that could constitute financial fraud or misrepresentation.</li>
              <li><strong className="text-white">Regulatory Compliance:</strong> Docuvate does not guarantee that files produced by its Tools will comply with any specific regulatory standard, including PDF/A archival standards, ISO 19005 compliance, WCAG accessibility standards, or any other sector-specific file format requirement. Always verify compliance with a certified compliance tool before submitting documents to regulatory authorities.</li>
            </ul>
          </div>
        </section>

        {/* Section 10 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">10.</span> Disclaimer of No Endorsement
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>The mention of any third-party software, service, platform, company, brand, or product on Docuvate does not constitute the Developer&apos;s endorsement, recommendation, or sponsorship of that third party. References to alternative tools (such as iLovePDF, Smallpdf, Adobe Acrobat, or other competitors) are made purely for informational and SEO comparison purposes and do not imply any partnership, affiliation, or competitive claim beyond those stated on the relevant page.</p>
            <p>Docuvate is an independent project and is not affiliated with, endorsed by, or otherwise connected to GitHub Inc., Microsoft Corporation, Adobe Inc., Google LLC, or any other major technology company, unless explicitly stated otherwise on the Website.</p>
          </div>
        </section>

        {/* Section 11 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">11.</span> Disclaimer Regarding Performance on Different Devices
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>Docuvate&apos;s client-side architecture means that its performance is entirely dependent on the hardware and software configuration of your device. The Developer expressly disclaims liability for:</p>
            <ul className="list-disc pl-6 space-y-3">
              <li><strong className="text-white">Processing Failures on Low-End Devices:</strong> On devices with limited RAM, older CPUs, or no GPU acceleration, some Tools — particularly AI-powered ones — may fail to complete, take an excessively long time, or cause the browser to become unresponsive. The Developer accepts no liability for time lost, data lost, or productivity impact arising from such performance limitations.</li>
              <li><strong className="text-white">Mobile Device Limitations:</strong> While Docuvate is designed to be responsive on mobile devices, AI-intensive operations are not recommended on smartphones or tablets due to significant memory and processing constraints. The Developer accepts no liability for device overheating, battery drain, or instability caused by running intensive operations on mobile hardware.</li>
              <li><strong className="text-white">Browser Compatibility:</strong> Docuvate targets modern, standards-compliant browsers. Features may not be available or may behave incorrectly in older browsers, non-standard browsers, or browsers with JavaScript or WebAssembly disabled. The Developer accepts no liability for loss of functionality due to browser incompatibility.</li>
            </ul>
          </div>
        </section>

        {/* Section 12 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">12.</span> Disclaimer of Liability for Consequential Damages
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE DEVELOPER, RAJ KISHOR MAHAPATRA, SHALL NOT BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, EXEMPLARY, OR PUNITIVE DAMAGES OF ANY KIND ARISING OUT OF OR RELATED TO YOUR USE OF, OR INABILITY TO USE, DOCUVATE OR ANY OF ITS TOOLS OR OUTPUTS, EVEN IF THE DEVELOPER HAS BEEN ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.</p>
            <p>This exclusion covers, without limitation, all damages arising from:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Loss of revenue, profits, business, contracts, or anticipated savings.</li>
              <li>Loss or corruption of data, documents, or files.</li>
              <li>Business interruption or productivity loss.</li>
              <li>Reputational harm arising from tool outputs.</li>
              <li>Legal liability incurred by you as a result of using tool outputs in legal, financial, or other professional contexts.</li>
              <li>Personal injury or property damage arising from your use of Docuvate.</li>
              <li>Costs of replacement tools, services, or personnel.</li>
              <li>Any claim by a third party arising from your use of Docuvate or its outputs.</li>
            </ul>
            <p>In jurisdictions that do not allow the exclusion or limitation of certain categories of damages, the Developer&apos;s liability in such jurisdictions shall be limited to the maximum extent permitted by the applicable law of that jurisdiction. Because Docuvate is provided free of charge, the maximum aggregate liability of the Developer shall in no event exceed zero Indian Rupees (INR ₹0).</p>
          </div>
        </section>

        {/* Section 13 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">13.</span> Changes to This Disclaimer
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>The Developer reserves the right to update, amend, or revise this Disclaimer at any time without prior notice. The &quot;Last Updated&quot; date at the top of this page will reflect the most recent revision. Changes become effective immediately upon being posted to this page.</p>
            <p>It is your responsibility to review this Disclaimer periodically. Your continued use of Docuvate following the posting of any revised Disclaimer constitutes your acceptance of those revisions. If you do not accept the revised Disclaimer, you must immediately discontinue your use of Docuvate.</p>
            <p>In the event of a material change to this Disclaimer that significantly alters your rights or the Developer&apos;s liabilities, the Developer may — but is not obligated to — provide notice on the Website&apos;s homepage or in the repository&apos;s change log.</p>
          </div>
        </section>

        {/* Section 14 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">14.</span> Governing Law
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>This Disclaimer shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions. Any dispute arising out of or relating to this Disclaimer shall be subject to the exclusive jurisdiction of the courts located in Odisha, India.</p>
            <p>If any clause or provision of this Disclaimer is found by any court of competent jurisdiction to be invalid, unlawful, or unenforceable, such clause shall be amended or severed to the minimum extent necessary so that this Disclaimer otherwise remains in full force and effect.</p>
          </div>
        </section>

        {/* Section 15 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">15.</span> Summary of Key Disclaimers
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>For clarity, the following is a summary of the most important disclaimers in this document. This summary is not exhaustive and does not replace the full text above:</p>
            <div className="grid gap-4 mt-4">
              {[
                { title: 'No File Storage', body: 'Your files are never uploaded to any server. Docuvate processes everything locally. The Developer has zero access to your files.' },
                { title: 'No Warranty', body: 'All tools are provided "as is." No warranty of accuracy, fitness, or merchantability is made.' },
                { title: 'No Liability for Data Loss', body: 'The Developer accepts no liability for any file loss, data corruption, or processing errors.' },
                { title: 'AI Output Limitations', body: 'AI-generated outputs are probabilistic and may be inaccurate or biased. Always verify AI outputs before use.' },
                { title: 'Signatures Not Legally Binding', body: 'Graphical signatures applied via the Sign tool do not constitute legally binding electronic signatures.' },
                { title: 'Not Professional Advice', body: 'Nothing on Docuvate constitutes legal, medical, financial, or other professional advice.' },
                { title: 'Backup Your Files', body: 'Always maintain backups of original files before processing. Tool operations may be irreversible.' },
                { title: 'User Responsibility', body: 'You are fully responsible for the legality, ownership, and appropriateness of the files you process.' },
              ].map((item, i) => (
                <div key={i} className="bg-slate-800/40 rounded-xl p-5 border border-slate-700/40 flex gap-4">
                  <div className="text-orange-400 font-bold min-w-fit">{String(i + 1).padStart(2, '0')}.</div>
                  <div>
                    <p className="text-white font-semibold mb-1">{item.title}</p>
                    <p className="text-slate-300 text-sm">{item.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Section 16 */}
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
            <span className="text-orange-400">16.</span> Contact Information
          </h2>
          <div className="space-y-4 text-slate-300 leading-relaxed">
            <p>If you have any questions or concerns regarding this Disclaimer, or if you wish to report a tool producing harmful or erroneous output, please contact the Developer:</p>
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
          <p className="text-slate-400 text-sm">Last updated: <strong className="text-slate-300">July 19, 2026</strong>. By using Docuvate, you confirm that you have read, understood, and accept this Disclaimer in its entirety.</p>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            <Link href="/" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">← Back to Home</Link>
            <Link href="/terms/" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">View Terms & Conditions →</Link>
          </div>
        </div>

      </div>
    </div>
  )
}
