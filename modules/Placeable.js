export default class Placeable {
    constructor(type, x, y, walkable, prop = {}) {
        this.type = type; // e.g., BOMB, ITEM, etc?
        this.x = x;
        this.y = y;
        this.walkable = walkable; // can we walk onto that block where this exists?
        this.prop = prop; // additional properties (damage, collectable, etc.)
    }
}