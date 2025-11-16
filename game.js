import { Player } from './player.js';
import { Map as GameMap } from './map.js';

export class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.players = new Map();
        this.map = new GameMap(640, 480, 1); // 640x480 grid size

        this.focusedPlayerId = null;
        this.focusTimer = 0;
        this.FOCUS_DURATION = 60; // seconds

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        
        // Use a fixed tileSize for gameplay scale, allowing the map to be larger than viewport
        const fixedTileSize = 32; 
        this.map.setTileSize(fixedTileSize);

        this.map.setViewport(this.canvas.width, this.canvas.height);
    }

    addOrUpdatePlayer(chatter) {
        if (!this.players.has(chatter.id)) {
            const player = new Player(chatter.id, chatter.username, chatter.color);
            this.players.set(chatter.id, player);
            console.log(`Player ${chatter.username} joined.`);
            // If no focus is set, immediately focus on the first player
            if (!this.focusedPlayerId) {
                this.focusedPlayerId = chatter.id;
                this.focusTimer = this.FOCUS_DURATION;
            }
        } else {
            const player = this.players.get(chatter.id);
            player.addEnergy();
            console.log(`Player ${chatter.username} gained energy.`);
        }
    }

    start() {
        this.map.loadAssets().then(() => {
            this.lastTime = performance.now();
            this.gameLoop();
        });
    }

    gameLoop(currentTime = performance.now()) {
        const deltaTime = (currentTime - this.lastTime) / 1000; // in seconds
        this.lastTime = currentTime;

        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    update(deltaTime) {
        // Handle Camera Focus Logic
        this.focusTimer -= deltaTime;
        if (this.focusTimer <= 0) {
            this.chooseNewFocus();
            this.focusTimer = this.FOCUS_DURATION;
        }

        for (const player of this.players.values()) {
            player.update(deltaTime, this.map.width, this.map.height);
        }
    }
    
    chooseNewFocus() {
        const playerIds = Array.from(this.players.keys());
        if (playerIds.length === 0) {
            this.focusedPlayerId = null;
            return;
        }

        const randomIndex = Math.floor(Math.random() * playerIds.length);
        this.focusedPlayerId = playerIds[randomIndex];
        console.log(`Camera focusing on: ${this.players.get(this.focusedPlayerId).username} for ${this.FOCUS_DURATION} seconds.`);
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        let cameraX = 0;
        let cameraY = 0;

        const focusedPlayer = this.focusedPlayerId ? this.players.get(this.focusedPlayerId) : null;
        const tileSize = this.map.tileSize;
        const mapPixelWidth = this.map.width * tileSize;
        const mapPixelHeight = this.map.height * tileSize;
        
        if (focusedPlayer) {
            // Player's center pixel position relative to map origin
            const playerCenterX = focusedPlayer.pixelX * tileSize + tileSize / 2;
            const playerCenterY = focusedPlayer.pixelY * tileSize + tileSize / 2;

            // Ideal Camera offset to center player on screen
            cameraX = playerCenterX - this.canvas.width / 2;
            cameraY = playerCenterY - this.canvas.height / 2;

            // Clamp X position
            if (mapPixelWidth > this.canvas.width) {
                const maxCameraX = mapPixelWidth - this.canvas.width;
                cameraX = Math.max(0, Math.min(cameraX, maxCameraX));
            } else {
                // Center map horizontally if smaller than viewport
                cameraX = -(this.canvas.width - mapPixelWidth) / 2;
            }

            // Clamp Y position
            if (mapPixelHeight > this.canvas.height) {
                const maxCameraY = mapPixelHeight - this.canvas.height;
                cameraY = Math.max(0, Math.min(cameraY, maxCameraY));
            } else {
                // Center map vertically if smaller than viewport
                cameraY = -(this.canvas.height - mapPixelHeight) / 2;
            }

        } else {
            // No player focused, center the map if it's smaller than the viewport
            if (this.canvas.width > mapPixelWidth) {
                 cameraX = -(this.canvas.width - mapPixelWidth) / 2;
            }
            if (this.canvas.height > mapPixelHeight) {
                cameraY = -(this.canvas.height - mapPixelHeight) / 2;
            }
        }

        this.map.render(this.ctx, cameraX, cameraY);
        
        for (const player of this.players.values()) {
            player.render(this.ctx, tileSize, cameraX, cameraY);
        }
    }
}