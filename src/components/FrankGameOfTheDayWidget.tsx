
"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
    Trophy, Flame, Loader2, Gavel, Sparkles, Info, X, 
    BrainCircuit, CheckCircle2, XCircle, ArrowRight, HelpCircle 
} from "lucide-react";
import { 
    getFrankGameOfTheDay, 
    getFrankLeaderboard,
    getFrankUserGameProgress,
    updateFrankGameProgress 
} from "@/app/actions/game-actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Unified "Frank's Game of the Day" Widget.
 * UK-EN: Randomized rotation between Franagram, WordGrid, and Regulatory Quiz.
 * Objective: Consolidate gamification into a single, high-fidelity dashboard anchor.
 */
export function FrankGameOfTheDayWidget() {
  const { userProfile } = useUser();
  const { toast } = useToast();
  
  // State Management
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isRevealed, setIsRevealed] = useState(false);
  const [solved, setSolved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  
  // Puzzle-specific State
  const [userInput, setUserInput] = useState("");
  const [gridInput, setGridInput] = useState<string[][]>(Array(4).fill(null).map(() => Array(4).fill("")));
  const [scrambledPool, setScrambledPool] = useState<string[]>([]);
  const [attempts, setAttempts] = useState(0);

  // Quiz-specific State
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isCorrect, setIsCorrect] = useState(false);

  // Load Game of the Day & User Progress
  useEffect(() => {
    async function load() {
      const res = await getFrankGameOfTheDay();
      if (res.success) {
        setGame(res.data);
        if (res.data.type === 'WordGrid') {
            const letters = (Array.isArray(res.data.solution) ? res.data.solution.flat().join('') : String(res.data.solution))
                .split('')
                .sort(() => Math.random() - 0.5);
            setScrambledPool(letters);
        }

        // Check for existing progress
        if (userProfile) {
            const prog = await getFrankUserGameProgress(userProfile.uid, res.data.date);
            if (prog.success && prog.data) {
                const data = prog.data;
                if (data.status === 'in-progress' || data.status === 'completed') {
                    setIsRevealed(true);
                    setAttempts(data.attempts || 0);
                    setCurrentTime(data.timeTakenMs || 0);
                    
                    if (data.status === 'completed') {
                        setSolved(true);
                        setIsCorrect(data.isCorrect ?? true);
                        const leaderRes = await getFrankLeaderboard(res.data.date);
                        if (leaderRes.success) setLeaderboard(leaderRes.data);
                    } else {
                        // Resume timer if not completed
                        setStartTime(Date.now() - (data.timeTakenMs || 0));
                    }
                }
            }
        }
      }
      setLoading(false);
    }
    load();
  }, [userProfile]); // Reload if user info becomes available

  // Timer Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRevealed && !solved && startTime && game?.type !== 'Quiz') {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - startTime);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRevealed, solved, startTime, game]);

  const handleReveal = async () => {
    setIsRevealed(true);
    const now = Date.now();
    setStartTime(now);
    
    if (userProfile && game) {
        await updateFrankGameProgress({
            userId: userProfile.uid,
            userName: userProfile.displayName,
            gameId: game.date,
            type: game.type,
            status: 'in-progress',
            attempts: 0,
            timeMs: 0
        });
    }
  };

  const handleCheckPuzzle = async () => {
    if (!game) return;
    setAttempts(prev => prev + 1);
    
    let correct = false;
    if (game.type === 'Franagram') {
        const input = userInput.toLowerCase().replace(/\s+/g, '').trim();
        const solution = game.solution.toLowerCase().replace(/\s+/g, '').trim();
        correct = input === solution;
    } else if (game.type === 'WordGrid') {
        const flatInput = gridInput.flat().join('').toLowerCase();
        if (flatInput.length < 16) return;

        let isWordSquare = true;
        for (let i = 0; i < 4; i++) {
            const row = gridInput[i].join('').toLowerCase();
            const col = gridInput.map(r => r[i]).join('').toLowerCase();
            if (row !== col) { isWordSquare = false; break; }
        }

        const sortedInput = flatInput.split('').sort().join('');
        const flatSolution = Array.isArray(game.solution) ? game.solution.flat().join('').toLowerCase() : String(game.solution).toLowerCase();
        const sortedSolution = flatSolution.split('').sort().join('');
        correct = isWordSquare && sortedInput === sortedSolution;
    }

    const duration = Date.now() - (startTime || Date.now());
    const finalAttempts = attempts + 1;
    setAttempts(finalAttempts);
    setCurrentTime(duration);

    if (correct) {
      setSolved(true);
      setIsSubmitting(true);
      
      if (userProfile) {
        await updateFrankGameProgress({
            userId: userProfile.uid,
            userName: userProfile.displayName,
            gameId: game.date,
            type: game.type,
            status: 'completed',
            timeMs: duration,
            attempts: finalAttempts
        });
      }
      
      const leaderRes = await getFrankLeaderboard(game.date);
      if (leaderRes.success) setLeaderboard(leaderRes.data);
      
      toast({ title: "Spot on, partner!", description: `Solved in ${(duration/1000).toFixed(3)}s!` });
      setIsSubmitting(false);
    } else {
      // Sync failed attempt to Firestore
      if (userProfile) {
        await updateFrankGameProgress({
            userId: userProfile.uid,
            userName: userProfile.displayName,
            gameId: game.date,
            type: game.type,
            status: 'in-progress',
            timeMs: duration,
            attempts: finalAttempts
        });
      }
      toast({ variant: "destructive", title: "Not quite!", description: "Frank says: Check your spelling and try again." });
    }
  };

  const handleSubmitQuiz = async () => {
    if (selectedOption === null || !game || game.type !== 'Quiz') return;
    
    setIsSubmitting(true);
    const correct = selectedOption === game.correctIndex;
    setIsCorrect(correct);
    setSolved(true);

    if (userProfile) {
        await updateFrankGameProgress({
            userId: userProfile.uid,
            userName: userProfile.displayName,
            gameId: game.date,
            type: 'Quiz',
            status: 'completed',
            isCorrect: correct,
            attempts: attempts + 1
        });
    }

    toast({ 
        title: correct ? "Excellence Achieved!" : "Professional Development Required", 
        description: correct ? "+15 Ranking Points awarded!" : "Frank says: Every day is a school day!" 
    });
    setIsSubmitting(false);
  };

  const updateGridInput = (r: number, c: number, val: string) => {
    const newGrid = [...gridInput.map(row => [...row])];
    newGrid[r][c] = val.slice(-1).toUpperCase();
    setGridInput(newGrid);
    if (val && c < 3) document.getElementById(`grid-${r}-${c+1}`)?.focus();
    else if (val && c === 3 && r < 3) document.getElementById(`grid-${r+1}-0`)?.focus();
  };

  if (loading) return <Card className="animate-pulse h-80 flex items-center justify-center bg-muted/10 border-dashed"><Loader2 className="animate-spin text-primary" /></Card>;
  if (!game) return null;

  const isQuiz = game.type === 'Quiz';
  const themeColor = isQuiz ? "border-l-blue-600" : "border-l-brand-secondary";
  const titleColor = isQuiz ? "text-blue-700" : "text-brand-secondary";

  return (
    <Card className={cn("bg-gradient-to-br from-white to-slate-50 shadow-lg relative h-full flex flex-col border-l-4", themeColor)}>
      {isRevealed && !solved && !isQuiz && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-secondary/10 border border-brand-secondary/20 animate-in fade-in zoom-in-95">
             <div className="h-2 w-2 rounded-full bg-brand-secondary animate-pulse" />
             <span className="text-[11px] font-mono font-bold text-brand-secondary tracking-tight">{(currentTime/1000).toFixed(3)}s</span>
          </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className={cn("flex items-center gap-2 font-headline uppercase tracking-tight text-lg", titleColor)}>
              {isQuiz ? <BrainCircuit className="h-5 w-5" /> : <Gavel className="h-5 w-5" />}
              Frank's {game.type} of the Day
            </CardTitle>
            <CardDescription className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                {isQuiz ? "Regulatory Intel Check" : "Property Puzzle Challenge"}
            </CardDescription>
          </div>
          {isQuiz ? (
             <Badge className="text-[9px] font-black bg-blue-50 text-blue-700 border-blue-200 uppercase">{game.topic}</Badge>
          ) : (
            <div className="flex items-center gap-1">
                {userProfile?.winningStreak ? (
                    <Badge variant="secondary" className="flex items-center gap-1 bg-orange-50 text-orange-600 border-orange-100 uppercase text-[9px]">
                        <Flame className="h-3 w-3 fill-orange-500" /> {userProfile.winningStreak} Streak
                    </Badge>
                ) : null}
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-6 flex flex-col justify-center">
        {!isRevealed ? (
            <div className="bg-white p-8 rounded-2xl border-2 border-dashed border-slate-200 text-center space-y-6 shadow-inner">
                <div className="space-y-2">
                    <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 uppercase text-[9px] font-black tracking-[0.2em]">Locked Operation</Badge>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">Frank Has Set Your Daily Task</h3>
                    <p className="text-xs text-slate-500 font-medium max-w-[240px] mx-auto leading-relaxed">
                        Engage with today's {isQuiz ? 'Regulatory Quiz' : 'Property Puzzle'} to earn ranking points and build your professional streak.
                    </p>
                </div>
                <Button onClick={handleReveal} size="lg" className="bg-slate-900 hover:bg-black text-white font-black h-12 px-8 shadow-xl transition-all active:scale-95 group">
                    Reveal the Challenge
                    <Sparkles className="ml-2 h-4 w-4 group-hover:animate-pulse" />
                </Button>
            </div>
        ) : !solved ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {/* GAME MODES */}
                {game.type === 'Quiz' ? (
                    <div className="space-y-6">
                        <div className="bg-white p-5 rounded-2xl border border-blue-100 shadow-sm relative group">
                            <div className="absolute -top-3 -left-2 bg-blue-600 text-white p-1.5 rounded-lg shadow-lg rotate-[-5deg]">
                                <HelpCircle className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-bold text-slate-900 leading-relaxed pl-3 italic">"{game.question}"</p>
                        </div>
                        <div className="grid gap-2">
                            {game.options.map((opt: string, i: number) => (
                                <button
                                    key={i}
                                    onClick={() => setSelectedOption(i)}
                                    className={cn(
                                        "w-full text-left p-4 rounded-xl text-xs font-semibold border-2 transition-all flex items-center justify-between group",
                                        selectedOption === i ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-100 bg-slate-50/50 text-slate-500 hover:border-blue-200"
                                    )}
                                >
                                    <span>{opt}</span>
                                    <ArrowRight className={cn("h-4 w-4 transition-all", selectedOption === i ? "opacity-100 translate-x-1 text-blue-600" : "opacity-0")} />
                                </button>
                            ))}
                        </div>
                        <Button onClick={handleSubmitQuiz} disabled={selectedOption === null || isSubmitting} className="w-full h-12 bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg">
                            {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "SUBMIT FINAL ANSWER"}
                        </Button>
                    </div>
                ) : game.type === 'Franagram' ? (
                    <div className="space-y-6 text-center">
                        <div className="flex flex-wrap justify-center gap-2">
                            {(game.puzzle.anagram || game.puzzle).split('').map((c: string, i: number) => (
                                <div key={i} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-slate-200 rounded-xl text-2xl font-black text-slate-800 shadow-sm transition-transform hover:scale-105 select-none uppercase">
                                    {c}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <Input 
                                placeholder="Your solution..." 
                                className="h-11 font-black text-center border-slate-200 shadow-inner"
                                value={userInput}
                                onChange={(e) => setUserInput(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleCheckPuzzle()}
                            />
                            <Button onClick={handleCheckPuzzle} className="h-11 px-6 bg-slate-900 font-bold" disabled={isSubmitting}>Check</Button>
                        </div>
                        <div className="flex items-center gap-2 p-3 bg-white border rounded-xl">
                            <Info className="h-4 w-4 text-brand-secondary shrink-0" />
                            <p className="text-[10px] text-slate-500 font-medium italic text-left leading-relaxed">"{game.hint}"</p>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6 flex flex-col items-center">
                        <div className="grid grid-cols-4 gap-2 bg-slate-100 p-4 rounded-xl shadow-inner border">
                            {scrambledPool.map((c: string, i: number) => (
                                <div key={i} className="w-10 h-10 flex items-center justify-center bg-white border rounded-lg text-lg font-black text-slate-400 select-none uppercase">{c}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-4 gap-2 bg-white p-4 rounded-2xl border-2 border-brand-secondary/40 shadow-2xl">
                            {gridInput.map((row, r) => row.map((cell, c) => (
                                <input
                                    key={`${r}-${c}`}
                                    id={`grid-${r}-${c}`}
                                    className="w-10 h-10 text-center text-xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-brand-secondary outline-none transition-all uppercase"
                                    value={cell}
                                    maxLength={1}
                                    onChange={(e) => updateGridInput(r, c, e.target.value)}
                                    autoComplete="off"
                                />
                            )))}
                        </div>
                        <Button onClick={handleCheckPuzzle} className="w-full h-12 bg-brand-secondary hover:bg-brand-secondary/90 text-white font-black shadow-lg">VERIFY WORD SQUARE</Button>
                    </div>
                )}
            </div>
        ) : (
            <div className="text-center py-6 space-y-6 animate-in zoom-in-95 fade-in duration-500">
                <div className="relative inline-block">
                    <Trophy className={cn("h-14 w-14 mx-auto animate-bounce", isCorrect ? "text-emerald-500" : "text-yellow-500")} />
                    <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-brand-secondary animate-pulse" />
                </div>
                
                <div className="space-y-1">
                    <h3 className="text-xl font-black text-slate-900 uppercase">Challenge Complete</h3>
                    {isQuiz ? (
                        <div className={cn("mt-4 p-4 rounded-xl border-l-4 text-left shadow-sm", isCorrect ? "bg-emerald-50 border-emerald-500 text-emerald-900" : "bg-slate-100 border-slate-500 text-slate-800")}>
                            <p className="text-[10px] font-black uppercase tracking-widest mb-1">{isCorrect ? 'Excellence Achieved' : 'Professional Guidance'}</p>
                            <p className="text-xs font-bold leading-relaxed italic">"{game.explanation}"</p>
                        </div>
                    ) : (
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Performance Time: <span className="text-brand-secondary">{(currentTime/1000).toFixed(3)}s</span></p>
                    )}
                </div>

                {!isQuiz && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <div className="flex items-center gap-2 mb-3">
                            <Trophy className="h-4 w-4 text-brand-secondary" />
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-700">Daily Top Performers</h4>
                        </div>
                        <div className="space-y-1">
                            {leaderboard.length > 0 ? leaderboard.map((res, i) => (
                                <div key={res.id} className="flex justify-between items-center text-[10px] py-1 border-b border-slate-100 last:border-0">
                                    <span className="font-bold text-slate-400">{i+1}. {res.userName}</span>
                                    <span className="font-mono text-brand-secondary font-black">{(res.timeTakenMs/1000).toFixed(3)}s</span>
                                </div>
                            )) : <p className="text-[10px] text-slate-400 italic">No times recorded. You're the trailblazer!</p>}
                        </div>
                    </div>
                )}

                <Button variant="outline" className="w-full text-[10px] font-black uppercase tracking-widest" onClick={() => window.location.reload()}>Return Tomorrow</Button>
            </div>
        )}
      </CardContent>
    </Card>
  );
}
