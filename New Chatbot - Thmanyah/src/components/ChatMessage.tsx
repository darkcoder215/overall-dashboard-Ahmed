import ReactMarkdown from "react-markdown";
import { User, FileText, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface Citation {
  document_title: string;
  section_title: string | null;
  content_preview?: string;
}

interface ChatMessageProps {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
  onSuggestedQuestion?: (q: string) => void;
}

const ChatMessage = ({ role, content, citations, onSuggestedQuestion }: ChatMessageProps) => {
  const isAssistant = role === "assistant";
  const [showRefs, setShowRefs] = useState(false);

  const suggestedQuestions: string[] = [];
  if (isAssistant && content.includes("أسئلة يمكنني")) {
    const lines = content.split("\n");
    let inSuggestions = false;
    for (const line of lines) {
      if (line.includes("أسئلة يمكنني")) {
        inSuggestions = true;
        continue;
      }
      if (inSuggestions) {
        const match = line.match(/^[-\d.•*]+\s*(.+)/);
        if (match) {
          suggestedQuestions.push(match[1].trim().replace(/[?؟]*$/, "؟"));
        }
      }
    }
  }

  const uniqueCitations = citations
    ? [...new Map(citations.map((c) => [`${c.document_title}-${c.section_title}`, c])).values()]
    : [];

  return (
    <div className={`flex gap-3 ${isAssistant ? "" : "flex-row-reverse"}`} dir="rtl">
      {/* Avatar */}
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-transform duration-200 hover:scale-105 ${
          isAssistant
            ? "bg-black p-1.5"
            : "bg-brand-green/10 text-brand-green"
        }`}
      >
        {isAssistant ? (
          <img src="/thamanyah.png" alt="ثمانية" className="h-5 w-5 object-contain" />
        ) : (
          <User className="h-4 w-4" />
        )}
      </div>

      <div className={`flex max-w-[85%] flex-col gap-2 ${isAssistant ? "" : "items-end"}`}>
        {/* Message Bubble */}
        <div
          className={`rounded-2xl px-4 py-3 font-body text-sm leading-relaxed transition-shadow duration-200 ${
            isAssistant
              ? "bg-card text-card-foreground border border-border shadow-sm hover:shadow-md"
              : "bg-brand-green text-white shadow-sm"
          }`}
        >
          <div className="prose prose-sm dark:prose-invert max-w-none [&_h2]:font-display [&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1 [&_h3]:font-display [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-2 [&_h3]:mb-1 [&_strong]:text-brand-green [&_li]:my-0.5 [&_a]:text-brand-blue [&_a]:underline">
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        </div>

        {/* Suggested questions as pill chips */}
        {isAssistant && suggestedQuestions.length > 0 && onSuggestedQuestion && (
          <div className="flex flex-wrap gap-1.5 px-1 stagger-children">
            {suggestedQuestions.map((q, i) => (
              <button
                key={i}
                onClick={() => onSuggestedQuestion(q)}
                className="rounded-full border border-brand-green/20 bg-brand-green/5 px-3 py-1.5 font-ui text-xs text-brand-green transition-all duration-200 hover:bg-brand-green/15 hover:border-brand-green/40 hover:shadow-sm"
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Expandable source references */}
        {isAssistant && uniqueCitations.length > 0 && (
          <div className="w-full px-1">
            <button
              onClick={() => setShowRefs(!showRefs)}
              className="flex items-center gap-1.5 font-ui text-xs text-muted-foreground transition-colors duration-200 hover:text-foreground"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>المراجع ({uniqueCitations.length})</span>
              {showRefs ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
            </button>

            {showRefs && (
              <div className="mt-2 space-y-2 stagger-children">
                {uniqueCitations.map((c, i) => (
                  <div
                    key={i}
                    className="rounded-xl border border-border bg-background/50 p-3 font-ui text-xs transition-all duration-200 hover:border-brand-green/20 hover:shadow-sm"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {/* Citation number badge with green highlight */}
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-brand-green/10 font-bold text-[10px] text-brand-green">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-foreground">{c.document_title}</span>
                      {c.section_title && (
                        <span className="text-muted-foreground">— {c.section_title}</span>
                      )}
                    </div>
                    {c.content_preview && (
                      <p className="text-muted-foreground leading-relaxed border-r-2 border-brand-green/30 pr-2 whitespace-pre-wrap">
                        {c.content_preview}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatMessage;
