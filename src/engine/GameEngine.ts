export class GameEngine {
    private canvas: HTMLCanvasElement;
    private ctx: CanvasRenderingContext2D;
    private lastTime: number = 0;
    private bird = { x: 80, y: 200, width: 40, height: 30, velocity: 0, gravity: 0.5, jump: -9 };
    private enemies: { x: number, y: number, width: number, height: number, passed: boolean }[] = [];
    private bgOffset: number = 0;
    private scoreCallback: (score: number) => void;
    private gameOverCallback: () => void;
    private isRunning: boolean = false;
    private shakeTime: number = 0;

    constructor(canvas: HTMLCanvasElement, onScore: (s: number) => void, onGameOver: () => void) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false })!;
        this.scoreCallback = onScore;
        this.gameOverCallback = onGameOver;
        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    private resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    public start() {
        this.isRunning = true;
        this.bird.y = this.canvas.height / 2;
        this.bird.velocity = 0;
        this.enemies = [];
        this.shakeTime = 0;
        this.lastTime = performance.now();
        requestAnimationFrame(this.loop.bind(this));
    }

    public stop() {
        this.isRunning = false;
    }

    public jump() {
        if (this.isRunning) {
            this.bird.velocity = this.bird.jump;
        }
    }

    private loop(time: number) {
        if (!this.isRunning && this.shakeTime <= 0) return;

        const deltaTime = Math.min((time - this.lastTime) / 16, 2);
        this.lastTime = time;

        this.update(deltaTime);
        this.draw();

        requestAnimationFrame(this.loop.bind(this));
    }

    private update(dt: number) {
        if (this.shakeTime > 0) {
            this.shakeTime -= dt * 16;
        }

        if (!this.isRunning) return;

        // Bird Physics
        this.bird.velocity += this.bird.gravity * dt;
        this.bird.y += this.bird.velocity * dt;

        // Boundary Check
        if (this.bird.y < 0 || this.bird.y + this.bird.height > this.canvas.height) {
            this.triggerGameOver();
        }

        // Scroll Background
        this.bgOffset = (this.bgOffset - 3 * dt) % this.canvas.width;

        // Enemy Spawning
        if (this.enemies.length === 0 || this.enemies[this.enemies.length - 1].x < this.canvas.width - 350) {
            const gap = 200;
            const y = 80 + Math.random() * (this.canvas.height - 350);
            this.enemies.push({ x: this.canvas.width, y: y, width: 65, height: gap, passed: false });
        }

        // Enemy Movement & Collision
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const e = this.enemies[i];
            e.x -= 4.5 * dt;

            // Score
            if (!e.passed && e.x + e.width < this.bird.x) {
                e.passed = true;
                this.scoreCallback(1);
            }

            // Collision (AABB with padding)
            const p = 6;
            if (
                this.bird.x + p < e.x + e.width &&
                this.bird.x + this.bird.width - p > e.x &&
                (this.bird.y + p < e.y || this.bird.y + this.bird.height - p > e.y + e.height)
            ) {
                this.triggerGameOver();
            }

            if (e.x + e.width < -100) {
                this.enemies.splice(i, 1);
            }
        }
    }

    private triggerGameOver() {
        if (this.isRunning) {
            this.isRunning = false;
            this.shakeTime = 300;
            this.gameOverCallback();
        }
    }

    private draw() {
        this.ctx.save();

        // Screen Shake
        if (this.shakeTime > 0) {
            const dx = (Math.random() - 0.5) * 12;
            const dy = (Math.random() - 0.5) * 12;
            this.ctx.translate(dx, dy);
        }

        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Cosmic Background
        this.ctx.fillStyle = '#0f172a'; // Slate 900
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        for (let i = 0; i < 6; i++) {
            const x = (this.bgOffset * (0.5 + i * 0.1) + i * 500) % (this.canvas.width + 300) - 150;
            this.ctx.beginPath();
            this.ctx.arc(x, 50 + i * 180, 80 + i * 20, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw Bird with "Flap" animation
        const isLeveling = Math.abs(this.bird.velocity) < 1;
        const flapOffset = this.bird.velocity < 0 ? -8 : 8;

        // Body shadow
        this.ctx.fillStyle = 'rgba(0,0,0,0.3)';
        this.ctx.roundRect(this.bird.x + 4, this.bird.y + 4, this.bird.width, this.bird.height, 12);
        this.ctx.fill();

        // Body
        this.ctx.fillStyle = '#fcd34d'; // Amber 300
        this.ctx.beginPath();
        this.ctx.roundRect(this.bird.x, this.bird.y, this.bird.width, this.bird.height, 12);
        this.ctx.fill();

        // Wing
        this.ctx.fillStyle = '#f59e0b'; // Amber 500
        this.ctx.beginPath();
        this.ctx.ellipse(this.bird.x + 12, this.bird.y + 18 + (isLeveling ? 0 : flapOffset), 15, 8, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Eye
        this.ctx.fillStyle = 'white';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x + 30, this.bird.y + 10, 6, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.fillStyle = 'black';
        this.ctx.beginPath();
        this.ctx.arc(this.bird.x + 32, this.bird.y + 10, 3, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw Obstacles (Stylized Red Pillars)
        for (const e of this.enemies) {
            const grad = this.ctx.createLinearGradient(e.x, 0, e.x + e.width, 0);
            grad.addColorStop(0, '#991b1b');
            grad.addColorStop(0.5, '#ef4444');
            grad.addColorStop(1, '#991b1b');
            this.ctx.fillStyle = grad;

            // Top Obstacle
            this.ctx.beginPath();
            this.ctx.roundRect(e.x, -20, e.width, e.y + 20, 12);
            this.ctx.fill();
            // Bottom Obstacle
            this.ctx.beginPath();
            this.ctx.roundRect(e.x, e.y + e.height, e.width, this.canvas.height - (e.y + e.height) + 20, 12);
            this.ctx.fill();

            // Glow/Stroke
            this.ctx.strokeStyle = 'rgba(255,255,255,0.15)';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }

        this.ctx.restore();
    }
}
