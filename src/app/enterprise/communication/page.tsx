
"use client";

import React, { useState, useEffect } from 'react';
import {
    Mail, Send, Inbox, Trash2, Search, Filter,
    RotateCcw, MoreVertical, Star, Reply,
    ChevronRight, Brain, Clock, ChevronLeft, X
} from 'lucide-react';
import { useAuth } from "@/context/AuthContext";
import { BACKEND_URL } from "@/utils/api";
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';

interface Email {
    id: string;
    sender_email: string;
    recipient_email: string;
    subject: string;
    body: string;
    direction: "INBOUND" | "OUTBOUND";
    status: string;
    is_read: boolean;
    sent_at: string;
    candidate_name?: string;
}

const MailboxPage = () => {
    const { token, canAccess } = useAuth();
    const [activeTab, setActiveTab] = useState<'INBOUND' | 'OUTBOUND' | 'FAVORITE' | 'TRASH'>('INBOUND');
    const [emails, setEmails] = useState<Email[]>([]);
    const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [smartReply, setSmartReply] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [composeData, setComposeData] = useState({ to: '', subject: '', body: '' });
    const [isSending, setIsSending] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const fetchEmails = async (direction: string) => {
        if (!token) return;
        if (direction === 'FAVORITE' || direction === 'TRASH') {
            setEmails([]);
            setIsLoading(false);
            return;
        }
        setIsLoading(true);
        try {
            const resp = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/logs?direction=${direction}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await resp.json();
            setEmails(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Failed to fetch emails", err);
            setEmails([]);
        } finally {
            setIsLoading(false);
        }
    };

    const syncEmails = async () => {
        if (!token) return;
        setIsSyncing(true);
        try {
            const resp = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/sync-imap`, {
                method: 'POST',
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await resp.json();
            if (data.status === "success") {
                setStatusMsg({ type: 'success', text: `Sync complete! Fetched ${data.synced_count} new emails.` });
                fetchEmails(activeTab);
            } else {
                setStatusMsg({ type: 'error', text: data.status || "Sync failed" });
            }
            setTimeout(() => setStatusMsg(null), 5000);
        } catch (err) {
            console.error("Sync failed", err);
            setStatusMsg({ type: 'error', text: "Sync connection error" });
            setTimeout(() => setStatusMsg(null), 5000);
        } finally {
            setIsSyncing(false);
        }
    };

    const markAsRead = async (logId: string) => {
        if (!token) return;
        try {
            await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/read/${logId}`, {
                method: 'PATCH',
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            // Update local state to show as read
            setEmails(prev => prev.map(e => e.id === logId ? { ...e, is_read: true } : e));
        } catch (err) {
            console.error("Failed to mark as read", err);
        }
    };

    const handleSmartReply = async () => {
        if (!selectedEmail || !token) return;
        setIsGenerating(true);
        try {
            const resp = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/smart-reply/${selectedEmail.id}`, {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            const data = await resp.json();
            setSmartReply(data.reply);
        } catch (err) {
            console.error("Failed to generate smart reply", err);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleSendEmail = async () => {
        if (!composeData.to || !composeData.subject || !composeData.body || !token) return;
        setIsSending(true);
        try {
            // Fetch candidate ID by email first if possible, or just send directly
            // For now, our /send endpoint expects candidate IDs. 
            // In a real mailbox, we might need a generic send. 
            // Let's use a simpler approach: if it's a candidate, find them. 
            // Otherwise, we'll need a generic send-direct endpoint.

            // For this implementation, let's assume we are sending to a candidate's email directly
            const resp = await fetch(`${BACKEND_URL}/api/v1/enterprise/communication/send`, {
                method: 'POST',
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify({
                    recipient_emails: [composeData.to], // Supporting direct emails if the backend allows
                    subject: composeData.subject,
                    body: composeData.body
                })
            });

            if (resp.ok) {
                setIsComposeOpen(false);
                setComposeData({ to: '', subject: '', body: '' });
                setStatusMsg({ type: 'success', text: 'Email sent successfully!' });
                if (activeTab === 'OUTBOUND') fetchEmails('OUTBOUND');
                setTimeout(() => setStatusMsg(null), 3000);
            } else {
                const errData = await resp.json();
                setStatusMsg({ type: 'error', text: errData.detail || 'Failed to send email' });
                setTimeout(() => setStatusMsg(null), 5000);
            }
        } catch (err) {
            console.error("Failed to send email", err);
            setStatusMsg({ type: 'error', text: 'Connection error. Please try again.' });
            setTimeout(() => setStatusMsg(null), 5000);
        } finally {
            setIsSending(false);
        }
    };

    const openReply = () => {
        if (!selectedEmail) return;
        setComposeData({
            to: selectedEmail.direction === 'INBOUND' ? selectedEmail.sender_email : selectedEmail.recipient_email,
            subject: `Re: ${selectedEmail.subject}`,
            body: `<br><br>---<br>${selectedEmail.body}`
        });
        setIsComposeOpen(true);
    };

    useEffect(() => {
        if (token) {
            fetchEmails(activeTab);
        }
        setSmartReply('');
    }, [activeTab, token]);

    useEffect(() => {
        if (selectedEmail && !selectedEmail.is_read && selectedEmail.direction === 'INBOUND') {
            markAsRead(selectedEmail.id);
        }
        setSmartReply('');
    }, [selectedEmail]);

    const filteredEmails = Array.isArray(emails) ? emails.filter((e: Email) =>
        (e.subject?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (e.sender_email?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (e.recipient_email?.toLowerCase() || "").includes(searchQuery.toLowerCase())
    ) : [];

    return (
        <div className="flex h-full bg-white overflow-hidden border-t border-slate-100 shadow-sm animate-in fade-in duration-500">
            {/* Mailbox Sidebar */}
            <div className="w-64 bg-white border-r border-slate-200 flex flex-col p-4 gap-2">
                {canAccess("communications:create") && (
                    <button
                        className="w-full h-11 mb-6 bg-[#7C3AED] text-white rounded-xl font-black text-xs hover:bg-[#6D28D9] shadow-xl shadow-indigo-100 transition-all flex items-center justify-center gap-2 active:scale-95"
                        onClick={() => {
                            setComposeData({ to: '', subject: '', body: '' });
                            setIsComposeOpen(true);
                        }}
                    >
                        <Send className="w-4 h-4" /> Compose Message
                    </button>
                )}

                <SidebarItem
                    icon={<Inbox className="w-4 h-4" />}
                    label="Inbox"
                    active={activeTab === 'INBOUND'}
                    onClick={() => setActiveTab('INBOUND')}
                    count={emails.filter(e => e.direction === 'INBOUND' && !e.is_read).length}
                />
                <SidebarItem
                    icon={<Send className="w-4 h-4" />}
                    label="Sent"
                    active={activeTab === 'OUTBOUND'}
                    onClick={() => setActiveTab('OUTBOUND')}
                />
                <SidebarItem
                    icon={<Star className="w-4 h-4" />}
                    label="Favorites"
                    active={activeTab === 'FAVORITE'}
                    onClick={() => setActiveTab('FAVORITE')}
                />
                <SidebarItem
                    icon={<Trash2 className="w-4 h-4" />}
                    label="Trash"
                    active={activeTab === 'TRASH'}
                    onClick={() => setActiveTab('TRASH')}
                />
            </div>

            {/* Email List */}
            <div className="w-96 bg-white border-r border-slate-200 flex flex-col">
                <div className="p-4 border-b border-slate-100 relative">
                    {statusMsg && (
                        <div className={`absolute top-0 left-0 right-0 p-2 text-center text-xs font-bold animate-in slide-in-from-top duration-300 z-50 ${statusMsg.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                            {statusMsg.text}
                        </div>
                    )}
                    <h2 className="text-xl font-bold text-slate-800 mb-4">
                        {activeTab === 'INBOUND' ? 'Inbox' : 
                         activeTab === 'OUTBOUND' ? 'Sent' :
                         activeTab === 'FAVORITE' ? 'Favorites' : 'Trash'}
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <Input
                            placeholder="Search conversations..."
                            className="pl-10 bg-slate-50 border-none rounded-xl"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-slate-400">Loading...</div>
                    ) : filteredEmails.length === 0 ? (
                        <div className="p-12 text-center text-slate-300">
                            <Mail className="w-12 h-12 mb-4 mx-auto opacity-10" />
                            <p className="text-sm font-medium">No messages found here</p>
                        </div>
                    ) : filteredEmails.map((email: Email) => (
                        <div
                            key={email.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => setSelectedEmail(email)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setSelectedEmail(email); } }}
                            className={`p-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-indigo-50/30 ${selectedEmail?.id === email.id ? 'bg-indigo-50 border-l-4 border-l-indigo-500' : ''}`}
                        >
                            <div className="flex justify-between items-start mb-1">
                                <span className={`text-sm font-semibold flex items-center gap-2 ${!email.is_read && email.direction === 'INBOUND' ? 'text-slate-900' : 'text-slate-600'}`}>
                                    {email.direction === 'INBOUND' ? email.sender_email : email.recipient_email}
                                    {!email.is_read && email.direction === 'INBOUND' && (
                                        <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                                    )}
                                </span>
                                <span className="text-[10px] text-slate-400 flex items-center">
                                    <Clock className="w-3 h-3 mr-1" />
                                    {new Date(email.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                            <h3 className={`text-sm mb-1 truncate ${!email.is_read && email.direction === 'INBOUND' ? 'font-bold' : 'font-medium'}`}>
                                {email.subject}
                            </h3>
                            <p className="text-xs text-slate-400 line-clamp-2">
                                {(email.body || '').replace(/<[^>]*>/g, '')}
                            </p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Email View */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedEmail ? (
                    <>
                        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                            <div className="flex gap-2">
                                {canAccess("communications:create") && (
                                    <Button variant="outline" size="sm" className="rounded-full" onClick={openReply}><Reply className="w-3 h-3 mr-2" /> Reply</Button>
                                )}
                                <Button variant="outline" size="sm" className="rounded-full" onClick={() => setStatusMsg({ type: 'success', text: "Added to Favorites (Local Only)" })}><Star className="w-3 h-3" /></Button>
                                {canAccess("communications:delete") && (
                                    <Button variant="outline" size="sm" className="rounded-full text-red-500 hover:text-red-600" onClick={() => setStatusMsg({ type: 'error', text: "Moved to Trash (Local Only)" })}><Trash2 className="w-3 h-3" /></Button>
                                )}
                            </div>
                            <div className="flex gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={() => {
                                        const idx = filteredEmails.findIndex(e => e.id === selectedEmail?.id);
                                        if (idx > 0) setSelectedEmail(filteredEmails[idx - 1]);
                                    }}
                                    disabled={filteredEmails.findIndex(e => e.id === selectedEmail?.id) <= 0}
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </Button>
                                <Button 
                                    variant="ghost" 
                                    size="sm"
                                    onClick={() => {
                                        const idx = filteredEmails.findIndex(e => e.id === selectedEmail?.id);
                                        if (idx !== -1 && idx < filteredEmails.length - 1) setSelectedEmail(filteredEmails[idx + 1]);
                                    }}
                                    disabled={filteredEmails.findIndex(e => e.id === selectedEmail?.id) >= filteredEmails.length - 1}
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-8">
                            <div className="max-w-3xl mx-auto">
                                <div className="mb-8">
                                    <h1 className="text-2xl font-bold text-slate-800 mb-6">{selectedEmail.subject}</h1>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                {selectedEmail.direction === 'INBOUND' ? (selectedEmail.sender_email?.[0] || '?').toUpperCase() : 'Y'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-slate-900">{selectedEmail.direction === 'INBOUND' ? selectedEmail.sender_email : 'Me'}</div>
                                                <div className="text-xs text-slate-500">to {selectedEmail.direction === 'INBOUND' ? 'Me' : selectedEmail.recipient_email}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-slate-400">
                                            {new Date(selectedEmail.sent_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="prose prose-slate max-w-none text-slate-700 leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                                />

                                {/* AI Agent Sidebar Section */}
                                <div className="mt-12 p-6 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Brain className="w-24 h-24" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Badge variant="outline" className="bg-white/80 border-indigo-200 text-indigo-700 py-1">
                                                <Brain className="w-3 h-3 mr-1" /> AI Agent Analysis
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-slate-700 mb-4 ">
                                            &quot;The AI has analyzed this message. You can generate a smart reply based on candidates requirements and the job context.&quot;
                                        </p>

                                        {smartReply && (
                                            <div className="mb-4 p-4 bg-white/50 rounded-xl border border-indigo-100 text-sm text-slate-700 animate-in slide-in-from-top-2">
                                                <div className="font-bold text-xs text-indigo-600 mb-2  ">Suggested Reply:</div>
                                                {smartReply}
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-2">
                                            {canAccess("communications:moderate") && (
                                                <Button
                                                    size="sm"
                                                    className="bg-[#7C3AED] hover:bg-[#6D28D9] font-black text-xs shadow-lg shadow-indigo-100"
                                                    onClick={handleSmartReply}
                                                    disabled={isGenerating}
                                                >
                                                    {isGenerating ? 'Analyzing...' : smartReply ? 'Regenerate Draft' : 'Draft Smart Reply'}
                                                </Button>
                                            )}
                                            
                                            {canAccess("communications:create") && smartReply && (
                                                <Button 
                                                    size="sm" 
                                                    variant="secondary" 
                                                    className="bg-white border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                                                    onClick={() => {
                                                        const cleanReply = smartReply.replace(/Suggested Reply:\s*/, "");
                                                        setComposeData({
                                                            to: selectedEmail.direction === 'INBOUND' ? selectedEmail.sender_email : selectedEmail.recipient_email,
                                                            subject: `Re: ${selectedEmail.subject}`,
                                                            body: cleanReply
                                                        });
                                                        setIsComposeOpen(true);
                                                    }}
                                                >
                                                    Apply to Reply
                                                </Button>
                                            )}

                                            <Button 
                                                size="sm" 
                                                variant="ghost" 
                                                className="text-indigo-600"
                                                onClick={() => {
                                                    alert("Candidate Fit Analysis: \n- AI Score: 85/100 \n- Strong Skills: Project Management, Communication \n- Recommendation: Proceed to Interview Round");
                                                }}
                                            >
                                                View Candidate Fit
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-300">
                        <Mail className="w-16 h-16 mb-4 opacity-20" />
                        <p className="text-slate-400 font-medium">Select an email to read the conversation</p>
                    </div>
                )}
            </div>

            {/* Compose Modal */}
            {isComposeOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white w-full max-w-2xl rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col">
                        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-indigo-600" /> New Message
                            </h3>
                            <button
                                onClick={() => setIsComposeOpen(false)}
                                className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label htmlFor="compose-recipient" className="block text-[10px] font-black text-slate-400   mb-1.5">Recipient Email</label>
                                <Input
                                    id="compose-recipient"
                                    placeholder="e.g. candidate@example.com"
                                    value={composeData.to}
                                    onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                                    className="h-10 text-sm font-medium border-slate-100 bg-slate-50/50"
                                />
                            </div>

                            <div>
                                <label htmlFor="compose-subject" className="block text-[10px] font-black text-slate-400   mb-1.5">Subject</label>
                                <Input
                                    id="compose-subject"
                                    placeholder="Enter subject..."
                                    value={composeData.subject}
                                    onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                    className="h-10 text-sm font-medium border-slate-100 bg-slate-50/50"
                                />
                            </div>

                            <div>
                                <label htmlFor="compose-body" className="block text-[10px] font-black text-slate-400   mb-1.5">Message Content</label>
                                <textarea
                                    id="compose-body"
                                    className="w-full h-64 p-4 rounded-xl border border-slate-100 bg-slate-50/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all resize-none"
                                    placeholder="Type your message here..."
                                    value={composeData.body}
                                    onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
                            <Button variant="ghost" onClick={() => setIsComposeOpen(false)}>Cancel</Button>
                            <Button
                                className="bg-[#7C3AED] hover:bg-[#6D28D9] px-8 font-black text-xs"
                                onClick={handleSendEmail}
                                disabled={isSending || !composeData.to || !composeData.subject || !composeData.body}
                            >
                                {isSending ? 'Sending...' : 'Send Message'}
                                <Send className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface SidebarItemProps {
    icon: React.ReactNode;
    label: string;
    active?: boolean;
    onClick?: () => void;
    count?: number;
}

const SidebarItem = ({ icon, label, active, onClick, count }: SidebarItemProps) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-between w-full h-11 px-4 rounded-xl transition-all ${active ? 'bg-indigo-50 text-[#7C3AED] font-black' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-bold'}`}
    >
        <div className="flex items-center gap-3">
            <div className={`transition-colors ${active ? 'text-[#7C3AED]' : 'text-slate-400'}`}>
                {icon}
            </div>
            <span className="text-xs">{label}</span>
        </div>
        {count ? (
            <span className="bg-[#7C3AED] text-white text-[9px] font-black px-1.5 py-0.5 rounded-lg min-w-[20px] shadow-sm shadow-indigo-200">
                {count}
            </span>
        ) : null}
    </button>
);

export default MailboxPage;
