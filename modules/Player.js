export default class Player {
    constructor(x, y, size, speed, health, name, playerCoolDown, shotDistance) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.currentHealth = health;
        this.maxHealth = health;
        this.name = name;
        this.playerCoolDown = playerCoolDown;
        this.shotDistance = shotDistance;
    }
}