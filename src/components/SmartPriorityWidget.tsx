
"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Brain, Sparkles, CheckCircle2, ChevronRight, Loader2, AlertCircle, Clock } from "lucide-react";
import { getSmartPriorityList } from "@/app/actions/server-actions";

interface SmartPriorityWidgetProps {
  userRole: string;
  organisationId?: string;
  branchIds?: string[];
}

export function SmartPriorityWidget({ userRole, organisationId, branchIds }: SmartPriorityWidgetProps) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPriorities() {
      try {
        const result = await getSmartPriorityList(userRole, organisationId, branchIds);
        if (result.success) {
          setData(result.data);
        } else {
          setError(result.error || "Intelligence Engine Offline");
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    }
    loadPriorities();
  }, [userRole, organisationId, branchIds]);

  if (loading) {
    return (
      <Card className="h-full shadow-sm border-l-4 border-l-brand-primary bg-slate-50/50">
        <CardHeader className="pb-3 border-b bg-muted/5">
          <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center">
            <Brain className="mr-2 h-4 w-4 text-brand-primary animate-pulse" />
            Generating Intelligence...
          </CardTitle>
        </CardHeader>
        <CardContent className="h-[400px] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="h-full border-l-4 border-l-destructive/50">
        <CardContent className="p-8 text-center text-sm text-muted-foreground italic">
          <AlertCircle className="mx-auto h-8 w-8 mb-4 opacity-20" />
          Intelligence Engine Interrupted: {error}
        </CardContent>
      </Card>
    );
  }

  const tasks = data?.tasks || [];
  const commentary = data?.frankCommentary || "Steady activity monitored across all instructions.";

  return (
    <Card className="h-full flex flex-col shadow-lg border-l-4 border-l-brand-primary overflow-hidden bg-white">
      <CardHeader className="flex-shrink-0 border-b bg-muted/5 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center text-lg font-headline text-slate-900">
            <Brain className="mr-2 h-5 w-5 text-brand-primary" />
            Smart Priority List
          </CardTitle>
          <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest bg-brand-primary/5 text-brand-primary border-brand-primary/20">
            <Sparkles className="mr-1 h-3 w-3" /> AI Driven
          </Badge>
        </div>
        <CardDescription className="text-xs italic text-slate-500 line-clamp-2 mt-1">
          &quot;{commentary}&quot; — Frank
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1 p-0 overflow-y-auto">
        <div className="divide-y divide-slate-100">
          {tasks.length > 0 ? (
            tasks.map((task: any) => (
              <div key={task.id} className="p-4 hover:bg-slate-50/50 transition-colors group cursor-pointer">
                <div className="flex items-start gap-4">
                  <div className={`mt-1 p-2 rounded-full ${
                    task.priority === 'Critical' ? 'bg-red-50 text-red-600' :
                    task.priority === 'High' ? 'bg-orange-50 text-orange-600' :
                    'bg-blue-50 text-blue-600'
                  }`}>
                    {task.priority === 'Critical' ? <AlertCircle className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase font-bold tracking-tight text-slate-400">
                        {task.category}
                      </span>
                      <Badge variant="outline" className="text-[9px] font-black h-4 px-1.5 uppercase border-none bg-slate-100/50">
                        {task.priority}
                      </Badge>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-brand-primary transition-colors">
                      {task.title}
                    </h4>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {task.description}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-slate-300 self-center group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            ))
          ) : (
            <div className="p-8 text-center space-y-4">
                <CheckCircle2 className="mx-auto h-12 w-12 text-green-100" />
                <p className="text-sm text-muted-foreground font-medium italic">
                    All mission-critical tasks are up to date for your role.
                </p>
            </div>
          )}
        </div>
      </CardContent>

      <div className="p-4 bg-slate-50/50 border-t flex items-center justify-between">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            Targeting: {userRole} Desk
        </span>
        <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-brand-primary h-7">
            Full Audit <ChevronRight className="ml-1 h-3 w-3" />
        </Button>
      </div>
    </Card>
  );
}
