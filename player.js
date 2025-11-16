export class Player {
    constructor(id, username, color) {
        this.id = id;
        this.username = username;
        this.color = color;
        this.energy = 1; // Start with 1 hour of energy

        // Position in grid coordinates
        this.x = Math.floor(Math.random() * 640);
        this.y = Math.floor(Math.random() * 480);

        // For smooth movement
        this.pixelX = this.x;
        this.pixelY = this.y;
        this.targetX = this.x;
        this.targetY = this.y;

        this.speed = 1; // tiles per second
        this.moveCooldown = 2 + Math.random() * 5; // time to wait before picking new target
    }

    addEnergy() {
        this.energy += 1;
    }

    update(deltaTime, mapWidth, mapHeight) {
        this.moveCooldown -= deltaTime;
        if (this.moveCooldown <= 0) {
            this.pickNewTarget(mapWidth, mapHeight);
            this.moveCooldown = 2 + Math.random() * 5; // reset cooldown
        }

        // Move towards target
        const dx = this.targetX - this.pixelX;
        const dy = this.targetY - this.pixelY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0.01) {
            const moveAmount = this.speed * deltaTime;
            this.pixelX += (dx / dist) * moveAmount;
            this.pixelY += (dy / dist) * moveAmount;
        } else {
            this.pixelX = this.targetX;
            this.pixelY = this.targetY;
        }
    }

    pickNewTarget(mapWidth, mapHeight) {
        const dir = Math.floor(Math.random() * 4);
        let newX = this.targetX;
        let newY = this.targetY;

        switch (dir) {
            case 0: newY--; break; // Up
            case 1: newY++; break; // Down
            case 2: newX--; break; // Left
            case 3: newX++; break; // Right
        }

        // Clamp to map bounds
        this.targetX = Math.max(0, Math.min(mapWidth - 1, newX));
        this.targetY = Math.max(0, Math.min(mapHeight - 1, newY));
    }

    render(ctx, tileSize, cameraX, cameraY) {
        const radius = tileSize / 2.5;
        // Apply camera offset
        const screenX = (this.pixelX * tileSize + tileSize / 2) - cameraX;
        const screenY = (this.pixelY * tileSize + tileSize / 2) - cameraY;

        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(screenX, screenY, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(0,0,0,0.5)';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw Nametag Label
        // Use a minimum font size of 12px for readability, scaling up with tileSize
        const fontSize = Math.max(12, tileSize * 0.6); 
        ctx.font = `${fontSize}px Arial, sans-serif`;
        
        // Setup for text rendering
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        
        // Text color and stroke for visibility against any background
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.lineWidth = 3; // Thicker stroke for visibility

        const tagY = screenY - radius - 5; // Position slightly above the player circle
        
        ctx.strokeText(this.username, screenX, tagY);
        ctx.fillText(this.username, screenX, tagY);
    }
}