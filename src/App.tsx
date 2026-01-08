import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Play, RotateCcw, Home, Ghost } from 'lucide-react';
import { useGameStore } from './store/useGameStore';
import { GameEngine } from './engine/GameEngine';

const App: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);
    const { status, score, bestScore, setStatus, incrementScore, resetScore } = useGameStore();
    const [isFlapping, setIsFlapping] = useState(false);

    useEffect(() => {
        if (canvasRef.current && !engineRef.current) {
            engineRef.current = new GameEngine(
                canvasRef.current,
                () => incrementScore(1),
                () => setStatus('GAMEOVER')
            );
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'Enter') {
                e.preventDefault();
                handleInteraction();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [status]);

    const handleInteraction = () => {
        if (status === 'START' || status === 'GAMEOVER') {
            startGame();
        } else if (status === 'PLAYING') {
            engineRef.current?.jump();
            setIsFlapping(true);
            setTimeout(() => setIsFlapping(false), 100);
        }
    };

    const startGame = () => {
        resetScore();
        setStatus('PLAYING');
        engineRef.current?.start();
    };

    return (
        <div
            className="relative w-screen h-screen overflow-hidden bg-slate-900 font-sans cursor-pointer select-none"
            onClick={handleInteraction}
            onTouchStart={(e) => {
                // 터치 시 스크롤 등 기본 동작 방지
                if (e.cancelable) e.preventDefault();
                handleInteraction();
            }}
        >
            {/* Game Canvas */}
            <canvas
                ref={canvasRef}
                className="block w-full h-full"
            />

            {/* Score HUD */}
            {status === 'PLAYING' && (
                <motion.div
                    initial={{ y: -50, opacity: 0 }}
                    animate={{ y: 20, opacity: 1 }}
                    className="absolute top-10 left-1/2 -translate-x-1/2 bg-white/20 backdrop-blur-md px-6 py-2 rounded-full border border-white/30 shadow-xl"
                >
                    <span className="text-4xl font-bold text-white drop-shadow-md">{score}m</span>
                </motion.div>
            )}

            <AnimatePresence>
                {/* Start Overlay */}
                {status === 'START' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm"
                    >
                        <motion.div
                            animate={{ y: [0, -20, 0] }}
                            transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                            className="w-24 h-24 bg-yellow-400 rounded-2xl shadow-2xl flex items-center justify-center mb-8 border-4 border-white/50"
                        >
                            <div className="w-4 h-4 bg-black rounded-full translate-x-4 -translate-y-4" />
                        </motion.div>
                        <h1 className="text-6xl font-black text-white mb-2 tracking-tighter drop-shadow-2xl">SKY SURVIVOR</h1>
                        <p className="text-blue-200 mb-12 font-medium uppercase tracking-widest">Click or Press Space to Start</p>
                        <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={(e) => { e.stopPropagation(); startGame(); }}
                            className="flex items-center gap-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-10 py-5 rounded-3xl font-bold text-2xl shadow-[0_10px_40px_-10px_rgba(249,115,22,0.5)] border-b-4 border-orange-700 active:border-b-0"
                        >
                            <Play className="fill-current" /> FLY PIYO!
                        </motion.button>
                    </motion.div>
                )}

                {/* Game Over Overlay */}
                {status === 'GAMEOVER' && (
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="absolute inset-0 flex items-center justify-center bg-red-950/60 backdrop-blur-xl p-6"
                    >
                        <div className="glass max-w-sm w-full p-8 rounded-[40px] text-center shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 via-orange-500 to-red-500" />

                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-red-500/20 rounded-full">
                                    <Ghost className="w-12 h-12 text-red-500" />
                                </div>
                            </div>

                            <h2 className="text-4xl font-black text-white mb-8">GAME OVER</h2>

                            <div className="grid grid-cols-2 gap-4 mb-10">
                                <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                                    <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Score</p>
                                    <p className="text-3xl font-bold text-white">{score}m</p>
                                </div>
                                <div className="bg-white/5 p-4 rounded-3xl border border-white/10">
                                    <p className="text-xs text-white/50 uppercase tracking-widest mb-1">Best</p>
                                    <div className="flex items-center justify-center gap-1">
                                        <Trophy className="w-4 h-4 text-yellow-500" />
                                        <p className="text-3xl font-bold text-white">{bestScore}m</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => { e.stopPropagation(); startGame(); }}
                                    className="flex items-center justify-center gap-2 bg-white text-slate-900 py-4 rounded-2xl font-bold text-xl transition-all"
                                >
                                    <RotateCcw className="w-5 h-5" /> REPLAY (Enter)
                                </motion.button>
                                <motion.button
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    onClick={(e) => { e.stopPropagation(); setStatus('START'); }}
                                    className="flex items-center justify-center gap-2 bg-transparent text-white/70 hover:text-white py-4 rounded-2xl font-semibold transition-all"
                                >
                                    <Home className="w-5 h-5" /> TOP SCORE
                                </motion.button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default App;
