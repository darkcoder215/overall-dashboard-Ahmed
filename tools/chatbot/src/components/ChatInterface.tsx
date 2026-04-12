import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ChatMessage from "./ChatMessage";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: any[];
}

interface ChatInterfaceProps {
  userRole: string;
  userId: string;
}

interface DocOption {
  id: string;
  title: string;
}

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`;

const ChatInterface = ({ userRole, userId }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [documents, setDocuments] = useState<DocOption[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<string>("all");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchDocs = async () => {
      const { data } = await supabase
        .from("documents")
        .select("id, title")
        .eq("status", "processed")
        .order("created_at", { ascending: false });
      setDocuments(data || []);
    };
    fetchDocs();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = async () => {
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: Message = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const resp = await fetch(FUNCTION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          message: trimmed,
          conversation_id: conversationId,
          user_role: userRole,
          user_id: userId,
          document_id: selectedDoc,
        }),
      });

      if (!resp.ok) throw new Error("فشل في الاتصال بالمساعد");

      const data = await resp.json();
      if (data.error) throw new Error(data.error);
      if (data.conversation_id) setConversationId(data.conversation_id);

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data.response, citations: data.citations },
      ]);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "حدث خطأ");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* ── Document Filter Bar ── */}
      <div className="border-b border-border bg-card/60 px-3 sm:px-4 py-2 sm:py-3 backdrop-blur-sm" dir="rtl">
        <div className="mx-auto flex max-w-3xl items-center gap-2 sm:gap-3">
          <Filter className="h-4 w-4 shrink-0 text-brand-green" />
          <span className="font-ui text-xs sm:text-sm font-bold text-foreground shrink-0">البحث في:</span>
          <Select value={selectedDoc} onValueChange={setSelectedDoc}>
            <SelectTrigger className="h-9 flex-1 rounded-xl border-border bg-background font-ui text-sm text-center transition-colors" dir="rtl">
              <SelectValue placeholder="جميع المستندات" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border border-border bg-card shadow-lg z-50" dir="rtl">
              <SelectItem value="all" className="rounded-lg font-ui text-center font-medium">جميع المستندات</SelectItem>
              {documents.map((doc) => (
                <SelectItem key={doc.id} value={doc.id} className="rounded-lg font-ui text-center font-medium">
                  {doc.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ── Messages Area ── */}
      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="mx-auto max-w-3xl space-y-6">
          {/* Empty State — brand-aligned welcome */}
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-10 sm:py-20 text-center animate-fade-in-up px-2" dir="rtl">
              {/* Logo in black container per brand guidelines */}
              <div className="mb-4 sm:mb-6 flex h-16 w-16 sm:h-24 sm:w-24 items-center justify-center rounded-2xl bg-black p-3 sm:p-4 shadow-lg transition-transform duration-300 hover:scale-105">
                <img src={`${import.meta.env.BASE_URL}thamanyah.png`} alt="ثمانية" className="h-full w-full object-contain" />
              </div>

              <h2 className="mb-2 font-display text-xl sm:text-2xl font-bold text-foreground">
                مساعد ثمانية الذكي
              </h2>
              <p className="max-w-md font-body text-xs sm:text-sm leading-relaxed text-muted-foreground">
                اسألني عن أي سياسة أو معلومة من المستندات المتاحة وسأجيبك مع ذكر المصادر
              </p>

              {/* Suggested question chips — pill shape per brand */}
              <div className="mt-6 sm:mt-8 flex flex-wrap justify-center gap-2 stagger-children">
                {["ما هي السياسات المتاحة؟", "أخبرني عن الإجازات", "ما هي حقوق الموظف؟"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="rounded-full border border-border bg-card px-3 sm:px-5 py-2 sm:py-2.5 font-ui text-[11px] sm:text-xs text-foreground shadow-sm transition-all duration-200 hover:border-brand-green/30 hover:bg-brand-green/5 hover:shadow-md"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message list */}
          {messages.map((m, i) => (
            <div key={i} className="animate-fade-in-up" style={{ animationDelay: `${i * 40}ms` }}>
              <ChatMessage
                role={m.role}
                content={m.content}
                citations={m.citations}
                onSuggestedQuestion={(q) => setInput(q)}
              />
            </div>
          ))}

          {/* Loading indicator — typing dots animation */}
          {isLoading && (
            <div className="flex items-center gap-3 animate-fade-in" dir="rtl">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-black p-1.5">
                <img src={`${import.meta.env.BASE_URL}thamanyah.png`} alt="ثمانية" className="h-5 w-5 object-contain" />
              </div>
              <div className="flex items-center gap-1.5 rounded-2xl bg-card px-4 py-3 border border-border">
                {/* Three animated dots */}
                <span className="inline-block h-2 w-2 rounded-full bg-brand-green" style={{ animation: "typing-dot 1.4s ease-in-out infinite", animationDelay: "0ms" }} />
                <span className="inline-block h-2 w-2 rounded-full bg-brand-green" style={{ animation: "typing-dot 1.4s ease-in-out infinite", animationDelay: "200ms" }} />
                <span className="inline-block h-2 w-2 rounded-full bg-brand-green" style={{ animation: "typing-dot 1.4s ease-in-out infinite", animationDelay: "400ms" }} />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* ── Input Bar ── */}
      <div className="border-t border-border bg-card/60 p-2 sm:p-4 backdrop-blur-sm">
        <form
          onSubmit={(e) => { e.preventDefault(); sendMessage(); }}
          className="mx-auto flex max-w-3xl gap-2 sm:gap-3"
          dir="rtl"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="اكتب سؤالك هنا..."
            className="h-10 sm:h-12 flex-1 rounded-xl border-border bg-background font-ui text-sm transition-all duration-200 focus:border-brand-green focus:ring-1 focus:ring-brand-green/30"
            disabled={isLoading}
          />
          {/* Accent send button: green per brand CTA guidelines */}
          <Button
            type="submit"
            size="icon"
            disabled={isLoading || !input.trim()}
            className="h-10 w-10 sm:h-12 sm:w-12 shrink-0 rounded-xl bg-brand-green text-white shadow-sm transition-all duration-200 hover:bg-brand-green/90 hover:shadow-md disabled:bg-muted disabled:text-muted-foreground"
          >
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
