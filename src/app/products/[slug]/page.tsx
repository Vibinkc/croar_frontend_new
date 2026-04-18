"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface FeatureDetail {
    title: string;
    description: string;
    icon?: string;
}

interface CurriculumGroup {
    category: string;
    topics: string[];
}

interface ProductDetail {
    title: string;
    subtitle: string;
    heroIcon: string;
    longDescription: string;
    features: FeatureDetail[];
    curriculum?: CurriculumGroup[];
    howItWorks: { step: string; detail: string }[];
    practicePath: string;
    stats?: { label: string; value: string }[];
}

const productData: Record<string, ProductDetail> = {
    "aptitude": {
        title: "Aptitude Mission Hub",
        subtitle: "Master the foundation with AI-driven topic missions and real-time skill tracking.",
        heroIcon: "calculate",
        longDescription: "The Aptitude module is built on a mission-based framework. Every topic—from Number Systems to Critical Reasoning—is a 'Mission Node' that you must initiate and clear to grow your Skill Mastery. With 10,000+ AI-curated questions, you track your progress in real-time, visualizing your growth as you move closer to being placement-ready.",
        features: [
            { title: "Topic Mastery Missions", description: "Individual nodes for every critical aptitude area, allowing you to focus on specific weaknesses.", icon: "auto_stories" },
            { title: "Skill Mastery Tracking", description: "A high-fidelity progress hero that tracks your total XP and completion percentage across all missions.", icon: "shutter_speed" },
            { title: "AI-Driven Question Bank", description: "Dynamic questions that ensure you always face fresh challenges tailored to your skill level.", icon: "psychology" },
            { title: "Mission Initiation System", description: "A streamlined 'Initiate' and 'Resume' workflow that keeps you focused on your next learning step.", icon: "bolt" }
        ],
        curriculum: [
            { category: "Quantitative Aptitude", topics: ["Number Systems", "Percentages", "Time & Distance", "Profit & Loss", "Algebra", "Data Interpretation"] },
            { category: "Logical Reasoning", topics: ["Syllogisms", "Seating Arrangement", "Blood Relations", "Puzzles", "Coding-Decoding", "Clocks"] },
            { category: "Verbal Ability", topics: ["Reading Comprehension", "Sentence Correction", "Para Jumbles", "Critical Reasoning", "Vocabulary"] }
        ],
        howItWorks: [
            { step: "Node Calibration", detail: "Browse the 'Available Missions' grid to see all topics and your current progress percentage for each." },
            { step: "Mission Initiation", detail: "Use the 'Initiate' protocol to start a new mission or 'Resume' to pick up exactly where you left off." },
            { step: "Performance Telemetry", detail: "AI monitors every answer, updating your XP and Mastery rank in real-time on your dashboard." },
            { step: "Mission Clear", detail: "Successfully clear all topic nodes to finalize your Aptitude Protocol and transition to elite assessments." }
        ],
        stats: [
            { label: "Mission Nodes", value: "30+" },
            { label: "Total Questions", value: "10,000+" },
            { label: "AI Scored Reports", value: "Instant" },
            { label: "Target Accuracy", value: "90%+" }
        ],
        practicePath: "/practice/aptitude"
    },
    "communication": {
        title: "Vocal Command Protocol",
        subtitle: "Calibrate your frequency. Master professional fluency with AI-led scenario analysis.",
        heroIcon: "mic",
        longDescription: "The Vocal Command module puts you in front of real-world communication 'Channels'. By initiating various scenario protocols—from Self-Introductions to Conflict Resolution—you record your voice and receive instant feedback on signal strength, fluency, and tone to ensure you dominate every airwave.",
        features: [
            { title: "Scenario Protocol Hub", description: "A grid of critical speaking scenarios including Job Interviews, Workplace Conflicts, and Future Aspirations.", icon: "campaign" },
            { title: "Vocal Signal Analysis", description: "AI monitors your frequency and hesitation markers in real-time as you record your responses.", icon: "graphic_eq" },
            { title: "Difficulty Calibration", description: "Scenarios are tagged by difficulty (Easy, Medium, Hard) to help you scale your proficiency gradually.", icon: "equalizer" },
            { title: "Resume Protocol Workflow", description: "Instantly pick up your latest speaking task to maintain a consistent practice streak.", icon: "history" }
        ],
        howItWorks: [
            { step: "Channel Selection", detail: "Choose an active 'Channel' from the grid based on the communication scenario you wish to master." },
            { step: "Protocol Initiation", detail: "Study the prompt mission briefing and 'Initiate Protocol' to start your voice recording session." },
            { step: "Vocal Submission", detail: "Deliver your response while the AI analyzes your structural delivery and linguistic accuracy." },
            { step: "Signal Optimization", detail: "Review the AI report card and re-initiate the scenario until your fluency score is maxed out." }
        ],
        practicePath: "/practice/communication"
    },
    "coding-labs": {
        title: "Coding Protocol Lab",
        subtitle: "Initialize system logic. Solve algorithmic challenges to optimize runtime efficiency.",
        heroIcon: "code",
        longDescription: "Step into the Coding Protocol Lab, where every problem is a 'Module' designed to test your system logic. Using an integrated IDE and AI-guided debugging, you'll solve challenges in over 50+ languages while your code is evaluated for complexity, efficiency, and correctness.",
        features: [
            { title: "Module Repository", description: "Filter through a massive library of challenges categorized by data structures and algorithmic complexity.", icon: "terminal" },
            { title: "System Load Dashboard", description: "Track the total number of modules solved and maintain your 'Systems Operational' status.", icon: "account_tree" },
            { title: "Multi-Language Protocol", description: "Execute logic in Python, Java, C++, JS, and more within a high-performance integrated IDE.", icon: "code" },
            { title: "Logical Resume Buffer", description: "The 'Resume Challenge' system ensures you never lose time when switching between complex problem nodes.", icon: "play_arrow" }
        ],
        howItWorks: [
            { step: "Module Filtering", detail: "Access the 'Available Modules' grid and filter by topic like Arrays, Trees, or Dynamic Programming." },
            { step: "Logic Implementation", detail: "Study the mission requirements and solve the challenge using our production-grade editor." },
            { step: "Test Case Execution", detail: "Run your code against hidden test nodes to ensure your logic satisfies all protocol requirements." },
            { step: "System Sync", detail: "Once solved, your progress is synchronized with your profile telemetry, marking the module as 'Complete'." }
        ],
        practicePath: "/practice/coding"
    },
    "job-simulator": {
        title: "Job Role Simulator",
        subtitle: "Bridge the gap between college and corporate with real workplace tasks.",
        heroIcon: "work_outline",
        longDescription: "Experience your dream job before you're even hired. Our simulator puts you in the driver's seat of real-world corporate projects.",
        features: [
            { title: "Role-Based Scenarios", description: "Simulate daily tasks of a Software Engineer, Data Analyst, or Consultant.", icon: "business_center" },
            { title: "Decision Making", description: "Navigate workplace challenges and learn critical problem-solving.", icon: "psychology" },
            { title: "Project Deliverables", description: "Complete tasks that mirror actual industry projects and requirements.", icon: "task" },
            { title: "Performance Feedback", description: "Receive AI evaluation on your decision quality and task accuracy.", icon: "stars" }
        ],
        howItWorks: [
            { step: "Role Calibration", detail: "Choose from various industry-standard job profiles like SDE, Consultant, or Analyst." },
            { step: "Task Execution", detail: "Engage in a sequence of professional tasks that simulate a typical work day." },
            { step: "Project Submission", detail: "Submit your work for AI review and see how you track against senior benchmarks." },
            { step: "Expert Calibration", detail: "Refine your approach based on detailed feedback and model work samples." }
        ],
        practicePath: "/practice/job-simulation"
    }
};

export default function ProductDetailPage() {
    const { slug } = useParams();
    const router = useRouter();
    const [data, setData] = useState<ProductDetail | null>(null);

    useEffect(() => {
        if (slug && productData[slug as string]) {
            setData(productData[slug as string]);
        }
    }, [slug]);

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-900">
                <div className="text-center">
                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Product Not Found</h1>
                    <Link href="/" className="text-indigo-600 font-bold hover:underline">Return to Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="animate-in fade-in duration-700">
            {/* Hero Section */}
            <header className="pt-20 pb-20 px-4 bg-white dark:bg-slate-900 relative overflow-hidden">
                <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-16 relative z-10">
                    <div className="flex-1 text-center lg:text-left">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-bold mb-8">
                            <span className="material-icons-outlined text-sm">verified</span> Most Popular Module
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 leading-tight">
                            {data.title}
                        </h1>
                        <p className="text-xl text-slate-500 dark:text-slate-400 mb-10 leading-relaxed font-medium">
                            {data.subtitle}
                        </p>
                        <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                            <button
                                onClick={() => router.push(data.practicePath)}
                                className="w-full sm:w-auto bg-indigo-600 text-white px-10 py-4 rounded-2xl font-black text-lg hover:shadow-2xl hover:scale-105 transition-all shadow-indigo-600/25 flex items-center justify-center gap-2"
                            >
                                Start Practicing <span className="material-icons-outlined">arrow_forward</span>
                            </button>
                            <Link href="/#discovery" className="w-full sm:w-auto text-slate-600 dark:text-slate-300 font-bold hover:text-indigo-600 px-8 py-4 text-center">
                                Explore All Products
                            </Link>
                        </div>

                        {data.stats && (
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mt-16 border-t border-slate-100 dark:border-slate-800 pt-10">
                                {data.stats.map((stat, idx) => (
                                    <div key={idx}>
                                        <div className="text-2xl font-black text-indigo-600">{stat.value}</div>
                                        <div className="text-xs text-slate-400   font-bold mt-1">{stat.label}</div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="flex-1 relative">
                        <div className="w-full aspect-square max-w-md mx-auto bg-indigo-50 dark:bg-indigo-900/10 rounded-[3rem] border-2 border-dashed border-indigo-200 dark:border-indigo-800 flex items-center justify-center relative group">
                            <span className="material-icons-outlined text-[12rem] text-indigo-600 transition-transform group-hover:scale-110 duration-500">
                                {data.heroIcon}
                            </span>
                            <div className="absolute -top-6 -right-6 w-24 h-24 bg-white dark:bg-slate-800 shadow-xl rounded-3xl flex items-center justify-center animate-bounce">
                                <span className="material-icons-outlined text-3xl text-yellow-500">auto_awesome</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="absolute top-0 right-0 w-1/3 h-full bg-indigo-600/5 -skew-x-12 translate-x-1/2"></div>
            </header>

            {/* Deep Description */}
            <section className="py-24 px-4 bg-slate-50 dark:bg-slate-950">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-8">Why {data.title}?</h2>
                    <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed font-medium  underline decoration-indigo-600/30 underline-offset-8">
                        "{data.longDescription}"
                    </p>
                </div>
            </section>

            {/* Modern Features Grid */}
            <section className="py-24 px-4 max-w-7xl mx-auto">
                <div className="text-center mb-20">
                    <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Powerful Features</h2>
                    <p className="text-slate-500 font-medium">Built with cutting-edge AI to accelerate your learning.</p>
                </div>
                <div className="grid md:grid-cols-2 gap-8">
                    {data.features.map((feature, idx) => (
                        <div key={idx} className="p-10 bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 hover:border-indigo-600 transition-all group flex gap-8 items-start">
                            <div className="w-16 h-16 bg-indigo-50 dark:bg-indigo-900/30 rounded-2xl flex items-center justify-center text-indigo-600 shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                <span className="material-icons-outlined text-3xl">{feature.icon || "stars"}</span>
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-3">{feature.title}</h3>
                                <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">
                                    {feature.description}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* Curriculum / Topics Section */}
            {data.curriculum && (
                <section className="py-24 px-4 bg-white dark:bg-slate-900 border-y border-slate-100 dark:border-slate-800">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">Complete Curriculum</h2>
                            <p className="text-slate-500 font-medium">Everything you need to crack any placement test.</p>
                        </div>
                        <div className="grid lg:grid-cols-3 gap-8">
                            {data.curriculum.map((group, idx) => (
                                <div key={idx} className="bg-slate-50 dark:bg-slate-950 p-8 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                                    <h3 className="text-lg font-black text-indigo-600   mb-6 pb-4 border-b border-indigo-100 dark:border-indigo-900/30">
                                        {group.category}
                                    </h3>
                                    <ul className="space-y-4">
                                        {group.topics.map((topic, tIdx) => (
                                            <li key={tIdx} className="flex items-center gap-3 text-slate-700 dark:text-slate-300 font-bold">
                                                <span className="material-icons-outlined text-green-500 text-sm">check_circle</span>
                                                {topic}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Steps Visual Section */}
            <section className="py-24 px-4">
                <div className="max-w-7xl mx-auto">
                    <div className="bg-indigo-600 rounded-[3rem] p-12 lg:p-20 text-white relative overflow-hidden shadow-2xl">
                        <div className="max-w-3xl relative z-10">
                            <h2 className="text-4xl font-black mb-12">Your Success Journey</h2>
                            <div className="space-y-12">
                                {data.howItWorks.map((step, idx) => (
                                    <div key={idx} className="flex gap-8 group">
                                        <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-2xl font-black shrink-0 border border-white/30 group-hover:bg-white group-hover:text-indigo-600 transition-colors">
                                            {idx + 1}
                                        </div>
                                        <div>
                                            <h4 className="text-2xl font-black mb-2">{step.step}</h4>
                                            <p className="text-indigo-100 text-lg leading-relaxed font-medium">
                                                {step.detail}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="mt-16">
                                <button
                                    onClick={() => router.push(data.practicePath)}
                                    className="bg-white text-indigo-600 px-12 py-5 rounded-2xl font-black text-xl hover:shadow-2xl hover:scale-105 transition-all"
                                >
                                    Join 50,000+ Students →
                                </button>
                            </div>
                        </div>
                        <div className="absolute top-0 right-[-10%] w-[60%] h-full bg-white/5 skew-x-[-20deg] hidden lg:block"></div>
                    </div>
                </div>
            </section>

            {/* NEW Section 1: Industry Application */}
            <section className="py-24 px-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-20 items-center">
                        <div className="order-2 lg:order-1">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="text-3xl mb-4">🏆</div>
                                    <h4 className="font-black text-slate-900 dark:text-white mb-2">Gatekeeper Round</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">92% of MAANG and Fortune 500 companies use aptitude as their primary filter round.</p>
                                </div>
                                <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="text-3xl mb-4">📈</div>
                                    <h4 className="font-black text-slate-900 dark:text-white mb-2">Cognitive Growth</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">Training on logic improves decision-making speed by 40% in real-world scenarios.</p>
                                </div>
                                <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="text-3xl mb-4">💼</div>
                                    <h4 className="font-black text-slate-900 dark:text-white mb-2">Role Universal</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">Essential for Software, Consulting, Finance, and Product Management roles.</p>
                                </div>
                                <div className="p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm">
                                    <div className="text-3xl mb-4">⚡</div>
                                    <h4 className="font-black text-slate-900 dark:text-white mb-2">Time Mastery</h4>
                                    <p className="text-sm text-slate-500 leading-relaxed font-medium">Our students solve complex problems 3x faster than the industry average.</p>
                                </div>
                            </div>
                        </div>
                        <div className="order-1 lg:order-2">
                            <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-6">Why Industry Leaders <span className="text-indigo-600">Demand</span> This Skill</h2>
                            <p className="text-lg text-slate-500 dark:text-slate-400 mb-8 leading-relaxed font-medium">
                                In a world of rapid automation, the ability to think logically and handle complex data is the ultimate competitive advantage. Academik's Aptitude module is designed using real hiring patterns from the last 10 years.
                            </p>
                            <ul className="space-y-4">
                                {["Curated by Ex-McKinsey & Google Recruiters", "Real-time Problem Solving Frameworks", "Integrated with ATS Pre-screening Models"].map((point, idx) => (
                                    <li key={idx} className="flex items-center gap-3 text-slate-900 dark:text-white font-bold">
                                        <span className="material-icons text-indigo-600">bolt</span> {point}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* NEW Section 2: Proficiency Breakdown */}
            <section className="py-24 px-4 bg-white dark:bg-slate-900">
                <div className="max-w-6xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl font-black text-slate-900 dark:text-white mb-4">The Mastery Path</h2>
                        <p className="text-slate-500 font-medium">We take you from the basics to elite-level problem solving.</p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-0 border border-slate-100 dark:border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl">
                        <div className="p-12 bg-slate-50/50 dark:bg-slate-950/50">
                            <div className="text-indigo-600 font-black   text-xs mb-4">Level 01</div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 text-center">Foundation</h3>
                            <ul className="space-y-4 text-slate-600 dark:text-slate-400 text-sm font-medium">
                                <li>• Basic Arithmetic Logic</li>
                                <li>• Fundamentals of Grammar</li>
                                <li>• Linear Logic Puzzles</li>
                                <li>• Speed-Math Techniques</li>
                            </ul>
                        </div>
                        <div className="p-12 bg-indigo-600 text-white relative">
                            <div className="absolute top-0 right-0 p-4">
                                <span className="material-icons text-yellow-400">workspace_premium</span>
                            </div>
                            <div className="bg-white/20 text-white font-black   text-[10px] px-2 py-0.5 rounded inline-block mb-4">Level 02</div>
                            <h3 className="text-2xl font-black mb-6 text-center">Placement-Ready</h3>
                            <ul className="space-y-4 text-indigo-50 text-sm font-medium">
                                <li>• Complex Data Interpretation</li>
                                <li>• Advanced Structural Verbal</li>
                                <li>• Pattern-based Logical Drills</li>
                                <li>• Company Mock Assessments</li>
                            </ul>
                        </div>
                        <div className="p-12 bg-slate-50/50 dark:bg-slate-950/50">
                            <div className="text-indigo-600 font-black   text-xs mb-4">Level 03</div>
                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 text-center">Elite Solver</h3>
                            <ul className="space-y-4 text-slate-600 dark:text-slate-400 text-sm font-medium">
                                <li>• GMAT/CAT Level Questions</li>
                                <li>• Critical Reasoning Hacks</li>
                                <li>• Advanced Game Theory</li>
                                <li>• National Level Benchmarking</li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-16 text-center">
                        <button
                            onClick={() => router.push(data.practicePath)}
                            className="bg-slate-900 dark:bg-white dark:text-slate-900 text-white px-12 py-5 rounded-2xl font-black text-xl hover:shadow-2xl transition-all"
                        >
                            Start Your Journey Now
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
