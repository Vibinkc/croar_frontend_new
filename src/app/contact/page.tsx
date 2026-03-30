"use client";

import { useState } from "react";

import { motion } from "framer-motion";
import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export default function ContactPage() {
    const [isSubmitted, setIsSubmitted] = useState(false);

    return (
        <div className="font-sans bg-[#f6f5f8] text-[#110d1c] min-h-screen flex flex-col">
            <Header />
            <main className="max-w-[1280px] mx-auto px-6 py-12 flex-grow w-full">
                {/* Hero Section */}
                <div className="mb-16">
                    <div className="relative overflow-hidden rounded-xl bg-[#686bed]/10 p-8 md:p-16 border border-[#686bed]/20">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6 }}
                                className="flex-1 text-center md:text-left"
                            >
                                <h1 className="text-4xl md:text-6xl font-black leading-tight mb-6 text-slate-900">
                                    Get in touch <span className="text-[#686bed]">with our team</span>
                                </h1>
                                <p className="text-lg opacity-80 max-w-xl mb-8 text-slate-600">
                                    Whether you have a question about features, pricing, or need a custom demo for your talent acquisition needs, our team is ready to answer all your questions.
                                </p>
                            </motion.div>
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="hidden lg:block w-1/3"
                            >
                                {/* Hidden iframe for handling Zoho form submission without redirection */}
                                <iframe name="hidden_iframe" style={{ display: 'none' }}></iframe>

                                <div className="perspective-[1000px] w-full">
                                    <motion.div
                                        className="relative w-full"
                                        initial={false}
                                        animate={{ rotateY: isSubmitted ? 180 : 0 }}
                                        transition={{ duration: 0.6, type: "spring", stiffness: 260, damping: 20 }}
                                        style={{ transformStyle: "preserve-3d" }}
                                    >
                                        {/* Front Side: Form */}
                                        <div
                                            className="p-6 bg-white rounded-xl shadow-2xl border border-[#ebe7f4] w-full h-full relative z-10"
                                            style={{ backfaceVisibility: "hidden" }}
                                        >
                                            <h3 className="text-xl font-bold mb-4 text-slate-900">Send us a message</h3>
                                            <form
                                                action='https://forms.zohopublic.in/appxcesstechnologies1/form/ContactUs/formperma/hqr1ASGNg4lKPUyL0LU7EDZ0N9i52kOXrnRu_8ltpsM/htmlRecords/submit'
                                                name='form'
                                                method='POST'
                                                acceptCharset='UTF-8'
                                                encType='multipart/form-data'
                                                className="space-y-3 text-left"
                                                target="hidden_iframe"
                                                onSubmit={() => setTimeout(() => setIsSubmitted(true), 500)}
                                            >
                                                <input type="hidden" name="zf_referrer_name" value="" />
                                                <input type="hidden" name="zf_redirect_url" value="" />
                                                <input type="hidden" name="zc_gad" value="" />

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">First Name</label>
                                                        <input required className="w-full rounded-lg border-[#d6cee8] bg-slate-50 focus:border-[#686bed] focus:ring-[#686bed] h-9 px-3 outline-none text-sm" name="Name_First" placeholder="John" type="text" />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Last Name</label>
                                                        <input required className="w-full rounded-lg border-[#d6cee8] bg-slate-50 focus:border-[#686bed] focus:ring-[#686bed] h-9 px-3 outline-none text-sm" name="Name_Last" placeholder="Doe" type="text" />
                                                    </div>
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Email Address</label>
                                                    <input required className="w-full rounded-lg border-[#d6cee8] bg-slate-50 focus:border-[#686bed] focus:ring-[#686bed] h-9 px-3 outline-none text-sm" name="Email" placeholder="john@example.com" type="email" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Phone Number</label>
                                                    <input className="w-full rounded-lg border-[#d6cee8] bg-slate-50 focus:border-[#686bed] focus:ring-[#686bed] h-9 px-3 outline-none text-sm" name="PhoneNumber_countrycode" placeholder="+1 (555) 000-0000" type="text" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Subject</label>
                                                    <input className="w-full rounded-lg border-[#d6cee8] bg-slate-50 focus:border-[#686bed] focus:ring-[#686bed] h-9 px-3 outline-none text-sm" name="SingleLine" placeholder="How can we help?" type="text" />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1 block">Your Message</label>
                                                    <textarea required className="w-full rounded-lg border-[#d6cee8] bg-slate-50 focus:border-[#686bed] focus:ring-[#686bed] px-3 py-2 outline-none text-sm h-20 resize-none" name="MultiLine" placeholder="Tell us more..."></textarea>
                                                </div>
                                                <button className="w-full bg-[#686bed] text-white font-bold py-3 rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all text-sm">
                                                    Submit Message
                                                </button>
                                            </form>
                                        </div>

                                        {/* Back Side: Success Message */}
                                        <div
                                            className="absolute inset-0 w-full h-full bg-white rounded-xl shadow-2xl border border-[#ebe7f4] flex flex-col items-center justify-center p-8 text-center"
                                            style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                                        >
                                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
                                                <span className="material-icons text-green-600 text-3xl">check_circle</span>
                                            </div>
                                            <h3 className="text-2xl font-black text-slate-900 mb-2">Submitted Successfully!</h3>
                                            <p className="text-slate-600">
                                                Thank you for reaching out. Our team will review your message and call you shortly.
                                            </p>
                                        </div>
                                    </motion.div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>



            </main>
            <Footer />
        </div>
    );
}
