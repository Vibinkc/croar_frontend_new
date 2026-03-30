"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export default function TermsPage() {
    return (
        <div className="font-sans bg-[#f6f5f8] text-[#0d0e1b] min-h-screen flex flex-col transition-colors duration-300">
            <Header />
            <main className="w-full flex-grow max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-black mb-8">Terms and Conditions</h1>
                <div className="prose dark:prose-invert max-w-none text-slate-600">
                    <p className="mb-4">Last updated: January 28, 2026</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-[#0d0e1b]">1. Introduction</h2>
                    <p className="mb-4">
                        Welcome to Academik.ai. These Terms and Conditions govern your use of our website and services.
                        By accessing or using our platform, you agree to be bound by these terms. Disagreeing with any of these terms prohibits you from using our services.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-[#0d0e1b]">2. Intellectual Property</h2>
                    <p className="mb-4">
                        The content, features, and functionality of Academik.ai, including but not limited to text, graphics, logos, and software, are the exclusive property of Academik.ai and are protected by international copyright and trademark laws.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-[#0d0e1b]">3. User Responsibilities</h2>
                    <p className="mb-4">
                        You agree to use our platform only for lawful purposes. You must not use our service to transmit any unsolicited or unauthorized advertising, or to engage in any conduct that restricts or inhibits anyone's use or enjoyment of the platform.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-[#0d0e1b]">4. Modification of Terms</h2>
                    <p className="mb-4">
                        We reserve the right to modify these terms at any time. We will notify users of any significant changes. Your continued use of the platform after such changes constitutes your acceptance of the new terms.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-[#0d0e1b]">5. Contact Us</h2>
                    <p className="mb-4">
                        If you have any questions about these Terms, please contact us at support@academik.ai.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
