"use client";

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { API_BASE_URL } from '@/lib/api-config';

interface Message {
    role: 'user' | 'agent';
    content: string;
}

// crypto.randomUUID is unavailable on non-secure (HTTP) origins / older browsers.
const makeThreadId = () =>
    (typeof crypto !== 'undefined' && crypto.randomUUID)
        ? crypto.randomUUID()
        : `thread-${Date.now()}-${Math.random().toString(36).slice(2)}`;

const AgentCopilot = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [threadId] = useState(makeThreadId());
    const [messages, setMessages] = useState<Message[]>([
        { role: 'agent', content: "Hi! I'm your AI HR Copilot. I can help you shortlist candidates, trigger assessments, or manage onboarding milestones autonomously." }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = async (text: string = inputValue) => {
        if (!text.trim() || isLoading) return;

        // Add user message to UI
        const userMsg: Message = { role: 'user', content: text };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/agents/chat`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ 
                    message: text, 
                    thread_id: threadId,
                    context: 'general' 
                }),
            });

            const data = await response.json();
            
            if (response.ok) {
                setMessages(prev => [...prev, { role: 'agent', content: data.response }]);
            } else {
                setMessages(prev => [...prev, { role: 'agent', content: `Neural Error: ${data.detail || 'Connection lost'}` }]);
            }
        } catch (error) {
            console.error("Agent Error:", error);
            setMessages(prev => [...prev, { role: 'agent', content: "I'm having trouble connecting to the Neural Hub. Is the backend running on port 8000?" }]);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Floating Neural Button */}
            <button 
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-full shadow-2xl flex items-center justify-center text-white z-[9999] hover:scale-110 transition-transform active:scale-95"
                title="Open AI Copilot"
            >
                <span className="material-symbols-rounded text-3xl">psychology</span>
                {isLoading && (
                    <div className="absolute inset-0 rounded-full border-2 border-white/30 border-t-white animate-spin"></div>
                )}
            </button>

            {/* Agent Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[10000]"
                        />
                        
                        {/* Right-Side Sidebar */}
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl z-[10001] flex flex-col border-l border-slate-100"
                        >
                            {/* Header */}
                            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white">
                                        <span className="material-symbols-rounded">bolt</span>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800">Agent OS</h3>
                                        <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest">Neural Copilot Active</p>
                                    </div>
                                </div>
                                <button onClick={() => setIsOpen(false)} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors">
                                    <span className="material-symbols-rounded">close</span>
                                </button>
                            </div>

                            {/* Chat/Content Area */}
                            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${msg.role === 'agent' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-600'}`}>
                                            <span className="material-symbols-rounded text-xl">
                                                {msg.role === 'agent' ? 'smart_toy' : 'person'}
                                            </span>
                                        </div>
                                        <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                                            msg.role === 'agent' 
                                            ? 'bg-slate-50 border border-slate-100 text-slate-700 rounded-tl-none' 
                                            : 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100'
                                        }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}

                                {isLoading && (
                                    <div className="flex gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 animate-pulse">
                                            <span className="material-symbols-rounded text-xl">bolt</span>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl rounded-tl-none">
                                            <div className="flex gap-1">
                                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></div>
                                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:0.4s]"></div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                
                                {/* Suggested Actions */}
                                {!isLoading && messages.length < 3 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Suggested for you</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            <button 
                                                onClick={() => handleSendMessage("Shortlist candidates for React Role")}
                                                className="text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all text-sm font-medium text-slate-700 flex items-center gap-3 group"
                                            >
                                                <span className="material-symbols-rounded text-slate-400 group-hover:text-indigo-600 transition-colors">person_search</span>
                                                <span>Shortlist candidates for React Role</span>
                                            </button>
                                            <button 
                                                onClick={() => handleSendMessage("Check onboarding status for new hires")}
                                                className="text-left p-3 rounded-xl border border-slate-200 hover:border-indigo-600 hover:bg-indigo-50/50 transition-all text-sm font-medium text-slate-700 flex items-center gap-3 group"
                                            >
                                                <span className="material-symbols-rounded text-slate-400 group-hover:text-indigo-600 transition-colors">fact_check</span>
                                                <span>Check onboarding status</span>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-6 border-t border-slate-100 bg-white">
                                <div className="relative group">
                                    <input 
                                        type="text" 
                                        value={inputValue}
                                        onChange={(e) => setInputValue(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Command the agents..." 
                                        disabled={isLoading}
                                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-4 pl-4 pr-14 text-sm focus:bg-white focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all disabled:opacity-50"
                                    />
                                    <button 
                                        onClick={() => handleSendMessage()}
                                        disabled={isLoading || !inputValue.trim()}
                                        className="absolute right-2 top-2 w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        <span className="material-symbols-rounded">send</span>
                                    </button>
                                </div>
                                <p className="mt-3 text-[10px] text-center text-slate-400 font-medium">Powered by Croar Agent Intelligence</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
};

export default AgentCopilot;
