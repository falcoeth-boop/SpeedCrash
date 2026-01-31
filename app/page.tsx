import { speedCrashGame } from "@/lib/games";
import SpeedCrash from "@/components/speed-crash/SpeedCrash";

export async function generateMetadata() {
    return {
        title: speedCrashGame.title,
        description: speedCrashGame.description,
    };
}

export default function SpeedCrashPage() {
    return (
        <div className="w-full max-w-6xl mx-auto">
            <div className="flex flex-row mb-2 sm:mb-4">
                <h1 className="text-3xl font-semibold mr-2">
                    {speedCrashGame.title}
                </h1>
            </div>
            <SpeedCrash game={speedCrashGame} />
        </div>
    );
}
