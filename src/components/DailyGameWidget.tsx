"use client";

import { useState, useEffect } from "react";
import { useUser } from "../firebase";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Trophy, Flame, Loader2, Gavel, Sparkles, Info, X } from "lucide-react";
import { getDailyGame, submitGameResult, getGameLeaderboard } from "../app/actions/game-actions";
import { useToast } from "../hooks/use-toast";
import { Badge } from "./ui/badge";
import { cn } from "../lib/utils";

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
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [solved, setSolved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    async function load() {
      const res = await getDailyGame();
      if (res.success) {
        setGame(res.data);
        // We don't start the timer here anymore, as per USER directive.
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
    if (!game || !userInput.trim()) return;
    
    setAttempts(prev => prev + 1);
    
    // Normalisation Protocol: Strict whitespace and case matching
    const normalisedInput = userInput.toLowerCase().replace(/\s+/g, '').trim();
    
    let isCorrect = false;
    if (game.type === 'Franagram') {
        const normalisedSolution = game.solution.toLowerCase().replace(/\s+/g, '').trim();
        isCorrect = normalisedInput === normalisedSolution;
    } else if (game.type === 'WordGrid' && Array.isArray(game.puzzle)) {
        // Validation Forensic: Accept any word that appears in the 4x4 word square
        // In a word square, the rows and columns are the same set of words.
        isCorrect = game.puzzle.some((row: string) => row.toLowerCase().replace(/\s+/g, '').trim() === normalisedInput);
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
        title: "Brilliant!", 
        description: `You solved Frank's challenge in ${(duration/1000).toFixed(3)}s!` 
      });
      setIsSubmitting(false);
    } else {
      toast({ 
        variant: "destructive", 
        title: "Not quite, partner!", 
        description: "Frank says: Check the spelling or try another word from the grid." 
      });
    }
  };

  if (loading) return <Card className="animate-pulse h-64 flex items-center justify-center bg-muted/10 border-dashed"><Loader2 className="animate-spin" /></Card>;
  if (!game) return null;

  const anagramText = game.type === 'Franagram' ? (game.puzzle.anagram || game.puzzle) : '';

  return (
    <Card className="border-l-4 border-l-brand-secondary bg-gradient-to-br from-white to-brand-secondary/5 overflow-hidden shadow-md relative h-full">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2 text-brand-secondary font-headline">
              <Gavel className="h-5 w-5" />
              Franagram of the Day
            </CardTitle>
            <CardDescription className="text-xs font-medium">Daily UK Property Brainteasers</CardDescription>
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
                        Players are ranked by their accuracy and speed to one-thousandth of a second.
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
                <div className="space-y-4">
                  <div className="grid grid-cols-4 gap-3 max-w-[240px] mx-auto">
                      {(game.puzzle as string[]).map((row: string, i: number) => (
                          <div key={i} className="contents">
                              {row.split('').map((char, j) => (
                                  <div key={`${i}-${j}`} className="w-12 h-12 flex items-center justify-center bg-white border-2 border-brand-secondary/30 rounded-md text-2xl font-black text-slate-900 shadow-sm transition-transform hover:scale-105 select-none">
                                    {char.toUpperCase()}
                                  </div>
                              ))}
                          </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex flex-col gap-3">
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
              <h3 className="text-xl font-bold text-slate-900 uppercase tracking-tight">Mission Accomplished!</h3>
              <p className="text-xs text-muted-foreground font-medium">Verified Time: <span className="text-brand-secondary font-bold">{(currentTime/1000).toFixed(3)}s</span></p>
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
