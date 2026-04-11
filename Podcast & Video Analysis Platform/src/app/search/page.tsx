'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Send,
  MessageSquare,
  Clock,
  Podcast,
  Sparkles,
  ArrowLeft,
  Trash2,
  Bot,
  User,
} from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import PageHeader from '@/components/ui/PageHeader';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import type { SearchResult, ChatMessage } from '@/types';

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchMode, setSearchMode] = useState<'none' | 'keyword' | 'semantic'>('none');
  const [isChatting, setIsChatting] = useState(false);
  const [activeTab, setActiveTab] = useState<'search' | 'chat'>('search');
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setSearchResults(data.results || []);
      setSearchMode(data.mode || 'keyword');
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: chatInput,
      timestamp: new Date(),
    };

    setChatMessages((prev) => [...prev, userMessage]);
    setChatInput('');
    setIsChatting(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: chatInput,
          history: chatMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });
      const data = await res.json();

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: data.response || 'عذراً، لم أتمكن من معالجة طلبك.',
        timestamp: new Date(),
        sources: data.sources,
      };

      setChatMessages((prev) => [...prev, assistantMessage]);
    } catch {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `error-${Date.now()}`,
          role: 'assistant',
          content: 'حدث خطأ أثناء المعالجة. الرجاء المحاولة مرة أخرى.',
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsChatting(false);
    }
  };

  return (
    <AppShell>
      <PageHeader
        title="البحث الذكي"
        subtitle="ابحث في محتوى البودكاستات أو اسأل الذكاء الاصطناعي"
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-brand-cream p-1 rounded-brand w-fit">
        <button
          onClick={() => setActiveTab('search')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors font-ui ${
            activeTab === 'search'
              ? 'bg-white text-brand-black shadow-sm'
              : 'text-brand-muted hover:text-brand-black'
          }`}
        >
          <Search className="w-4 h-4" />
          بحث في المحتوى
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors font-ui ${
            activeTab === 'chat'
              ? 'bg-white text-brand-black shadow-sm'
              : 'text-brand-muted hover:text-brand-black'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          محادثة ذكية
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'search' ? (
          <motion.div
            key="search"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 10 }}
          >
            {/* Search Bar */}
            <div className="flex gap-3 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="ابحث في محتوى البودكاستات... مثال: ريادة الأعمال، رؤية 2030"
                  className="w-full bg-white border border-brand-warmgray rounded-brand pr-10 pl-4 py-3 text-brand-black placeholder-brand-muted/50 focus:outline-none focus:border-brand-green/50 focus:ring-1 focus:ring-brand-green/20 transition-colors text-sm font-ui"
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleSearch}
                disabled={isSearching || !query.trim()}
                className="btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                {isSearching ? <LoadingSpinner size="sm" /> : <Search className="w-4 h-4" />}
                بحث
              </motion.button>
            </div>

            {/* Results */}
            {isSearching ? (
              <div className="flex items-center justify-center py-16">
                <div className="text-center">
                  <LoadingSpinner />
                  <p className="text-sm text-brand-muted mt-3 font-ui">جارٍ البحث...</p>
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <p className="text-xs text-brand-muted font-ui">
                    تم العثور على {searchResults.length} نتيجة
                  </p>
                  {searchMode === 'semantic' && (
                    <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-bold font-ui flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5" />
                      بحث ذكي
                    </span>
                  )}
                </div>
                {searchResults.map((result, index) => (
                  <motion.div
                    key={`${result.sceneId}-${index}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link href={`/transcript/${result.podcastId}`}>
                      <div className="brand-card p-4 hover:shadow-brand-md transition-all cursor-pointer group">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-brand bg-brand-greenlight/30 flex items-center justify-center flex-shrink-0">
                            <Podcast className="w-5 h-5 text-brand-green" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-brand-black text-sm font-ui">
                                {result.sceneTitle}
                              </h3>
                              <span className="px-2 py-0.5 rounded-full bg-brand-green/10 text-brand-green text-[10px] font-bold font-ui">
                                {(result.relevanceScore * 100).toFixed(0)}% تطابق
                              </span>
                            </div>
                            <p className="text-xs text-brand-muted mb-1 font-ui">
                              {result.podcastTitle}
                            </p>
                            <p className="text-sm text-brand-charcoal/70 line-clamp-2 font-body">
                              {result.content}
                            </p>
                            <div className="flex items-center gap-2 mt-2 text-xs text-brand-muted font-ui">
                              <Clock className="w-3 h-3" />
                              {result.timestamp}
                            </div>
                          </div>
                          <ArrowLeft className="w-4 h-4 text-brand-muted group-hover:text-brand-green group-hover:-translate-x-1 transition-all flex-shrink-0 mt-1" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : query && !isSearching ? (
              <EmptyState
                icon={Search}
                title="لا توجد نتائج"
                description="لم يتم العثور على نتائج مطابقة. جرّب كلمات بحث مختلفة."
              />
            ) : (
              <EmptyState
                icon={Search}
                title="ابدأ البحث"
                description="اكتب كلمات مفتاحية للبحث في محتوى جميع البودكاستات المحفوظة"
              />
            )}
          </motion.div>
        ) : (
          <motion.div
            key="chat"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="flex flex-col"
            style={{ height: 'calc(100vh - 260px)' }}
          >
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 px-1">
              {chatMessages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-16 h-16 rounded-2xl bg-brand-greenlight/30 flex items-center justify-center mb-4">
                    <Sparkles className="w-7 h-7 text-brand-green" />
                  </div>
                  <h3 className="text-lg font-bold text-brand-black mb-1 font-display">
                    المحادثة الذكية
                  </h3>
                  <p className="text-sm text-brand-muted max-w-sm mb-6 font-ui">
                    اسأل أي سؤال عن محتوى البودكاستات وسيجيبك الذكاء الاصطناعي
                    مع الإشارة إلى المصادر
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center max-w-md">
                    {[
                      'ما هي أهم نصائح ريادة الأعمال؟',
                      'لخّص حلقة الذكاء الاصطناعي',
                      'ما رأي الضيوف في رؤية 2030؟',
                    ].map((suggestion) => (
                      <button
                        key={suggestion}
                        onClick={() => {
                          setChatInput(suggestion);
                        }}
                        className="px-3 py-1.5 rounded-full bg-white border border-brand-warmgray text-xs text-brand-charcoal hover:border-brand-green/30 hover:text-brand-green transition-colors font-ui"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                chatMessages.map((msg) => (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${
                      msg.role === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-brand bg-brand-green flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-white" />
                      </div>
                    )}
                    <div
                      className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                        msg.role === 'user'
                          ? 'bg-brand-black text-white'
                          : 'brand-card'
                      }`}
                    >
                      <p className="text-sm leading-relaxed font-medium whitespace-pre-wrap font-body">
                        {msg.content}
                      </p>
                      {msg.sources && msg.sources.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-brand-warmgray/50">
                          <p className="text-[10px] font-bold text-brand-muted mb-1 font-ui">
                            المصادر:
                          </p>
                          {msg.sources.map((source, i) => (
                            <Link
                              key={i}
                              href={`/transcript/${source.podcastId}`}
                              className="block text-[10px] text-brand-blue hover:underline font-ui"
                            >
                              {source.podcastTitle} - {source.sceneTitle}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                    {msg.role === 'user' && (
                      <div className="w-8 h-8 rounded-brand bg-brand-cream border border-brand-warmgray/50 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-brand-charcoal" />
                      </div>
                    )}
                  </motion.div>
                ))
              )}
              {isChatting && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className="w-8 h-8 rounded-brand bg-brand-green flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className="brand-card px-4 py-3">
                    <div className="flex gap-1">
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                        className="w-2 h-2 rounded-full bg-brand-green"
                      />
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                        className="w-2 h-2 rounded-full bg-brand-green"
                      />
                      <motion.div
                        animate={{ opacity: [0.3, 1, 0.3] }}
                        transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                        className="w-2 h-2 rounded-full bg-brand-green"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Chat Input */}
            <div className="flex gap-3">
              {chatMessages.length > 0 && (
                <button
                  onClick={() => setChatMessages([])}
                  className="p-3 rounded-brand bg-white border border-brand-warmgray text-brand-muted hover:text-brand-red transition-colors"
                  title="مسح المحادثة"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleChat()}
                  placeholder="اكتب سؤالك هنا..."
                  disabled={isChatting}
                  className="w-full bg-white border border-brand-warmgray rounded-brand pr-4 pl-12 py-3 text-brand-black placeholder-brand-muted/50 focus:outline-none focus:border-brand-green/50 focus:ring-1 focus:ring-brand-green/20 transition-colors text-sm disabled:opacity-50 font-ui"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleChat}
                  disabled={isChatting || !chatInput.trim()}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-lg bg-brand-green text-white disabled:opacity-30 transition-opacity"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AppShell>
  );
}
