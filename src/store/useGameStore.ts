import { create } from 'zustand';

interface GameState {
    status: 'START' | 'PLAYING' | 'GAMEOVER';
    score: number;
    bestScore: number;
    setStatus: (status: 'START' | 'PLAYING' | 'GAMEOVER') => void;
    incrementScore: (amount: number) => void;
    resetScore: () => void;
}

export const useGameStore = create<GameState>((set) => ({
    status: 'START',
    score: 0,
    bestScore: Number(localStorage.getItem('sky-best-score')) || 0,
    setStatus: (status) => set((state) => {
        if (status === 'GAMEOVER' && state.score > state.bestScore) {
            localStorage.setItem('sky-best-score', state.score.toString());
            return { status, bestScore: state.score };
        }
        return { status };
    }),
    incrementScore: (amount) => set((state) => ({ score: state.score + amount })),
    resetScore: () => set({ score: 0 }),
}));
