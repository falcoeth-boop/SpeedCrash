export type Game = {
    title: string;
    description: string;
    gameAddress: string;
    gameBackground: string;
    animatedBackground?: string;
    card: string;
    banner: string;
    advanceToNextStateAsset?: string;
    themeColorBackground: string;
    song?: string;
    payouts: PayoutStructure;
};

export type PayoutStructure = {
    [key: number]: {
        [key: number]: {
            [key: number]: number;
        };
    };
};

export const speedCrashGame: Game = {
    title: "Speed Crash",
    description: "Set your target multiplier and watch the rocket fly. Cash out before it crashes!",
    gameAddress: "0x0000000000000000000000000000000000000000",
    gameBackground: "/crash-game-assets/background.png",
    card: "/crash-game-assets/card.png",
    banner: "/crash-game-assets/banner.png",
    themeColorBackground: "#7C3AED",
    payouts: {},
};

export const getPayout = (
    payouts: PayoutStructure,
    result0: number,
    result1: number,
    result2: number
): number => {
    return payouts[result0]?.[result1]?.[result2] || 0;
};

export const randomBytes = (amount: number) =>
    crypto.getRandomValues(new Uint8Array(amount));
