"use client";

import { useState, useEffect } from "react";
import { useUser } from "@/firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trophy, Flame, Loader2, Gavel, Sparkles, Info, X } from "lucide-react";
import { getDailyGame, submitGameResult, getGameLeaderboard } from "@/app/actions/game-actions";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * @fileOverview Production Daily Game Widget for MAP261125.
 * Features clinical high-legibility tiles and robust validation protocol.
 */
export function DailyGameWidget() {
  const { userProfile } = useUser();
  const { toast } = useToast();
  const [game, setGame] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [userInput, setUserInput] = useState("");
  const [gridInput, setGridInput] = useState<string[][]>(Array(4).fill(null).map(() => Array(4).fill("")));
  const [scrambledPool, setScrambledPool] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [isBonus, setIsBonus] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await getDailyGame();
      if (res.success) {
        setGame(res.data);
        if (res.data.type === 'WordGrid') {
            const letters = (Array.isArray(res.data.solution) ? res.data.solution.flat().join('') : String(res.data.solution))
                .split('')
                .sort(() => Math.random() - 0.5);
            setScrambledPool(letters);
        }
      }
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRevealed && !solved && startTime) {
      interval = setInterval(() => {
        setCurrentTime(Date.now() - startTime);
      }, 10);
    }
    return () => clearInterval(interval);
  }, [isRevealed, solved, startTime]);

  const handleReveal = () => {
    setIsRevealed(true);
    setStartTime(Date.now());
  };

  const handleCheck = async () => {
    if (!game) return;
    
    setAttempts(prev => prev + 1);
    
    let isCorrect = false;
    let localIsBonus = false;

    if (game.type === 'Franagram') {
        if (!userInput.trim()) return;
        const normalisedInput = userInput.toLowerCase().replace(/\s+/g, '').trim();
        const normalisedSolution = game.solution.toLowerCase().replace(/\s+/g, '').trim();
        isCorrect = normalisedInput === normalisedSolution;
    } else if (game.type === 'WordGrid') {
        // Validation Forensic: Check if the 4x4 grid is a valid word square
        // and uses the same letters as the reference.
        // Forensic: Handle legacy string solutions or unexpected formats
        const isArraySolution = Array.isArray(game.solution);
        const flatSolution = isArraySolution 
            ? game.solution.flat().join('').toLowerCase() 
            : String(game.solution).replace(/\s+/g, '').toLowerCase();

        const flatInput = gridInput.flat().join('').toLowerCase();
        
        // 1. Check if all cells filled
        if (flatInput.length < 16) {
             toast({ 
                variant: "destructive", 
                title: "Incomplete Grid", 
                description: "Frank says: Every cell in the grid needs a letter, partner!" 
            });
            return;
        }

        // 2. Check if rows match columns (Word Square Identity)
        let isWordSquare = true;
        for (let i = 0; i < 4; i++) {
            const row = gridInput[i].join('').toLowerCase();
            const col = gridInput.map(r => r[i]).join('').toLowerCase();
            if (row !== col) {
                isWordSquare = false;
                break;
            }
        }

        // 3. Check letter pool (must use exact same letters)
        const sortedInput = flatInput.split('').sort().join('');
        const sortedSolution = flatSolution.split('').sort().join('');
        const poolMatches = sortedInput === sortedSolution;

        if (isWordSquare && poolMatches) {
            isCorrect = true;
            // 4. Check for Bonus (Unique Solution)
            if (flatInput !== flatSolution) {
                localIsBonus = true;
                setIsBonus(true);
            }
        }
    }

    if (isCorrect) {
      const duration = Date.now() - (startTime || Date.now());
      setSolved(true);
      setIsSubmitting(true);
      
      if (userProfile) {
        await submitGameResult(
            userProfile.uid, 
            userProfile.displayName, 
            game.date, 
            duration, 
            attempts + 1
        );
      }
      
      const leaderRes = await getGameLeaderboard(game.date);
      if (leaderRes.success) {
        setLeaderboard(leaderRes.data);
      }
      
      toast({ 
        title: localIsBonus ? "BONUS UNLOCKED!" : "Brilliant!", 
        description: localIsBonus 
            ? `Fantastic! A unique word square solution in ${(duration/1000).toFixed(3)}s!` 
            : `You solved Frank's challenge in ${(duration/1000).toFixed(3)}s!` 
      });
      setIsSubmitting(false);
    } else {
      toast({ 
        variant: "destructive", 
        title: "Not quite, partner!", 
        description: game.type === 'Franagram' 
            ? "Frank says: Check the spelling or try another combination." 
            : "Frank says: The grid must be a word square (rows === columns) using today's letters."
      });
    }
  };

  const updateGridInput = (r: number, c: number, val: string) => {
    const newGrid = [...gridInput.map(row => [...row])];
    newGrid[r][c] = val.slice(-1).toUpperCase();
    setGridInput(newGrid);
    
    // Auto-focus next cell
    if (val && c < 3) {
        const next = document.getElementById(`grid-${r}-${c+1}`);
        next?.focus();
    } else if (val && c === 3 && r < 3) {
        const next = document.getElementById(`grid-${r+1}-0`);
        next?.focus();
    }
  };

  if (loading) return <Card className="animate-pulse h-64 flex items-center justify-center bg-muted/10 border-dashed"><Loader2 className="animate-spin" /></Card>;
  if (!game) return null;

  const anagramText = game.type === 'Franagram' ? (game.puzzle.anagram || game.puzzle) : '';
  
  // UK Date/Time Helpers
  const formatUKDate = (dateStr: string) => {
    const [y, m, d] = dateStr.split('-');
    return `${d}/${m}/${y}`;
  };

  const formatUKTime = () => {
    return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
        timeZone: 'Europe/London'
    }).format(new Date());
  };

  return (
    <Card className="border-l-4 border-l-brand-secondary bg-gradient-to-br from-white to-brand-secondary/5 overflow-hidden shadow-md relative h-full">
      {isRevealed && !solved && (
          <div className="absolute top-4 right-4 z-10 flex items-center gap-1.5 px-3 py-1 scale-90 md:scale-100 rounded-full bg-brand-secondary/10 border border-brand-secondary/20 shadow-sm transition-all duration-300">
             <div className="h-2 w-2 rounded-full bg-brand-secondary animate-pulse" />
             <span className="text-[11px] font-mono font-bold text-brand-secondary tracking-tight">
                {(currentTime/1000).toFixed(3)}s
             </span>
          </div>
      )}
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-brand-secondary font-headline">
              <Gavel className="h-5 w-5" />
              {game.type} of the Day
            </CardTitle>
            <CardDescription className="text-xs font-medium">
                {formatUKDate(game.date)} | {formatUKTime()} GMT/BST
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-6 w-6 text-brand-secondary hover:bg-brand-secondary/10"
                onClick={() => setShowInstructions(!showInstructions)}
            >
                {showInstructions ? <X className="h-4 w-4" /> : <Info className="h-4 w-4" />}
            </Button>
            {userProfile?.winningStreak ? (
                <Badge variant="secondary" className="flex items-center gap-1 bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">
                <Flame className="h-3 w-3 fill-orange-500" />
                {userProfile.winningStreak}
                </Badge>
            ) : null}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {showInstructions && (
            <div className="bg-white border-2 border-brand-secondary/20 p-4 rounded-lg text-xs space-y-2 animate-in fade-in zoom-in-95 duration-200">
                <p className="font-bold text-brand-secondary uppercase tracking-widest text-[10px]">How to Play:</p>
                {game.type === 'Franagram' ? (
                    <p className="text-slate-600 leading-relaxed">
                        Unscramble the jumbled letters to find a common UK property or auction term. 
                        Enter the full word in the box below and click check.
                    </p>
                ) : (
                    <p className="text-slate-600 leading-relaxed">
                        Find the hidden word square where the words read the same horizontally and vertically.
                        Enter any of the primary words found in the grid to solve the challenge.
                    </p>
                )}
                <Button variant="link" size="sm" className="p-0 h-auto text-[10px] font-bold" onClick={() => setShowInstructions(false)}>Got it!</Button>
            </div>
        )}

        {!isRevealed ? (
            <div className="bg-slate-50 p-8 rounded-xl border-2 border-dashed border-brand-secondary/20 text-center space-y-6">
                <div>
                    <Badge variant="outline" className="mb-2 border-brand-secondary/30 text-brand-secondary bg-white">
                        TIME-SENSITIVE OPERATION
                    </Badge>
                    <h3 className="text-lg font-bold text-slate-900">Today's Frank-a-gram is Locked</h3>
                    <p className="text-sm text-muted-foreground max-w-xs mx-auto mt-2">
                        Today Frank has set a {game.type} puzzle. The timer starts exactly when you reveal the puzzle. 
                        Players are ranked by their accuracy and speed.
                    </p>
                </div>
                <Button 
                    onClick={handleReveal} 
                    size="lg"
                    className="bg-brand-secondary hover:bg-brand-secondary/90 text-white font-bold h-14 px-8 shadow-lg transition-all active:scale-95 group"
                >
                    Reveal Today's Puzzle
                    <Sparkles className="ml-2 h-5 w-5 group-hover:animate-pulse" />
                </Button>
            </div>
        ) : !solved ? (
          <>
            <div className="bg-slate-50 p-6 rounded-xl border-2 border-dashed border-brand-secondary/20 text-center relative overflow-hidden">
              <div className="absolute top-2 right-4 flex items-center gap-1.5 text-[10px] font-mono font-bold text-brand-secondary animate-pulse">
                <div className="h-1.5 w-1.5 rounded-full bg-brand-secondary" />
                TIMING: {(currentTime/1000).toFixed(3)}s
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Today's Frank-a-gram</p>
              
              {game.type === 'Franagram' ? (
                <div className="flex flex-wrap justify-center gap-3 mb-2">
                  {anagramText.split('').map((char: string, i: number) => (
                    <div key={i} className="w-14 h-14 flex items-center justify-center bg-white border-2 border-brand-secondary/30 rounded-lg text-3xl font-black text-slate-900 shadow-sm transition-transform hover:scale-105 select-none">
                      {char.toUpperCase()}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col md:flex-row gap-8 justify-center items-center pb-2">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-thicker text-muted-foreground text-center">Reference Letters</p>
                    {/* Fixed 180px width (40px*4 + 2px*3 gap + 24px padding) */}
                    <div className="grid grid-cols-4 gap-2 p-4 bg-slate-50 rounded-xl border-2 border-slate-200 shadow-sm w-[200px] h-[200px]">
                        {scrambledPool.map((char: string, i: number) => (
                          <div key={i} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 rounded text-xl font-black text-slate-800 select-none shadow-sm">
                            {char.toUpperCase()}
                          </div>
                        ))}
                    </div>
                  </div>

                  <div className="hidden md:block h-24 w-px bg-slate-200" />

                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-thicker text-muted-foreground text-center">Your Solution</p>
                    <div className="grid grid-cols-4 gap-2 p-4 bg-white rounded-xl border-2 border-brand-secondary/40 shadow-xl w-[200px] h-[200px]">
                        {gridInput.map((row, r) => (
                            row.map((cell, c) => (
                                <input
                                    key={`${r}-${c}`}
                                    id={`grid-${r}-${c}`}
                                    className="w-10 h-10 text-center text-xl font-black text-slate-900 bg-slate-50 border border-slate-200 rounded focus:ring-2 focus:ring-brand-secondary focus:border-transparent outline-none transition-all shadow-inner uppercase"
                                    value={cell}
                                    maxLength={1}
                                    onChange={(e) => updateGridInput(r, c, e.target.value)}
                                    autoComplete="off"
                                />
                            ))
                        ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3">
              {game.type === 'Franagram' ? (
                <div className="flex gap-2">
                    <Input 
                        placeholder="Your solution..." 
                        className="h-11 font-bold text-center border-brand-secondary/30 focus:ring-brand-secondary bg-white shadow-sm"
                        value={userInput}
                        onChange={(e) => setUserInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleCheck()}
                        autoComplete="off"
                        autoCorrect="off"
                    />
                    <Button onClick={handleCheck} className="h-11 px-6 font-bold bg-brand-secondary hover:bg-brand-secondary/90 shadow-md transition-all active:scale-95" disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "Check"}
                    </Button>
                </div>
              ) : (
                <Button onClick={handleCheck} className="h-12 w-full font-black text-lg bg-brand-secondary hover:bg-brand-secondary/90 shadow-lg transition-all active:scale-[0.98]" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="animate-spin h-4 w-4" /> : "VERIFY WORD SQUARE"}
                </Button>
              )}
              
              <div className="flex items-center gap-2 p-2 rounded-md bg-white/50 border border-brand-secondary/10">
                <Sparkles className="h-3 w-3 text-brand-secondary shrink-0" />
                <p className="text-[10px] text-muted-foreground font-medium italic leading-tight">
                    Frank says: "{game.hint}"
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="py-6 text-center space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="relative inline-block">
              <Trophy className="h-12 w-12 text-yellow-500 mx-auto animate-bounce" />
              <div className="absolute inset-0 bg-yellow-400 blur-2xl opacity-20 -z-10 rounded-full" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">
                {isBonus ? "Bonus Achievement!" : "Mission Accomplished!"}
              </h3>
              <p className="text-xs text-muted-foreground font-medium">
                {isBonus ? "You discovered an alternative word square! " : ""}
                Verified Time: <span className="text-brand-secondary font-bold">{(currentTime/1000).toFixed(3)}s</span>
              </p>
            </div>
            
            <div className="w-full bg-slate-50/50 rounded-lg border border-brand-secondary/10 p-4">
                <div className="flex items-center gap-2 mb-3">
                    <Trophy className="h-4 w-4 text-brand-secondary" />
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-700">Today's Top Performers</h4>
                </div>
                <div className="space-y-2">
                    {leaderboard.length > 0 ? leaderboard.map((res, i) => (
                        <div key={res.id} className="flex justify-between items-center text-[10px] py-1 border-b border-brand-secondary/5 last:border-0">
                            <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-400 w-4">{i + 1}.</span>
                                <span className={cn("font-semibold", res.userId === userProfile?.uid ? "text-brand-secondary" : "text-slate-600")}>
                                    {res.userName || "Anonymous Partner"}
                                </span>
                            </div>
                            <span className="font-mono text-slate-500">{(res.timeTakenMs / 1000).toFixed(3)}s</span>
                        </div>
                    )) : <p className="text-[10px] text-muted-foreground italic">No times recorded yet. You're the trailblazer!</p>}
                </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
