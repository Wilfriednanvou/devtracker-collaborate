import { useState, useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Profile {
  id: string;
  full_name: string;
}

interface MentionInputProps {
  value: string;
  onChange: (value: string, mentionedUserIds: string[]) => void;
  placeholder?: string;
  className?: string;
}

export const MentionInput = ({
  value,
  onChange,
  placeholder,
  className,
}: MentionInputProps) => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<Profile[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    const { data } = await supabase.from("profiles").select("id, full_name");
    if (data) {
      setProfiles(data);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const position = e.target.selectionStart;
    setCursorPosition(position);

    // Check for @ mentions
    const textBeforeCursor = newValue.substring(0, position);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    if (lastAtIndex !== -1 && lastAtIndex === position - 1) {
      // Just typed @
      setSuggestions(profiles);
      setShowSuggestions(true);
    } else if (lastAtIndex !== -1) {
      // Typing after @
      const searchTerm = textBeforeCursor.substring(lastAtIndex + 1);
      if (searchTerm.includes(" ")) {
        setShowSuggestions(false);
      } else {
        const filtered = profiles.filter((p) =>
          p.full_name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setSuggestions(filtered);
        setShowSuggestions(filtered.length > 0);
      }
    } else {
      setShowSuggestions(false);
    }

    // Extract mentioned user IDs from the text
    const mentionRegex = /@\[([^\]]+)\]\(([^)]+)\)/g;
    const matches = [...newValue.matchAll(mentionRegex)];
    const userIds = matches.map((match) => match[2]);
    setMentionedUsers(userIds);

    onChange(newValue, userIds);
  };

  const insertMention = (profile: Profile) => {
    const textBeforeCursor = value.substring(0, cursorPosition);
    const textAfterCursor = value.substring(cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf("@");

    const mention = `@[${profile.full_name}](${profile.id})`;
    const newValue =
      textBeforeCursor.substring(0, lastAtIndex) + mention + " " + textAfterCursor;

    const newMentionedUsers = [...mentionedUsers, profile.id];
    setMentionedUsers(newMentionedUsers);
    onChange(newValue, newMentionedUsers);
    setShowSuggestions(false);

    // Focus back on textarea
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPosition = lastAtIndex + mention.length + 1;
        textareaRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  // Display value with highlighted mentions
  const displayValue = value.replace(
    /@\[([^\]]+)\]\([^)]+\)/g,
    "@$1"
  );

  return (
    <div className="relative">
      <Textarea
        ref={textareaRef}
        value={displayValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={className}
      />

      {showSuggestions && (
        <div className="absolute z-50 mt-1 w-full max-h-60 overflow-auto bg-popover border rounded-md shadow-md">
          {suggestions.map((profile) => (
            <button
              key={profile.id}
              onClick={() => insertMention(profile)}
              className="w-full px-4 py-2 text-left hover:bg-accent transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-medium">
                    {profile.full_name.charAt(0)}
                  </span>
                </div>
                <span className="text-sm">{profile.full_name}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-muted-foreground mt-1">
        Tapez @ pour mentionner un utilisateur
      </p>
    </div>
  );
};
