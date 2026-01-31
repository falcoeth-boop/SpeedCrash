"use client";

import React from "react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Game } from "@/lib/games";
import BetAmountInput from "@/components/BetAmountInput";
import { CRASH_CONFIG } from "@/config/crash-config";
import { formatMultiplier } from "@/engine/MultiplierCurve";
import type { CrashSessionStats } from "@/types";

interface SpeedCrashSetupCardProps {
    game: Game;
    onPlay: () => void;
    onRewatch: () => void;
    onReset: () => void;
    onPlayAgain: () => void;
    currentView: 0 | 1 | 2;

    // Game state
    betAmount: number;
    setBetAmount: (amount: number) => void;
    targetMultiplier: number;
    setTargetMultiplier: (target: number) => void;
    currentMultiplier: number;
    crashPoint: number | null;
    won: boolean | null;
    winAmount: number;
    isLoading: boolean;
    walletBalance: number;
    stats: CrashSessionStats;
    isGamePaused?: boolean;
}

const SpeedCrashSetupCard: React.FC<SpeedCrashSetupCardProps> = ({
    game,
    onPlay,
    onRewatch,
    onReset,
    onPlayAgain,
    currentView,
    betAmount,
    setBetAmount,
    targetMultiplier,
    setTargetMultiplier,
    currentMultiplier,
    crashPoint,
    won,
    winAmount,
    isLoading,
    walletBalance,
    stats,
    isGamePaused = false,
}) => {
    const themeColor = game.themeColorBackground;
    const potentialPayout = betAmount * targetMultiplier;

    const [customTarget, setCustomTarget] = React.useState("");

    const handleCustomTargetSubmit = () => {
        const parsed = parseFloat(customTarget);
        if (!isNaN(parsed) && parsed >= CRASH_CONFIG.minTarget && parsed <= CRASH_CONFIG.maxTarget) {
            setTargetMultiplier(parsed);
        }
    };

    const handleCustomTargetKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter") handleCustomTargetSubmit();
    };

    // Check if current target matches any preset
    const isCustomValue = !CRASH_CONFIG.targetPresets.some(
        (p) => Math.abs(targetMultiplier - p) < 0.001
    );

    return (
        <Card className="lg:basis-1/3 p-6 flex flex-col">
            {/* ── View 0: Setup ─────────────────────────────── */}
            {currentView === 0 && (
                <>
                    <CardContent className="font-roboto">
                        {/* Launch button — mobile */}
                        <Button
                            onClick={onPlay}
                            className="lg:hidden w-full"
                            style={{ backgroundColor: themeColor, borderColor: themeColor }}
                            disabled={betAmount <= 0 || isGamePaused}
                        >
                            Launch 🚀
                        </Button>

                        {/* Bet amount — TOP */}
                        <div className="mt-5">
                            <BetAmountInput
                                min={0}
                                max={walletBalance}
                                step={0.1}
                                value={betAmount}
                                onChange={setBetAmount}
                                balance={walletBalance}
                                usdMode={false}
                                setUsdMode={() => {}}
                                disabled={isLoading}
                                themeColorBackground={themeColor}
                            />
                        </div>

                        {/* Target multiplier — BELOW bet amount */}
                        <div className="mt-6">
                            <label className="text-sm font-medium text-[#91989C] mb-2 block">
                                Target Multiplier
                            </label>

                            {/* Custom input field */}
                            <div className="flex gap-2 mb-3">
                                <div className="relative flex-1">
                                    <input
                                        type="number"
                                        min={CRASH_CONFIG.minTarget}
                                        max={CRASH_CONFIG.maxTarget}
                                        step={CRASH_CONFIG.targetStepFine}
                                        value={customTarget}
                                        onChange={(e) => setCustomTarget(e.target.value)}
                                        onKeyDown={handleCustomTargetKeyDown}
                                        onBlur={handleCustomTargetSubmit}
                                        placeholder={formatMultiplier(targetMultiplier)}
                                        className="w-full bg-[#1E2A35] text-white text-sm font-bold rounded-lg px-3 py-2 pr-8 outline-none focus:ring-2 placeholder:text-[#91989C] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                        style={{ focusRingColor: themeColor } as React.CSSProperties}
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#91989C] text-sm pointer-events-none">
                                        x
                                    </span>
                                </div>
                            </div>

                            {/* Quick preset buttons */}
                            <div className="flex gap-1.5 flex-wrap">
                                {CRASH_CONFIG.targetPresets.map((preset) => (
                                    <button
                                        key={preset}
                                        onClick={() => {
                                            setTargetMultiplier(preset);
                                            setCustomTarget("");
                                        }}
                                        className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                            Math.abs(targetMultiplier - preset) < 0.001
                                                ? "text-black shadow-lg"
                                                : "bg-[#1E2A35] text-[#91989C] hover:bg-[#2A3640]"
                                        }`}
                                        style={
                                            Math.abs(targetMultiplier - preset) < 0.001
                                                ? { backgroundColor: themeColor }
                                                : undefined
                                        }
                                    >
                                        {formatMultiplier(preset)}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </CardContent>

                    <div className="grow" />

                    <CardFooter className="mt-8 w-full flex flex-col font-roboto">
                        <div className="w-full flex flex-col items-center gap-2 font-medium text-xs text-[#91989C]">
                            <div className="w-full flex justify-between items-center gap-2">
                                <p>Target Multiplier</p>
                                <p className="text-right">{formatMultiplier(targetMultiplier)}</p>
                            </div>
                            <div className="w-full flex justify-between items-center gap-2">
                                <p>Potential Payout</p>
                                <p className="text-right">{potentialPayout.toFixed(2)} APE</p>
                            </div>
                            <div className="w-full flex justify-between items-center gap-2">
                                <p>Wallet Balance</p>
                                <p className="text-right">{walletBalance.toFixed(2)} APE</p>
                            </div>
                        </div>

                        <Button
                            onClick={onPlay}
                            className="hidden lg:flex mt-6 w-full"
                            style={{ backgroundColor: themeColor, borderColor: themeColor }}
                            disabled={betAmount <= 0 || isGamePaused}
                        >
                            Launch 🚀
                        </Button>
                    </CardFooter>
                </>
            )}

            {/* ── View 1: Ongoing (Flying) ──────────────────── */}
            {currentView === 1 && (
                <CardContent className="grow font-roboto flex flex-col justify-between gap-8">
                    {/* Live multiplier */}
                    <div className="text-center font-nohemia">
                        <p className="text-lg font-medium text-[#91989C]">Current Multiplier</p>
                        <p
                            className="mt-2 font-semibold text-4xl sm:text-6xl tabular-nums"
                            style={{ color: themeColor }}
                        >
                            {formatMultiplier(currentMultiplier)}
                        </p>
                    </div>

                    {/* Target info */}
                    <div className="text-center">
                        <p className="text-sm text-[#91989C]">Target</p>
                        <p className="text-xl font-bold text-amber-400">
                            {formatMultiplier(targetMultiplier)}
                        </p>
                    </div>

                    {/* Stats */}
                    <div className="w-full flex flex-col items-center gap-2 font-medium text-xs text-[#91989C]">
                        <div className="w-full flex justify-between items-center gap-2">
                            <p>Bet Amount</p>
                            <p className="text-right">{betAmount.toFixed(2)} APE</p>
                        </div>
                        <div className="w-full flex justify-between items-center gap-2">
                            <p>Potential Payout</p>
                            <p className="text-right">{potentialPayout.toFixed(2)} APE</p>
                        </div>
                    </div>
                </CardContent>
            )}

            {/* ── View 2: Game Over ─────────────────────────── */}
            {currentView === 2 && (
                <CardContent className="grow font-roboto flex flex-col justify-between gap-8">
                    {/* Result */}
                    <div className="text-center">
                        <p
                            className="text-3xl font-bold"
                            style={{ color: won ? "#22c55e" : "#ef4444" }}
                        >
                            {won ? "YOU WIN! 🎉" : "CRASHED 💥"}
                        </p>
                        {crashPoint !== null && (
                            <p className="text-lg text-[#91989C] mt-2">
                                Crashed at {formatMultiplier(crashPoint)}
                            </p>
                        )}
                        {won && winAmount > 0 && (
                            <p className="text-2xl font-bold text-green-400 mt-1">
                                +{winAmount.toFixed(2)} APE
                            </p>
                        )}
                    </div>

                    {/* Session stats */}
                    <div className="w-full flex flex-col items-center gap-2 font-medium text-xs text-[#91989C]">
                        <div className="w-full flex justify-between items-center gap-2">
                            <p>Rounds</p>
                            <p className="text-right">{stats.totalRounds}</p>
                        </div>
                        <div className="w-full flex justify-between items-center gap-2">
                            <p>W / L</p>
                            <p className="text-right">{stats.wins} / {stats.losses}</p>
                        </div>
                        <div className="w-full flex justify-between items-center gap-2">
                            <p>Net P&L</p>
                            <p
                                className="text-right"
                                style={{ color: stats.netPnL >= 0 ? "#22c55e" : "#ef4444" }}
                            >
                                {stats.netPnL >= 0 ? "+" : ""}{stats.netPnL.toFixed(2)} APE
                            </p>
                        </div>
                        <div className="w-full flex justify-between items-center gap-2">
                            <p>Wallet Balance</p>
                            <p className="text-right">{walletBalance.toFixed(2)} APE</p>
                        </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-3">
                        <Button
                            onClick={onPlayAgain}
                            className="w-full"
                            style={{ backgroundColor: themeColor, borderColor: themeColor }}
                            disabled={isGamePaused}
                        >
                            Play Again 🚀
                        </Button>
                        <Button
                            onClick={onRewatch}
                            className="w-full"
                            variant="secondary"
                        >
                            Rewatch
                        </Button>
                        <Button
                            onClick={onReset}
                            className="w-full"
                            variant="secondary"
                        >
                            Change Bet
                        </Button>
                    </div>
                </CardContent>
            )}
        </Card>
    );
};

export default SpeedCrashSetupCard;
