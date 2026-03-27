
import fs from "fs";
import path from "path";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText, ShieldCheck, History, BrainCircuit } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

// Define the static params for build time optimisation (SSG)
export async function generateStaticParams() {
  return [
    { slug: 'aml-compliance' },
    { slug: 'complaints-handling' }
  ];
}

interface WorkflowPageProps {
  params: { slug: string };
}

/**
 * @fileOverview Forensic Workflow Viewer.
 * UK-EN: Renders markdown compliance protocols with high-fidelity aesthetics.
 */
export default async function WorkflowViewerPage({ params }: WorkflowPageProps) {
  const { slug } = params;
  
  // Resolve the markdown file path
  const filePath = path.join(process.cwd(), '.agents', 'workflows', `${slug}.md`);
  
  if (!fs.existsSync(filePath)) {
    return notFound();
  }

  const rawContent = fs.readFileSync(filePath, 'utf8');
  
  // Simple frontmatter and markdown parsing (since we don't have a library)
  // We'll extract the title from the first # or frontmatter
  const lines = rawContent.split('\n');
  const titleLine = lines.find(l => l.startsWith('# ')) || lines.find(l => l.includes('description:')) || { replace: () => slug };
  const title = titleLine.toString().replace('# ', '').replace('description: ', '').trim();
  
  // Filter out frontmatter (lines between ---)
  let inFrontmatter = false;
  const filteredLines = lines.filter(line => {
    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter;
      return false;
    }
    return !inFrontmatter;
  });

  const content = filteredLines.join('\n');

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto py-8 px-4">
      <header className="flex items-center gap-4 mb-4">
        <Button variant="outline" size="icon" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-black font-headline text-slate-900 flex items-center gap-3 lowercase">
            <BrainCircuit className="h-8 w-8 text-primary" />
            {title}
          </h1>
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground italic">
            Official Production Protocol | TAD-PROT-{slug.toUpperCase()}
          </p>
        </div>
      </header>

      <Card className="bg-white shadow-2xl border-t-4 border-t-primary overflow-hidden">
        <CardHeader className="bg-slate-50 border-b p-8">
            <CardTitle className="text-xl font-black uppercase text-slate-800 tracking-tighter flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" /> Forensic Audit Pathway
            </CardTitle>
            <CardDescription className="font-medium text-slate-500 italic">
                Step-by-step procedural lifecycle for compliance verification.
            </CardDescription>
        </CardHeader>
        <CardContent className="p-12 prose prose-slate max-w-none">
          {/* Rendering Markdown with beautiful clinical styling */}
          <div className="space-y-8">
            {filteredLines.map((line, idx) => {
              if (line.startsWith('# ')) return null; // Already in header
              if (line.startsWith('## ')) return (
                <h2 key={idx} className="text-2xl font-black text-slate-900 border-b-2 border-slate-100 pb-2 flex items-center gap-2 mt-8">
                    <History className="h-5 w-5 text-primary/60" /> {line.replace('## ', '')}
                </h2>
              );
              if (line.startsWith('### ')) return <h3 key={idx} className="text-xl font-bold text-slate-800 mt-6">{line.replace('### ', '')}</h3>;
              if (line.startsWith('- ') || line.match(/^\d+\./)) return (
                <div key={idx} className="flex gap-4 items-start bg-slate-50/50 p-4 rounded-xl border border-slate-100/50 hover:bg-white hover:shadow-sm transition-all">
                    <span className="bg-primary text-white text-[10px] font-black px-2 py-0.5 rounded-full mt-1">
                        {line.match(/^\d+\./) ? line.split('.')[0] : '•'}
                    </span>
                    <p className="text-slate-700 font-medium leading-relaxed">
                        {line.replace(/^- |\d+\. /, '')}
                    </p>
                </div>
              );
              if (line.trim() === '') return <div key={idx} className="h-2" />;
              if (line.startsWith('---')) return <hr key={idx} className="my-8 border-slate-100" />;
              
              return <p key={idx} className="text-slate-600 font-medium leading-relaxed italic opacity-80">{line}</p>;
            })}
          </div>
        </CardContent>
      </Card>

      <footer className="text-center text-[10px] font-bold text-muted-foreground uppercase py-8 opacity-40">
        UK Legislation Compliance | The Auction Department Limited | Verified 2026
      </footer>
    </div>
  );
}
