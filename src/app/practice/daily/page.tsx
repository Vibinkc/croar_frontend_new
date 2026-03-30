"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/utils/api";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface Question {
    id: number;
    topic: string;
    difficulty: string;
    content: {
        question: string;
        options: { [key: string]: string };
    };
    correct_answer: {
        answer: string;
        explanation: string;
    };
}

export default function DailyPracticePage() {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedOption, setSelectedOption] = useState<string | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        fetchDailyQuestions();
    }, []);

    const fetchDailyQuestions = async () => {
        try {
            // const token = Cookies.get("auth_");
            const res = await apiClient.get(`/api/v1/content/daily-practice`);
            if (res.ok) {
                const data = await res.json();
                setQuestions(data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleOptionSelect = (option: string) => {
        if (isAnswered) return;
        setSelectedOption(option);
    };

    const handleSubmit = () => {
        const currentQ = questions[currentIndex];
        if (selectedOption === currentQ.correct_answer.answer) {
            setScore(score + 1);
        }
        setIsAnswered(true);
    };

    const handleNext = () => {
        if (currentIndex < questions.length - 1) {
            setSelectedOption(null);
            setIsAnswered(false);
            setCurrentIndex(currentIndex + 1);
        } else {
            setCompleted(true);
        }
    };

    if (loading) return <div>Loading daily challenge...</div>;

    if (completed) {
        return (
            <div className="max-w-2xl mx-auto py-12 px-4 text-center">
                <div className="bg-white shadow-xl rounded-lg p-8 transform transition-all hover:scale-105 duration-300">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Daily Practice Complete!</h1>
                    <p className="text-gray-500 mb-8">Keep up the streak!</p>

                    <div className="text-6xl font-bold text-slate-900 mb-4 animate-bounce">
                        {score} / {questions.length}
                    </div>

                    <div className="bg-slate-50 p-4 rounded-lg mb-8 border border-slate-100">
                        <p className="font-bold text-slate-800">🔥 Current Streak: 1 Day</p>
                        <p className="text-sm text-slate-500">Come back tomorrow for more!</p>
                    </div>

                    <Link
                        href="/practice"
                        className="inline-block bg-slate-900 text-white px-8 py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg"
                    >
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    if (questions.length === 0) return <div>No questions available for today.</div>;

    const currentQ = questions[currentIndex];

    return (
        <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="mb-6 flex justify-between items-center">
                <h1 className="text-2xl font-bold">Practice of the Day</h1>
                <span className="text-sm font-semibold bg-gray-100 px-3 py-1 rounded-full">
                    Question {currentIndex + 1} / {questions.length}
                </span>
            </div>

            <div className="bg-slate-50/50 shadow-lg rounded-[2rem] overflow-hidden border-t-4 border-slate-900">
                <div className="p-6">
                    <div className="flex justify-between mb-4">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{currentQ.topic}</span>
                        <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${currentQ.difficulty === 'EASY' ? 'bg-slate-50 text-slate-600 border-slate-200' : 'bg-slate-900 text-white border-slate-900 shadow-sm'}`}>{currentQ.difficulty}</span>
                    </div>

                    <h2 className="text-xl font-medium text-gray-900 mb-6">{currentQ.content.question}</h2>

                    <div className="space-y-3">
                        {Object.entries(currentQ.content.options).map(([key, value]) => {
                            let className = "w-full text-left p-4 border rounded-lg transition-all duration-200 ";
                            if (isAnswered) {
                                if (key === currentQ.correct_answer.answer) className += "bg-green-100 border-green-500 text-green-900";
                                else if (selectedOption === key) className += "bg-red-100 border-red-500 text-red-900";
                                else className += "opacity-50";
                            } else {
                                if (selectedOption === key) className += "bg-slate-900 border-slate-900 text-white shadow-xl translate-x-1";
                                else className += "hover:bg-gray-50 text-black";
                            }

                            return (
                                <button
                                    key={key}
                                    onClick={() => handleOptionSelect(key)}
                                    disabled={isAnswered}
                                    className={className}
                                >
                                    <span className="font-bold mr-2">{key}.</span> {value}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
                    {isAnswered && (
                        <div className="text-sm text-gray-600">
                            <span className="font-bold">Explanation:</span> {currentQ.correct_answer.explanation}
                        </div>
                    )}

                    <div className="ml-auto">
                        {!isAnswered ? (
                            <button
                                onClick={handleSubmit}
                                disabled={!selectedOption}
                                className={`px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] text-white transition-all shadow-md ${selectedOption ? 'bg-slate-900 hover:bg-black' : 'bg-slate-200 cursor-not-allowed'}`}
                            >
                                Submit
                            </button>
                        ) : (
                            <button
                                onClick={handleNext}
                                className="bg-slate-900 hover:bg-black text-white px-8 py-3 rounded-xl font-black uppercase tracking-widest text-[11px] transition-all shadow-md"
                            >
                                {currentIndex === questions.length - 1 ? "Finish" : "Next"}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
