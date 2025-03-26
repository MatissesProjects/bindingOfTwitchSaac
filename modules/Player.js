import Inventory from "./Inventory.js";

export default class Player {
    constructor(x, y, size, speed, health, playerCoolDown, shotDistance,
                bombStartAmount) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.speed = speed;
        this.currentHealth = health;
        this.maxHealth = health;
        this.playerCoolDown = playerCoolDown;
        this.shotDistance = shotDistance;
        this.inventory = new Inventory(bombStartAmount);
    }
}