"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { bytesToHex, Hex } from "viem";
import { toast } from "sonner";
import type { Game } from "@/lib/games";
import { randomBytes } from "@/lib/games";
import GameWindow from "@/components/GameWindow";
import SpeedCrashWindow from "./SpeedCrashWindow";
import SpeedCrashSetupCard from "./SpeedCrashSetupCard";
import { useCrashGame } from "@/hooks/useCrashGame";
import { useMultiplierAnimation } from "@/hooks/useMultiplierAnimation";
import { useCrashStats } from "@/hooks/useCrashStats";
import { CRASH_CONFIG } from "@/config/crash-config";

interface SpeedCrashProps {
    game: Game;
}

const SpeedCrash: React.FC<SpeedCrashProps> = ({ game }) => {
    // ── View state ──────────────────────────────────────────────
    const [currentView, setCurrentView] = useState<0 | 1 | 2>(0);
    const [isLoading, setIsLoading] = useState(false);
    const [gameOver, setGameOver] = useState(false);

    // ── Game ID (for replay tracking) ───────────────────────────
    const [currentGameId, setCurrentGameId] = useState<bigint>(
        BigInt(bytesToHex(new Uint8Array(randomBytes(32))))
    );

    // ── Game hooks ──────────────────────────────────────────────
    const { gameState, placeBet, setTarget, setBet, isActive } = useCrashGame();
    const { stats, recordRound } = useCrashStats();

    // ── Derived state ───────────────────────────────────────────
    const lastResult = gameState.lastResult;
    const won = lastResult ? lastResult.won : null;
    const winAmount = lastResult ? lastResult.winAmount : 0;

    // ── Track state transitions for view changes ────────────────
    const prevStateRef = useRef(gameState.state);

    useEffect(() => {
        const prev = prevStateRef.current;
        const curr = gameState.state;
        prevStateRef.current = curr;

        // Flying started → ongoing view
        if (curr === "FLYING" && prev !== "FLYING") {
            setCurrentView(1);
            setIsLoading(false);
        }

        // Game ended → game over view
        if ((curr === "WIN" || curr === "CRASHED") && prev === "FLYING") {
            // Record stats
            if (lastResult && lastResult.timestamp) {
                recordRound(
                    lastResult.betAmount,
                    lastResult.won,
                    lastResult.winAmount,
                    lastResult.crashPoint
                );
            }

            // Brief delay for animation, then show game over
            setTimeout(() => {
                setCurrentView(2);
                setGameOver(true);
            }, curr === "WIN" ? CRASH_CONFIG.animation.winCelebration : CRASH_CONFIG.animation.resultPause);
        }
    }, [gameState.state, lastResult, recordRound]);

    // ── Lifecycle functions ──────────────────────────────────────
    const playGame = useCallback(async () => {
        if (gameState.betAmount <= 0) {
            toast.error("Please set a bet amount");
            return;
        }
        if (gameState.balance < gameState.betAmount) {
            toast.error("Insufficient balance");
            return;
        }

        setIsLoading(true);
        setGameOver(false);

        // Simulate transaction delay
        setTimeout(() => {
            placeBet();
        }, 500);
    }, [gameState.betAmount, gameState.balance, placeBet]);

    const handleReset = useCallback(() => {
        const newGameId = BigInt(bytesToHex(new Uint8Array(randomBytes(32))));
        setCurrentGameId(newGameId);
        setCurrentView(0);
        setGameOver(false);
        setIsLoading(false);
    }, []);

    const handlePlayAgain = useCallback(async () => {
        const newGameId = BigInt(bytesToHex(new Uint8Array(randomBytes(32))));
        setCurrentGameId(newGameId);
        setGameOver(false);
        setCurrentView(0);

        // Small delay then auto-play
        setTimeout(async () => {
            await playGame();
        }, 100);
    }, [playGame]);

    const handleRewatch = useCallback(() => {
        // Reset to ongoing view — the last result data is still available
        setCurrentView(1);
        setGameOver(false);
    }, []);

    // ── Payout for GameWindow results modal ─────────────────────
    const payout = won ? winAmount : 0;
    const shouldShowPNL = won === true && winAmount > gameState.betAmount;

    return (
        <div className="flex flex-col lg:flex-row gap-4 sm:gap-8 lg:gap-10">
            {/* Game Window */}
            <GameWindow
                game={game}
                currentGameId={currentGameId}
                isLoading={isLoading}
                isGameFinished={gameOver}
                onPlayAgain={handlePlayAgain}
                onRewatch={handleRewatch}
                onReset={handleReset}
                betAmount={gameState.betAmount}
                payout={payout}
                inReplayMode={false}
                isUserOriginalPlayer={true}
                showPNL={shouldShowPNL}
                isGamePaused={false}
            >
                <SpeedCrashWindow
                    currentMultiplier={gameState.currentMultiplier}
                    targetMultiplier={gameState.targetMultiplier}
                    crashPoint={gameState.crashPoint}
                    state={gameState.state}
                    elapsedTime={gameState.elapsedTime}
                />
            </GameWindow>

            {/* Setup Card */}
            <SpeedCrashSetupCard
                game={game}
                onPlay={playGame}
                onRewatch={handleRewatch}
                onReset={handleReset}
                onPlayAgain={handlePlayAgain}
                currentView={currentView}
                betAmount={gameState.betAmount}
                setBetAmount={setBet}
                targetMultiplier={gameState.targetMultiplier}
                setTargetMultiplier={setTarget}
                currentMultiplier={gameState.currentMultiplier}
                crashPoint={gameState.crashPoint}
                won={won}
                winAmount={winAmount}
                isLoading={isLoading}
                walletBalance={gameState.balance}
                stats={stats}
            />
        </div>
    );
};

export default SpeedCrash;
