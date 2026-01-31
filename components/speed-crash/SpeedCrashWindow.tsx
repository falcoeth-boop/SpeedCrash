"use client";

import React from "react";
import type { CrashState } from "@/types";
import Background from "@/components/crash/Background";
import MultiplierScale from "@/components/crash/MultiplierScale";
import { Rocket } from "@/components/crash/Rocket";
import { CrashExplosion } from "@/components/crash/CrashExplosion";
import { MultiplierDisplay } from "@/components/crash/MultiplierDisplay";
import { multiplierToYPosition } from "@/engine/MultiplierCurve";

interface SpeedCrashWindowProps {
    currentMultiplier: number;
    targetMultiplier: number;
    crashPoint: number | null;
    state: CrashState;
    elapsedTime: number;
}

function getXFromTime(elapsedTime: number): number {
    if (elapsedTime <= 0) return -8;
    const timeScale = 10;
    return Math.min(92, (elapsedTime / timeScale) * 92);
}

function getRocketPosition(multiplier: number, elapsedTime: number) {
    const yNorm = multiplierToYPosition(multiplier);
    return { x: getXFromTime(elapsedTime), y: yNorm * 85 };
}

const SpeedCrashWindow: React.FC<SpeedCrashWindowProps> = ({
    currentMultiplier,
    targetMultiplier,
    crashPoint,
    state,
    elapsedTime,
}) => {
    const explosionPosition = getRocketPosition(currentMultiplier, elapsedTime);

    return (
        <div className="absolute inset-0 z-10 overflow-hidden">
            {/* Background overlay */}
            <div className="absolute inset-0 z-0">
                <Background />
            </div>

            {/* Scale */}
            <div className="absolute inset-0 z-10">
                <MultiplierScale
                    currentMultiplier={currentMultiplier}
                    targetMultiplier={targetMultiplier}
                    state={state}
                />
            </div>

            {/* Rocket */}
            <div className="absolute inset-0 z-20">
                <Rocket
                    currentMultiplier={currentMultiplier}
                    state={state}
                    targetMultiplier={targetMultiplier}
                    elapsedTime={elapsedTime}
                />
            </div>

            {/* Explosion */}
            <div className="absolute inset-0 z-30">
                <CrashExplosion
                    state={state}
                    position={explosionPosition}
                    crashPoint={crashPoint ?? undefined}
                />
            </div>

            {/* Multiplier display */}
            <div className="absolute inset-0 z-40">
                <MultiplierDisplay
                    currentMultiplier={currentMultiplier}
                    targetMultiplier={targetMultiplier}
                    state={state}
                    crashPoint={crashPoint ?? undefined}
                />
            </div>
        </div>
    );
};

export default SpeedCrashWindow;
