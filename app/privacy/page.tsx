import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function PrivacyPolicy() {
  return (
    <div className="relative">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:px-8">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Privacy Policy
          </h1>
          <p className="text-lg text-muted-foreground mt-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">1. Information We Collect</h2>
            <p>
              We collect information you provide directly to us, such as when you create an account, use our services, or contact us for support.
            </p>
            
            <h3 className="text-xl font-semibold mt-6">Personal Information</h3>
            <ul className="list-disc pl-6 mt-2">
              <li>Name and email address</li>
              <li>Social media account information and access tokens</li>
              <li>Content you post through our service</li>
              <li>Payment information (processed securely through third-party providers)</li>
            </ul>

            <h3 className="text-xl font-semibold mt-6">Usage Information</h3>
            <ul className="list-disc pl-6 mt-2">
              <li>Log data including IP addresses, browser type, and operating system</li>
              <li>Device information and identifiers</li>
              <li>Usage patterns and interactions with our service</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Provide, maintain, and improve our service</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices, updates, and support messages</li>
              <li>Respond to your comments, questions, and customer service requests</li>
              <li>Monitor and analyze trends, usage, and activities</li>
              <li>Detect, investigate, and prevent fraudulent transactions and abuse</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">3. Information Sharing</h2>
            <p>
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy.
            </p>
            
            <h3 className="text-xl font-semibold mt-6">We may share information with:</h3>
            <ul className="list-disc pl-6 mt-2">
              <li>Social media platforms where you choose to post content</li>
              <li>Service providers who assist in our operations</li>
              <li>Legal authorities when required by law</li>
              <li>Other parties with your explicit consent</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">4. Data Security</h2>
            <p>
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over the internet is 100% secure.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">5. Social Media Integration</h2>
            <p>
              Our service integrates with various social media platforms. When you connect your social media accounts, we may access and store your profile information, friend lists, and posting permissions as authorized by you. We only access the minimum permissions necessary to provide our service.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">6. Data Retention</h2>
            <p>
              We retain your personal information for as long as necessary to provide our service and fulfill the purposes outlined in this policy, unless a longer retention period is required by law. When you delete your account, we will delete your personal information, though some information may be retained for legal or security purposes.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">7. Your Rights</h2>
            <p>Depending on your location, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Access and receive a copy of your personal information</li>
              <li>Rectify inaccurate personal information</li>
              <li>Delete your personal information</li>
              <li>Restrict or object to processing of your personal information</li>
              <li>Data portability</li>
              <li>Withdraw consent at any time</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">8. Cookies and Tracking</h2>
            <p>
              We use cookies and similar tracking technologies to collect and track information about your use of our service. You can set your browser to refuse cookies, but this may limit your ability to use some features of our service.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">9. Third-Party Services</h2>
            <p>
              Our service may contain links to third-party websites or services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies before providing any personal information.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">10. Children's Privacy</h2>
            <p>
              Our service is not intended for children under 13 years of age. We do not knowingly collect personal information from children under 13. If you become aware that a child has provided us with personal information, please contact us.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">11. International Data Transfers</h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. We ensure that such transfers comply with applicable data protection laws and provide appropriate safeguards.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">12. Changes to This Policy</h2>
            <p>
              We may update this privacy policy from time to time. We will notify you of any changes by posting the new policy on this page and updating the "Last updated" date. Your continued use of our service constitutes acceptance of the updated policy.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">13. Contact Us</h2>
            <p>
              If you have any questions about this Privacy Policy, please contact us at:
            </p>
            <ul className="list-none mt-2">
              <li>Email: privacy@crosspostr.com</li>
              <li>Address: [Your Business Address]</li>
            </ul>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}