"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export default function PrivacyPage() {
    return (
        <div className="font-sans bg-[#f6f5f8] text-[#0d0e1b] min-h-screen flex flex-col transition-colors duration-300">
            <Header />
            <main className="w-full flex-grow max-w-4xl mx-auto px-6 py-12">
                <h1 className="text-4xl font-black mb-8">Privacy Policy</h1>
                <div className="prose dark:prose-invert max-w-none text-slate-600">
                    <p className="mb-4">Last updated: January 28, 2026</p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-[#0d0e1b]">1. Information Collection</h2>
                    <p className="mb-4">
                        We collect information you provide directly to us, such as when you create an account, subscribe to our newsletter, or contact customer support. This may include your name, email address, and other contact details.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-[#0d0e1b]">2. Use of Information</h2>
                    <p className="mb-4">
                        We use the information we collect to provider, maintain, and improve our services, to communicate with you, and to personalize your experience on our platform.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-[#0d0e1b]">3. Data Sharing</h2>
                    <p className="mb-4">
                        We do not share your personal information with third parties except as described in this policy, such as when necessary to provide our services or when required by law.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-[#0d0e1b]">4. Security</h2>
                    <p className="mb-4">
                        We take reasonable measures to help protect information about you from loss, theft, misuse and unauthorized access, disclosure, alteration and destruction.
                    </p>

                    <h2 className="text-2xl font-bold mt-8 mb-4 text-[#0d0e1b]">5. Your Rights</h2>
                    <p className="mb-4">
                        You have the right to access, correct, or delete your personal information. If you wish to exercise these rights, please contact us.
                    </p>
                </div>
            </main>
            <Footer />
        </div>
    );
}
