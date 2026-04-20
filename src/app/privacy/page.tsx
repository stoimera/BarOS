"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useRouter } from "next/navigation"

export default function PrivacyPage() {
  const router = useRouter()

  return (
    <div className="space-y-6 max-w-4xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Privacy Policy & Terms of Service</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Last updated: {new Date().toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <Button onClick={() => router.back()} variant="outline">
          ← Back
        </Button>
      </div>

      {/* Privacy Policy */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Information We Collect</h2>
            <p className="text-sm text-foreground mb-2">
              We collect information that you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground ml-4">
              <li>Personal identification information (name, email address, phone number, date of birth)</li>
              <li>Account credentials and authentication information</li>
              <li>Transaction and booking history</li>
              <li>Preferences and settings</li>
              <li>Communication preferences and marketing consent</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">2. How We Use Your Information</h2>
            <p className="text-sm text-foreground mb-2">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Process transactions and manage bookings</li>
              <li>Send you transactional communications and service updates</li>
              <li>Personalize your experience and provide customer support</li>
              <li>Comply with legal obligations and enforce our terms</li>
              <li>Send marketing communications (with your consent)</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Data Security</h2>
            <p className="text-sm text-foreground">
              We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction. This includes encryption of sensitive data, secure authentication methods, and regular security assessments.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">4. Data Retention</h2>
            <p className="text-sm text-foreground">
              We retain your personal information for as long as necessary to fulfill the purposes outlined in this policy, unless a longer retention period is required or permitted by law. When you delete your account, we will delete or anonymize your personal information in accordance with our data retention policies.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Your Rights (GDPR)</h2>
            <p className="text-sm text-foreground mb-2">
              If you are located in the European Economic Area (EEA), you have certain data protection rights:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground ml-4">
              <li><strong>Right to Access:</strong> Request copies of your personal data</li>
              <li><strong>Right to Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Right to Erasure:</strong> Request deletion of your personal data</li>
              <li><strong>Right to Restrict Processing:</strong> Request restriction of processing your data</li>
              <li><strong>Right to Data Portability:</strong> Request transfer of your data to another service</li>
              <li><strong>Right to Object:</strong> Object to processing of your personal data</li>
            </ul>
            <p className="text-sm text-foreground mt-2">
              To exercise access, portability, or erasure in the product, signed-in customers may use the self-service
              endpoints described in our technical documentation (for example, export and delete routes under
              <span className="font-mono"> /api/gdpr/</span>). You may also contact us through your profile settings or
              by emailing our support team.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">6. California residents (CCPA / CPRA)</h2>
            <p className="text-sm text-foreground mb-2">
              If you are a California resident, the California Consumer Privacy Act (CCPA), as amended by the
              California Privacy Rights Act (CPRA), may provide you with additional rights regarding personal
              information we collect. This section supplements the rest of this policy and applies only to California
              residents, to the extent those laws apply to our processing.
            </p>
            <p className="text-sm text-foreground mb-2">
              Depending on your relationship with us and the nature of the data, you may have the right to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground ml-4">
              <li>Know the categories and specific pieces of personal information we collect, use, disclose, and retain</li>
              <li>Request deletion of personal information, subject to legal exceptions</li>
              <li>Correct inaccurate personal information</li>
              <li>Opt out of the &quot;sale&quot; or &quot;sharing&quot; of personal information for cross-context behavioral advertising, where applicable</li>
              <li>Limit the use of certain sensitive personal information, where applicable</li>
              <li>Not receive discriminatory treatment for exercising these rights</li>
            </ul>
            <p className="text-sm text-foreground mt-2 mb-2">
              We do not sell personal information for money. Where our activities could constitute &quot;sharing&quot; under
              CPRA (for example, certain analytics or advertising integrations), you may submit an opt-out preference
              through the in-app California preferences control, which updates the flags stored on your customer record.
            </p>
            <p className="text-sm text-foreground">
              To submit requests or ask questions, use the same contact channels as in Section 11 (Contact Us). We will
              verify your request to a reasonable degree in line with applicable law.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Cookies and Tracking</h2>
            <p className="text-sm text-foreground">
              We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or to indicate when a cookie is being sent. However, if you do not accept cookies, you may not be able to use some portions of our service.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Third-Party Services</h2>
            <p className="text-sm text-foreground">
              Our service may contain links to third-party websites or services that are not owned or controlled by us. We have no control over, and assume no responsibility for, the privacy policies or practices of any third-party services. We encourage you to review the privacy policy of any third-party service you access.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Children&apos;s Privacy</h2>
            <p className="text-sm text-foreground">
              Our service is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">10. Changes to This Policy</h2>
            <p className="text-sm text-foreground">
              We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last updated&quot; date. You are advised to review this Privacy Policy periodically for any changes.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">11. Contact Us</h2>
            <p className="text-sm text-foreground">
              If you have any questions about this Privacy Policy, please contact us through your profile settings or reach out to our support team.
            </p>
          </section>
        </CardContent>
      </Card>

      {/* Terms of Service */}
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="text-xl">Terms of Service</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <section>
            <h2 className="text-lg font-semibold mb-2">1. Acceptance of Terms</h2>
            <p className="text-sm text-foreground">
              By accessing and using this service, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">2. Use License</h2>
            <p className="text-sm text-foreground mb-2">
              Permission is granted to temporarily use this service for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground ml-4">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to reverse engineer any software contained in the service</li>
              <li>Remove any copyright or other proprietary notations from the materials</li>
              <li>Transfer the materials to another person or &quot;mirror&quot; the materials on any other server</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">3. Account Registration</h2>
            <p className="text-sm text-foreground mb-2">
              To access certain features of the service, you must register for an account. When you register, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground ml-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and identification</li>
              <li>Accept all responsibility for activities that occur under your account</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">4. User Conduct</h2>
            <p className="text-sm text-foreground mb-2">
              You agree not to use the service to:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground ml-4">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe upon the rights of others</li>
              <li>Transmit any harmful, offensive, or illegal content</li>
              <li>Interfere with or disrupt the service or servers</li>
              <li>Attempt to gain unauthorized access to any portion of the service</li>
              <li>Impersonate any person or entity or misrepresent your affiliation</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">5. Bookings and Reservations</h2>
            <p className="text-sm text-foreground mb-2">
              When making a booking or reservation through our service:
            </p>
            <ul className="list-disc list-inside space-y-1 text-sm text-foreground ml-4">
              <li>You are responsible for providing accurate booking information</li>
              <li>Cancellation policies apply as specified at the time of booking</li>
              <li>We reserve the right to refuse or cancel bookings at our discretion</li>
              <li>No-shows may be subject to fees or restrictions on future bookings</li>
            </ul>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">6. Payment Terms</h2>
            <p className="text-sm text-foreground">
              All payments are processed securely through our payment partners. By making a payment, you agree to the terms and conditions of our payment processors. Refunds are subject to our refund policy and applicable laws.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">7. Intellectual Property</h2>
            <p className="text-sm text-foreground">
              The service and its original content, features, and functionality are and will remain the exclusive property of the service provider and its licensors. The service is protected by copyright, trademark, and other laws.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">8. Limitation of Liability</h2>
            <p className="text-sm text-foreground">
              In no event shall the service provider, nor its directors, employees, partners, agents, suppliers, or affiliates, be liable for any indirect, incidental, special, consequential, or punitive damages, including without limitation, loss of profits, data, use, goodwill, or other intangible losses, resulting from your use of the service.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">9. Indemnification</h2>
            <p className="text-sm text-foreground">
              You agree to defend, indemnify, and hold harmless the service provider and its licensee and licensors, and their employees, contractors, agents, officers and directors, from and against any and all claims, damages, obligations, losses, liabilities, costs or debt, and expenses (including but not limited to attorney&apos;s fees).
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">10. Termination</h2>
            <p className="text-sm text-foreground">
              We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, for any reason whatsoever, including without limitation if you breach the Terms. Upon termination, your right to use the service will immediately cease.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">11. Governing Law</h2>
            <p className="text-sm text-foreground">
              These Terms shall be interpreted and governed by the laws of the jurisdiction in which the service provider operates, without regard to its conflict of law provisions.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">12. Changes to Terms</h2>
            <p className="text-sm text-foreground">
              We reserve the right, at our sole discretion, to modify or replace these Terms at any time. If a revision is material, we will provide at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be determined at our sole discretion.
            </p>
          </section>

          <Separator />

          <section>
            <h2 className="text-lg font-semibold mb-2">13. Contact Information</h2>
            <p className="text-sm text-foreground">
              If you have any questions about these Terms of Service, please contact us through your profile settings or reach out to our support team.
            </p>
          </section>
        </CardContent>
      </Card>
    </div>
  )
}

