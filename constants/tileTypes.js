export const tileTypes = {
    EMPTY: { id: 0, name: "EMPTY", walkable: true },
    WALL: { id: 1, name: "WALL", walkable: false },
    DOOR: { id: 2, name: "DOOR", walkable: true },
    HOLE: { id: 3, name: "HOLE", walkable: false },
    SPIKE: { id: 4, name: "SPIKES", walkable: true, damage: 1 },
    ROCK: { id: 5, name: "ROCK", walkable: false },
    BOMB: { id: 6, name: "BOMB", walkable: false, collectable: false, damage: 1},
    ITEM: { id: 7, name: "ITEM", walkable: true, collectable: true},
};