"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Send } from "lucide-react";
import { toast } from "sonner";

interface NotesThreadProps {
  serviceCallId: Id<"serviceCalls">;
  mobile?: boolean;
}

const NOTE_TYPE_LABELS: Record<string, string> = {
  message: "Message",
  general: "General",
  return_required: "Return Required",
  swap: "Swap",
  preventable: "Preventable",
  swap_required: "Swap Required",
};

export function NotesThread({ serviceCallId, mobile = false }: NotesThreadProps) {
  const notes = useQuery(api.callNotes.listByServiceCall, { serviceCallId });
  const createNote = useMutation(api.callNotes.create);
  const { user } = useCurrentUser();

  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState<string>("message");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [notes]);

  const handleSubmit = async () => {
    if (!content.trim()) return;
    setSending(true);
    try {
      await createNote({
        serviceCallId,
        content: content.trim(),
        noteType: noteType as "message" | "general" | "return_required" | "swap" | "preventable" | "swap_required",
      });
      setContent("");
    } catch {
      toast.error("Failed to send");
    } finally {
      setSending(false);
    }
  };

  const formatTime = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  const currentUserId = user?._id;

  const renderNote = (note: NonNullable<typeof notes>[number]) => {
    const isOwn = note.authorId === currentUserId;
    const isMessage = note.noteType === "message";

    // Chat-bubble style for messages
    if (isMessage) {
      return (
        <div
          key={note._id}
          className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
        >
          <div
            className={`max-w-[80%] rounded-2xl text-sm ${mobile ? "px-4 py-2.5" : "px-3 py-2"} ${
              isOwn
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-muted rounded-bl-md"
            }`}
          >
            {!isOwn && (
              <p className={`font-medium mb-0.5 ${mobile ? "text-xs" : "text-[10px]"} ${isOwn ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                {note.authorName}
              </p>
            )}
            <p className={`whitespace-pre-wrap ${mobile ? "text-sm" : "text-xs"}`}>
              {note.content}
            </p>
            <p className={`mt-0.5 ${mobile ? "text-[10px]" : "text-[9px]"} ${isOwn ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
              {formatTime(note._creationTime)}
            </p>
          </div>
        </div>
      );
    }

    // System-style note for structured types
    return (
      <div
        key={note._id}
        className={`rounded-md border bg-muted/30 text-sm ${mobile ? "p-3" : "p-2"}`}
      >
        <div className="flex items-center gap-2 mb-1">
          <span className={`font-medium ${mobile ? "text-sm" : "text-xs"}`}>{note.authorName}</span>
          <span className={`text-muted-foreground ${mobile ? "text-xs" : "text-[10px]"}`}>
            {formatTime(note._creationTime)}
          </span>
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            {NOTE_TYPE_LABELS[note.noteType] ?? note.noteType}
          </Badge>
        </div>
        <p className={`whitespace-pre-wrap ${mobile ? "text-sm" : "text-xs"}`}>{note.content}</p>
      </div>
    );
  };

  return (
    <div className={`flex flex-col ${mobile ? "h-full" : ""}`}>
      <h4 className={`font-semibold mb-2 ${mobile ? "text-base" : "text-sm"}`}>Messages & Notes</h4>

      <div ref={scrollRef} className={`space-y-2 overflow-y-auto pr-1 mb-3 ${mobile ? "flex-1" : "max-h-[300px]"}`}>
        {notes === undefined ? (
          <p className="text-xs text-muted-foreground">Loading...</p>
        ) : notes.length === 0 ? (
          <p className="text-xs text-muted-foreground">No messages yet. Start a conversation.</p>
        ) : (
          notes.map(renderNote)
        )}
      </div>

      {mobile ? (
        <div className="flex items-center gap-2 pt-2 border-t">
          <input
            type="text"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-h-[48px] rounded-lg border border-input bg-background px-4 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
          />
          <Button
            size="lg"
            onClick={handleSubmit}
            disabled={!content.trim() || sending}
            className="min-h-[48px] min-w-[48px] px-3"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Type a message..."
            className="text-sm min-h-[60px] rounded-md"
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                handleSubmit();
              }
            }}
          />
          <div className="flex items-center gap-2">
            <Select value={noteType} onValueChange={(v) => v && setNoteType(v)}>
              <SelectTrigger className="flex-1 h-8 rounded-md text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NOTE_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value} className="text-xs">
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={handleSubmit}
              disabled={!content.trim() || sending}
              className="gap-1 h-8 rounded-md text-sm"
            >
              <Send className="h-3.5 w-3.5" />
              Send
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
