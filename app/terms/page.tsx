import { Header } from "@/components/landing/header";
import { Footer } from "@/components/landing/footer";

export default function TermsOfService() {
  return (
    <div className="relative">
      <Header />
      <main className="mx-auto max-w-4xl px-6 py-16 sm:py-24 lg:px-8">
        <div className="prose prose-gray dark:prose-invert max-w-none">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Terms of Service
          </h1>
          <p className="text-lg text-muted-foreground mt-4">
            Last updated: {new Date().toLocaleDateString()}
          </p>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Crosspostr, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">2. Description of Service</h2>
            <p>
              Crosspostr is a social media management platform that allows users to post content across multiple social media platforms simultaneously. We provide tools for content scheduling, cross-platform posting, and social media account management.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">3. User Accounts</h2>
            <p>
              To use our service, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">4. Content Policy</h2>
            <p>
              You retain ownership of the content you post through our service. However, you grant us a non-exclusive, royalty-free license to use, modify, and distribute your content for the purpose of providing our services. You are solely responsible for the content you post and must ensure it complies with all applicable laws and platform policies.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">5. Prohibited Uses</h2>
            <p>You may not use our service to:</p>
            <ul className="list-disc pl-6 mt-2">
              <li>Post spam, harassment, or abusive content</li>
              <li>Violate any third-party rights or platform terms of service</li>
              <li>Engage in illegal activities or promote harmful content</li>
              <li>Attempt to hack, disrupt, or damage our service</li>
              <li>Use automated tools to abuse our service</li>
            </ul>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">6. Service Availability</h2>
            <p>
              We strive to provide reliable service but cannot guarantee 100% uptime. We may temporarily suspend or restrict access to our service for maintenance, updates, or other operational reasons.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">7. Privacy</h2>
            <p>
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, use, and protect your information.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">8. Limitation of Liability</h2>
            <p>
              Crosspostr shall not be liable for any direct, indirect, incidental, special, consequential, or punitive damages resulting from your use of our service. Our total liability is limited to the amount you paid for our service in the 12 months preceding the claim.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">9. Termination</h2>
            <p>
              We may terminate or suspend your account at any time for violations of these terms or for any other reason. You may terminate your account at any time by contacting us.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">10. Changes to Terms</h2>
            <p>
              We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through our service. Continued use of our service after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">11. Governing Law</h2>
            <p>
              These terms are governed by the laws of the jurisdiction in which Crosspostr operates. Any disputes will be resolved in the courts of that jurisdiction.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-2xl font-bold">12. Contact Information</h2>
            <p>
              If you have any questions about these Terms of Service, please contact us at legal@crosspostr.com.
            </p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
}