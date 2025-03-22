export default class Placeable {
    constructor(type, x, y, prop = {}) {
        this.type = type; // e.g., BOMB, ITEM, etc?
        this.x = x;
        this.y = y;
        this.prop = prop; // additional properties (walkable, damage, collectable, etc.)
    }
}