
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Loader2, BrainCircuit, Sparkles, CheckCircle2, XCircle, ArrowRight, HelpCircle, Info } from "lucide-react";
import { getDailyQuiz, submitQuizResult } from "@/app/actions/game-actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Production Daily Quiz Widget for MAP261125.
 * UK-EN: Regulatory consciousness gamification hosted by Frank Tadsworth-Bids.
 */
export function DailyQuizWidget() {
  const { userProfile } = useUser();
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await getDailyQuiz();
      if (res.success) {
        setQuiz(res.data);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSubmit = async () => {
    if (selectedOption === null || !quiz || isSubmitted) return;
    
    setIsPending(true);
    const correct = selectedOption === quiz.correctIndex;
    setIsCorrect(correct);
    setIsSubmitted(true);

    if (userProfile) {
        await submitQuizResult(userProfile.uid, userProfile.displayName, quiz.id, correct);
    }

    if (correct) {
        toast({ title: "Spot on, partner!", description: "You mastered today's regulatory challenge. +15 Ranking Points awarded!" });
    } else {
        toast({ variant: "destructive", title: "Not quite!", description: "Frank says: Every day is a school day in property auctions!" });
    }
    setIsPending(false);
  };

  if (loading) return <Card className="animate-pulse h-64 flex items-center justify-center bg-muted/10 border-dashed"><Loader2 className="animate-spin" /></Card>;
  if (!quiz) return null;

  return (
    <Card className="border-l-4 border-l-blue-600 bg-gradient-to-br from-white to-blue-50/30 overflow-hidden shadow-md relative h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-blue-700 font-headline uppercase tracking-tight text-lg">
              <BrainCircuit className="h-5 w-5" />
              Frank's Quiz of the Day
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                Daily Regulatory Intel Check
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-[9px] border-blue-200 text-blue-700 bg-blue-50 font-black">
            {quiz.topic}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="bg-white/80 backdrop-blur-sm p-5 rounded-2xl border border-blue-100 shadow-sm relative group">
            <div className="absolute -top-3 -left-2 bg-blue-600 text-white p-1.5 rounded-lg shadow-lg rotate-[-10deg] group-hover:rotate-0 transition-transform">
                <HelpCircle className="h-4 w-4" />
            </div>
            <p className="text-sm font-bold text-slate-900 leading-relaxed pl-4">
                "{quiz.question}"
            </p>
        </div>

        <div className="grid gap-2">
            {quiz.options.map((option: string, idx: number) => {
                const isSelected = selectedOption === idx;
                const isCorrectOption = quiz.correctIndex === idx;
                const showSuccess = isSubmitted && isCorrectOption;
                const showError = isSubmitted && isSelected && !isCorrect;

                return (
                    <button
                        key={idx}
                        disabled={isSubmitted}
                        onClick={() => setSelectedOption(idx)}
                        className={cn(
                            "w-full text-left p-4 rounded-xl text-xs font-medium transition-all border-2 flex items-center justify-between group",
                            isSelected && !isSubmitted ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-100 bg-slate-50/50 text-slate-600 hover:border-blue-200 hover:bg-white",
                            showSuccess ? "border-emerald-500 bg-emerald-50 text-emerald-800" : "",
                            showError ? "border-destructive bg-destructive/5 text-destructive" : "",
                            isSubmitted && !isSelected && !isCorrectOption ? "opacity-40 grayscale" : ""
                        )}
                    >
                        <span className="flex-1">{option}</span>
                        {showSuccess && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                        {showError && <XCircle className="h-4 w-4 text-destructive" />}
                        {!isSubmitted && <ArrowRight className={cn("h-4 w-4 transition-all opacity-0 group-hover:opacity-100 group-hover:translate-x-1", isSelected ? "opacity-100 text-blue-600" : "text-slate-300")} />}
                    </button>
                );
            })}
        </div>

        {!isSubmitted ? (
            <Button 
                onClick={handleSubmit} 
                disabled={selectedOption === null || isPending}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black h-12 shadow-lg transition-all active:scale-[0.98]"
            >
                {isPending ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                SUBMIT FINAL ANSWER
            </Button>
        ) : (
            <div className={cn(
                "p-4 rounded-xl border-l-4 animate-in fade-in slide-in-from-top-2 duration-300",
                isCorrect ? "bg-emerald-50 border-l-emerald-500 text-emerald-900" : "bg-slate-100 border-l-slate-400 text-slate-800"
            )}>
                <div className="flex items-center gap-2 mb-1">
                    {isCorrect ? <Trophy className="h-4 w-4 text-emerald-600" /> : <Info className="h-4 w-4 text-slate-500" />}
                    <span className="text-[10px] font-black uppercase tracking-widest">{isCorrect ? 'Excellence Achieved' : 'Professional Guidance'}</span>
                </div>
                <p className="text-xs font-medium italic leading-relaxed">
                    "{quiz.explanation}"
                </p>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
