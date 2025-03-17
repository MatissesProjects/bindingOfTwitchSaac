export default class Tile {
    constructor(type, x, y, prop = {}) {
        this.type = type; // e.g., WALL, DOOR, etc.
        this.x = x;
        this.y = y;
        this.prop = prop; // additional properties (walkable, damage, etc.)
    }
}