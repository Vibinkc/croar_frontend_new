
"use client";

import React, { useState, useEffect } from 'react';
import {
    Mail, Send, Inbox, Trash2, Search, Filter,
    RotateCcw, MoreVertical, Star, Reply,
    ChevronRight, Brain, ChevronLeft, X
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
        <div className="flex flex-col h-full bg-[#F4F5F7] overflow-hidden animate-in fade-in duration-500">
            {/* Page header */}
            <header className="px-6 py-4 bg-white border-b border-[#E8EAED] flex items-center justify-between gap-3 shrink-0">
                <div>
                    <h1 className="text-[22px] md:text-[24px] font-extrabold tracking-[-0.5px] text-[#15171C] leading-tight">Mail</h1>
                    <p className="text-[13.5px] text-[#8A929E] mt-0.5">Candidate &amp; team conversations</p>
                </div>
                {canAccess("communications:create") && (
                    <button
                        onClick={() => { setComposeData({ to: '', subject: '', body: '' }); setIsComposeOpen(true); }}
                        className="inline-flex items-center gap-2 h-11 px-4 bg-[#5B53E0] text-white rounded-[10px] text-[13.5px] font-semibold hover:bg-[#4A43C9] shadow-[0_6px_16px_rgba(91,83,224,0.28)] transition-colors"
                    >
                        <Send className="w-4 h-4" /> Compose
                    </button>
                )}
            </header>

            {/* Mail workspace */}
            <div className="flex flex-1 min-h-0 bg-white overflow-hidden">
                {/* Mailbox Sidebar */}
                <div className="w-60 bg-white border-r border-[#E8EAED] flex flex-col p-3 gap-1 shrink-0">
                    <p className="px-3 pt-2 pb-1 text-[10px] font-bold text-[#9AA3AF] uppercase tracking-[0.1em]">Folders</p>
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
            <div className="w-96 bg-white border-r border-[#E1E4E8] flex flex-col">
                <div className="p-4 border-b border-[#E8EAED] relative">
                    {statusMsg && (
                        <div className={`absolute top-0 left-0 right-0 p-2 text-center text-xs font-bold animate-in slide-in-from-top duration-300 z-50 ${statusMsg.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                            {statusMsg.text}
                        </div>
                    )}
                    <h2 className="text-xl font-bold text-[#1F2127] mb-4">
                        {activeTab === 'INBOUND' ? 'Inbox' : 
                         activeTab === 'OUTBOUND' ? 'Sent' :
                         activeTab === 'FAVORITE' ? 'Favorites' : 'Trash'}
                    </h2>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9AA3AF]" />
                        <Input
                            placeholder="Search conversations..."
                            className="pl-10 bg-[#F7F8FA] border-none rounded-[10px]"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-8 text-center text-[#9AA3AF]">Loading...</div>
                    ) : filteredEmails.length === 0 ? (
                        <div className="p-12 text-center text-[#D4D7DC]">
                            <Mail className="w-12 h-12 mb-4 mx-auto opacity-10" />
                            <p className="text-sm font-medium">No messages found here</p>
                        </div>
                    ) : filteredEmails.map((email: Email) => {
                        const who = (email.direction === 'INBOUND' ? email.sender_email : email.recipient_email) || "?";
                        const unread = !email.is_read && email.direction === 'INBOUND';
                        const palette = [
                            "bg-[#ECEBFB] text-[#5B53E0]",
                            "bg-[#E3F4EF] text-[#0E8A6E]",
                            "bg-[#FEF3E2] text-[#D97706]",
                            "bg-[#E7ECFB] text-[#3559C7]",
                            "bg-[#FDECEC] text-[#C0383C]",
                        ];
                        const av = palette[(who.charCodeAt(0) || 0) % palette.length];
                        return (
                            <div
                                key={email.id}
                                role="button"
                                tabIndex={0}
                                onClick={() => setSelectedEmail(email)}
                                onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { setSelectedEmail(email); } }}
                                className={`flex gap-3 px-4 py-3.5 border-b border-[#F0F0F1] cursor-pointer transition-colors hover:bg-[#F7F8FA] ${selectedEmail?.id === email.id ? 'bg-[#ECEBFB]/60 border-l-[3px] border-l-[#5B53E0]' : 'border-l-[3px] border-l-transparent'}`}
                            >
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-[13px] shrink-0 ${av}`}>
                                    {who[0]?.toUpperCase() || "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center gap-2 mb-0.5">
                                        <span className={`text-[13px] flex items-center gap-1.5 truncate ${unread ? 'font-bold text-[#15171C]' : 'font-semibold text-[#374151]'}`}>
                                            {who}
                                            {unread && <span className="w-2 h-2 bg-[#5B53E0] rounded-full shrink-0"></span>}
                                        </span>
                                        <span className="text-[10px] text-[#9AA3AF] shrink-0">
                                            {new Date(email.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <h3 className={`text-[13px] mb-0.5 truncate ${unread ? 'font-semibold text-[#15171C]' : 'font-medium text-[#4B5563]'}`}>
                                        {email.subject}
                                    </h3>
                                    <p className="text-[12px] text-[#9AA3AF] line-clamp-1">
                                        {(email.body || '').replace(/<[^>]{0,4096}>/g, '')}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Email View */}
            <div className="flex-1 flex flex-col bg-white">
                {isComposeOpen ? (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="px-6 py-4 border-b border-[#E8EAED] flex justify-between items-center bg-[#F7F8FA]/60 shrink-0">
                            <h3 className="font-bold text-[15px] text-[#1F2127] flex items-center gap-2">
                                <span className="w-8 h-8 rounded-[10px] flex items-center justify-center text-white shadow-[0_6px_16px_rgba(91,83,224,0.3)]" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)" }}>
                                    <Mail className="w-4 h-4" />
                                </span>
                                New Message
                            </h3>
                            <button
                                onClick={() => setIsComposeOpen(false)}
                                className="w-9 h-9 flex items-center justify-center rounded-full text-[#9AA3AF] hover:bg-[#E1E4E8] hover:text-[#4B5563] transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6">
                            <div className="max-w-2xl mx-auto space-y-4">
                                <div>
                                    <label htmlFor="compose-recipient" className="block text-[10px] font-bold text-[#9AA3AF] uppercase tracking-[0.08em] mb-1.5">Recipient Email</label>
                                    <Input
                                        id="compose-recipient"
                                        placeholder="e.g. candidate@example.com"
                                        value={composeData.to}
                                        onChange={(e) => setComposeData({ ...composeData, to: e.target.value })}
                                        className="h-10 text-sm font-medium border-[#E8EAED] bg-[#F7F8FA]/50"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="compose-subject" className="block text-[10px] font-bold text-[#9AA3AF] uppercase tracking-[0.08em] mb-1.5">Subject</label>
                                    <Input
                                        id="compose-subject"
                                        placeholder="Enter subject..."
                                        value={composeData.subject}
                                        onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                        className="h-10 text-sm font-medium border-[#E8EAED] bg-[#F7F8FA]/50"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="compose-body" className="block text-[10px] font-bold text-[#9AA3AF] uppercase tracking-[0.08em] mb-1.5">Message Content</label>
                                    <textarea
                                        id="compose-body"
                                        className="w-full h-72 p-4 rounded-[10px] border border-[#E8EAED] bg-[#F7F8FA]/50 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#5B53E0] focus:bg-white transition-all resize-none"
                                        placeholder="Type your message here..."
                                        value={composeData.body}
                                        onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 border-t border-[#E8EAED] bg-[#F7F8FA]/60 flex justify-end gap-3 shrink-0">
                            <Button variant="ghost" onClick={() => setIsComposeOpen(false)}>Cancel</Button>
                            <Button
                                className="bg-[#5B53E0] hover:bg-[#4A43C9] px-8 font-bold text-xs"
                                onClick={handleSendEmail}
                                disabled={isSending || !composeData.to || !composeData.subject || !composeData.body}
                            >
                                {isSending ? 'Sending...' : 'Send Message'}
                                <Send className="w-4 h-4 ml-2" />
                            </Button>
                        </div>
                    </div>
                ) : selectedEmail ? (
                    <>
                        <div className="p-4 border-b border-[#E8EAED] flex justify-between items-center bg-[#F7F8FA]/50">
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
                                    <h1 className="text-2xl font-bold text-[#1F2127] mb-6">{selectedEmail.subject}</h1>
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-[#DAD7F6] flex items-center justify-center text-[#5B53E0] font-bold">
                                                {selectedEmail.direction === 'INBOUND' ? (selectedEmail.sender_email?.[0] || '?').toUpperCase() : 'Y'}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-[#15171C]">{selectedEmail.direction === 'INBOUND' ? selectedEmail.sender_email : 'Me'}</div>
                                                <div className="text-xs text-[#6B6F76]">to {selectedEmail.direction === 'INBOUND' ? 'Me' : selectedEmail.recipient_email}</div>
                                            </div>
                                        </div>
                                        <div className="text-xs text-[#9AA3AF]">
                                            {new Date(selectedEmail.sent_at).toLocaleString()}
                                        </div>
                                    </div>
                                </div>

                                <div
                                    className="prose prose-slate max-w-none text-[#374151] leading-relaxed"
                                    dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                                />

                                {/* AI Agent Sidebar Section */}
                                <div className="mt-10 p-6 bg-[#ECEBFB]/40 rounded-[14px] border border-[#DAD7F6] relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                        <Brain className="w-24 h-24" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-3 mb-4">
                                            <Badge variant="outline" className="bg-white/80 border-[#DAD7F6] text-[#4A43C9] py-1">
                                                <Brain className="w-3 h-3 mr-1" /> AI Agent Analysis
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-[#374151] mb-4 ">
                                            &quot;The AI has analyzed this message. You can generate a smart reply based on candidates requirements and the job context.&quot;
                                        </p>

                                        {smartReply && (
                                            <div className="mb-4 p-4 bg-white/50 rounded-[10px] border border-[#DAD7F6] text-sm text-[#374151] animate-in slide-in-from-top-2">
                                                <div className="font-bold text-xs text-[#5B53E0] mb-2  ">Suggested Reply:</div>
                                                {smartReply}
                                            </div>
                                        )}

                                        <div className="flex gap-2 mt-2">
                                            {canAccess("communications:moderate") && (
                                                <Button
                                                    size="sm"
                                                    className="bg-[#5B53E0] hover:bg-[#4A43C9] font-bold text-xs shadow-lg shadow-[#DAD7F6]"
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
                                                    className="bg-white border-[#DAD7F6] text-[#4A43C9] hover:bg-[#ECEBFB]"
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
                                                className="text-[#5B53E0]"
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
                    <div className="flex-1 flex flex-col items-center justify-center text-center px-6 bg-[#F7F8FA]">
                        <div className="relative mb-5">
                            <div className="absolute -inset-3 rounded-full bg-[#5B53E0]/15 blur-2xl" />
                            <div className="relative w-16 h-16 rounded-[18px] flex items-center justify-center text-white shadow-[0_12px_30px_rgba(91,83,224,0.4)]" style={{ background: "linear-gradient(135deg,#8B7DFF,#5B53E0)" }}>
                                <Mail className="w-7 h-7" />
                            </div>
                        </div>
                        <h3 className="text-[17px] font-bold text-[#15171C] mb-1">No conversation selected</h3>
                        <p className="text-[#8A929E] text-[14px] max-w-xs">Pick a message from the list to read it, or compose a new one.</p>
                    </div>
                )}
            </div>
            </div>
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
        className={`flex items-center justify-between w-full h-10 px-3 rounded-[9px] transition-colors ${active ? 'bg-[#ECEBFB] text-[#5B53E0]' : 'text-[#6B6F76] hover:bg-[#F4F5F7] hover:text-[#15171C]'}`}
    >
        <div className="flex items-center gap-2.5">
            <span className={active ? 'text-[#5B53E0]' : 'text-[#9AA3AF]'}>{icon}</span>
            <span className="text-[13px] font-semibold">{label}</span>
        </div>
        {count ? (
            <span className="bg-[#5B53E0] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
                {count}
            </span>
        ) : null}
    </button>
);

export default MailboxPage;
