"use client";
import { Button } from "../../components/ui/button";
import { Check, Clipboard } from 'lucide-react';
import { useState } from "react";
export function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); };
  return (
    <div className="relative">
      <pre className="bg-muted p-4 rounded-md text-sm overflow-x-auto"><code>{code}</code></pre>
      <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-7 w-7" onClick={handleCopy}>
        {copied ? <Check className="h-4 w-4" /> : <Clipboard className="h-4 w-4" />}
      </Button>
    </div>
  );
}
