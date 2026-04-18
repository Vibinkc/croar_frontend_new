"use client";

import Header from "@/components/landing/Header";
import Footer from "@/components/landing/Footer";

export default function AboutPage() {
    return (
        <div className="font-sans bg-[#f6f6f8] text-[#0d0e1b] min-h-screen flex flex-col transition-colors duration-300">
            <Header />
            <main className="w-full flex-grow">
                {/* 1. Hero Section */}
                <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 z-0">
                        <div className="absolute inset-0 bg-[#6366F1]/80 mix-blend-multiply"></div>
                        <img className="w-full h-full object-cover" alt="Collaborative team working in modern bright office" src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" />
                    </div>
                    <div className="relative z-10 text-center px-4 max-w-4xl">
                        <h1 className="text-white text-5xl md:text-7xl font-black mb-6 leading-tight tracking-tight">
                            Empowering the Next Generation of Talent
                        </h1>
                        <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                            Revolutionizing talent assessment with equity-driven technology and data-backed insights for a fairer future of work.
                        </p>
                    </div>
                </section>

                {/* 2. Mission & Vision */}
                <section className="py-24 px-6 lg:px-40 bg-white">
                    <div className="max-w-[1200px] mx-auto grid md:grid-cols-2 gap-16 items-center">
                        <div>
                            <span className="text-[#6366F1] font-bold   text-sm">Our Purpose</span>
                            <h2 className="text-4xl md:text-5xl font-black mt-4 mb-8 leading-tight">The 'Why' Behind the Platform</h2>
                            <p className="text-lg text-slate-600 leading-relaxed mb-6">
                                We believe that talent is universal, but opportunity is not. Our platform was born from a desire to bridge this gap, using advanced integrative AI to remove the filters of bias and pedigree.
                            </p>
                            <p className="text-lg text-slate-600 leading-relaxed">
                                By focusing on objective skills and potential, we help organizations build more diverse, capable, and resilient workforces while giving candidates the fair shot they deserve.
                            </p>
                        </div>
                        <div className="grid gap-6">
                            <div className="p-8 rounded-xl border border-slate-100 bg-[#f6f6f8]">
                                <span className="material-icons text-[#6366F1] text-4xl mb-4">rocket_launch</span>
                                <h3 className="text-2xl font-bold mb-3">Our Mission</h3>
                                <p className="text-slate-600">To democratize the hiring process by providing objective, skill-based assessments that prioritize raw talent over credentials.</p>
                            </div>
                            <div className="p-8 rounded-xl border border-slate-100 bg-[#f6f6f8]">
                                <span className="material-icons text-[#8B5CF6] text-4xl mb-4">visibility</span>
                                <h3 className="text-2xl font-bold mb-3">Our Vision</h3>
                                <p className="text-slate-600">To become the global standard for equitable talent evaluation, fostering diversity in every workforce worldwide.</p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 3. Our Journey (Timeline) */}
                <section className="py-24 px-6 lg:px-40 bg-[#f6f6f8]">
                    <div className="max-w-[960px] mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black mb-4">Our Journey</h2>
                            <p className="text-slate-600">Milestones that defined our path to global leadership.</p>
                        </div>
                        <div className="relative">
                            {/* Vertical Line */}
                            <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-px bg-slate-200 hidden md:block"></div>
                            <div className="space-y-12">
                                {/* Event 1 */}
                                <div className="flex flex-col md:flex-row items-center justify-between w-full">
                                    <div className="w-full md:w-[45%] text-right hidden md:block">
                                        <h4 className="text-xl font-bold">The Idea</h4>
                                        <p className="text-slate-500">2018 - Founded in a small garage in San Francisco.</p>
                                    </div>
                                    <div className="z-10 bg-[#6467f2] text-white p-2 rounded-full hidden md:block">
                                        <span className="material-icons">lightbulb</span>
                                    </div>
                                    <div className="w-full md:w-[45%] bg-white p-6 rounded-xl border border-slate-100 shadow-sm md:shadow-none">
                                        <h4 className="text-xl font-bold md:hidden">The Idea (2018)</h4>
                                        <p className="text-slate-600">Our founders realized the traditional resume was broken and decided to build a data-driven alternative.</p>
                                    </div>
                                </div>
                                {/* Event 2 */}
                                <div className="flex flex-col md:flex-row items-center justify-between w-full">
                                    <div className="w-full md:w-[45%] bg-white p-6 rounded-xl border border-slate-100">
                                        <h4 className="text-xl font-bold md:hidden">Series A (2020)</h4>
                                        <p className="text-slate-600 text-right">Secured $15M in funding and reached the milestone of 1 million assessments delivered globally.</p>
                                    </div>
                                    <div className="z-10 bg-[#8B5CF6] text-white p-2 rounded-full hidden md:block">
                                        <span className="material-icons">trending_up</span>
                                    </div>
                                    <div className="w-full md:w-[45%] text-left hidden md:block">
                                        <h4 className="text-xl font-bold">Scaling Up</h4>
                                        <p className="text-slate-500">2020 - First major growth spurt.</p>
                                    </div>
                                </div>
                                {/* Event 3 */}
                                <div className="flex flex-col md:flex-row items-center justify-between w-full">
                                    <div className="w-full md:w-[45%] text-right hidden md:block">
                                        <h4 className="text-xl font-bold">Global Expansion</h4>
                                        <p className="text-slate-500">2022 - Offices in London and Singapore.</p>
                                    </div>
                                    <div className="z-10 bg-[#6366F1] text-white p-2 rounded-full hidden md:block">
                                        <span className="material-icons">public</span>
                                    </div>
                                    <div className="w-full md:w-[45%] bg-white p-6 rounded-xl border border-slate-100">
                                        <h4 className="text-xl font-bold md:hidden">Going Global (2022)</h4>
                                        <p className="text-slate-600">Expanded our operations to three continents, supporting assessments in over 20 languages.</p>
                                    </div>
                                </div>
                                {/* Event 4 */}
                                <div className="flex flex-col md:flex-row items-center justify-between w-full">
                                    <div className="w-full md:w-[45%] bg-white p-6 rounded-xl border border-slate-100">
                                        <p className="text-slate-600 text-right">Launched our proprietary Bias-Free AI engine, setting a new industry benchmark for equity.</p>
                                    </div>
                                    <div className="z-10 bg-[#FFD300] text-[#101122] p-2 rounded-full hidden md:block">
                                        <span className="material-icons">psychology</span>
                                    </div>
                                    <div className="w-full md:w-[45%] text-left hidden md:block">
                                        <h4 className="text-xl font-bold">The AI Revolution</h4>
                                        <p className="text-slate-500">2024 - Leading the bias-free era.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. Core Values */}
                <section className="py-24 px-6 lg:px-40 bg-white">
                    <div className="max-w-[1200px] mx-auto text-center mb-16">
                        <h2 className="text-4xl font-black mb-4">Core Values</h2>
                        <p className="text-slate-600">The principles that guide every decision we make.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1200px] mx-auto">
                        {[
                            { icon: 'memory', title: 'Integrative AI', desc: 'Harnessing AI to augment human potential, not replace it.' },
                            { icon: 'shield_person', title: 'Bias-Free', desc: 'Removing systemic barriers in recruitment through science.' },
                            { icon: 'groups', title: 'Customer Obsessed', desc: 'Building for our users first, always listening and adapting.' },
                            { icon: 'lock_open', title: 'Radical Transparency', desc: 'Open communication in everything we do, from code to culture.' },
                            { icon: 'database', title: 'Data Integrity', desc: 'Ensuring the highest security standards and ethical data usage.' },
                            { icon: 'emoji_objects', title: 'Continuous Innovation', desc: 'Never settling for the status quo; always pushing boundaries.' }
                        ].map((value, i) => (
                            <div key={i} className="p-8 rounded-xl bg-[#f6f6f8] border border-slate-100 transition-transform hover:-translate-y-2">
                                <span className="material-icons text-[#8B5CF6] text-4xl mb-4">{value.icon}</span>
                                <h3 className="text-xl font-bold mb-3">{value.title}</h3>
                                <p className="text-sm text-slate-600">{value.desc}</p>
                            </div>
                        ))}
                    </div>
                </section>


                {/* 7. Our Culture */}
                <section className="py-24 px-6 lg:px-40 bg-white">
                    <div className="max-w-[1200px] mx-auto">
                        <div className="flex flex-col md:flex-row justify-between items-end mb-12">
                            <div>
                                <h2 className="text-4xl font-black mb-4">Life at Academik</h2>
                                <p className="text-slate-600">Where collaboration meets innovation every day.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 auto-rows-[200px]">
                            <div className="col-span-2 row-span-2 rounded-xl overflow-hidden">
                                <img className="w-full h-full object-cover" alt="Team collaborating in a bright open office space" src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" />
                            </div>
                            <div className="rounded-xl overflow-hidden">
                                <img className="w-full h-full object-cover" alt="Modern conference room with team discussion" src="https://images.unsplash.com/photo-1542744173-8e7e53415bb0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" />
                            </div>
                            <div className="rounded-xl overflow-hidden">
                                <img className="w-full h-full object-cover" alt="Students or interns working together on laptops" src="https://images.unsplash.com/photo-1531482615713-2afd69097998?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" />
                            </div>
                            <div className="col-span-2 rounded-xl overflow-hidden">
                                <img className="w-full h-full object-cover" alt="Colleagues laughing during a coffee break" src="https://images.unsplash.com/photo-1600880292203-757bb62b4baf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" />
                            </div>
                        </div>
                    </div>
                </section>

                {/* 10. Final CTA */}
                <section className="py-24 px-6 lg:px-40 bg-white text-center">
                    <div className="max-w-[800px] mx-auto">
                        <h2 className="text-5xl font-black mb-6">Join Our Mission</h2>
                        <p className="text-xl text-slate-600 mb-10 leading-relaxed">
                            Whether you're looking for your next career move or a partner to transform your hiring, we're building the future together.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="bg-[#6366F1] hover:bg-[#6366F1]/90 text-white font-black px-10 py-4 rounded-xl text-lg shadow-xl shadow-[#6366F1]/20 transition-all transform hover:scale-105">View Careers</button>
                            <button className="bg-[#FFD300] hover:bg-[#FFD300]/90 text-[#101122] font-black px-10 py-4 rounded-xl text-lg shadow-xl shadow-[#FFD300]/10 transition-all transform hover:scale-105">Partner With Us</button>
                        </div>
                    </div>
                </section>
            </main>
            <Footer />
        </div>
    );
}
