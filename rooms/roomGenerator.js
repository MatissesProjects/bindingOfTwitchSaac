import Tile from '../modules/Tile.js'
import { tileTypes } from '../constants/tileTypes.js';
import { randBetween } from '../utils/random.js';
let ROOM_HEIGHT, ROOM_WIDTH;
export function generateRoom(entryDoor, height, width) {
    ROOM_HEIGHT = height;
    ROOM_WIDTH = width;
    // console.log(ROOM_HEIGHT, ROOM_WIDTH);
    let room = [];
    // basic room generation
    room = createEmptyRoom(room);
    room = createWalls(room);
    // console.log(room);
    room = addDoorsToRoom(room, entryDoor);

    // additional room floor modifiers
    room = addRandomItems(room, addHoleToRoom, .5, 1, 5);

    // additional room on floor modifier
    room = addRandomItems(room, addSpikesToRoom, .5, 1, 5);
    // room = addRandomItems(room, addBombToRoom, .5, 1, 5);
    room = addRandomItems(room, addRockToRoom, .5, 1, 5);
    
    return room;
}

function addRandomItems(room, addFunction, chance, minCount, maxCount) {
    if (Math.random() < chance) {
        const count = randBetween(minCount, maxCount);
        for (let i = 0; i < count; ++i) {
            room = addFunction(room);
        }
    }
    return room;
}

function createEmptyRoom(room) {
    for (let y = 0; y < ROOM_HEIGHT; ++y) {
        room[y] = [];
        for (let x = 0; x < ROOM_WIDTH; ++x) {
            room[y][x] = new Tile(tileTypes.EMPTY, x, y);
        }
    }
    return room;
}

function createWalls(room) {
    for (let i = 0; i < ROOM_WIDTH; i++) {
        room[0][i] = new Tile(tileTypes.WALL, i, 0);
        room[ROOM_HEIGHT - 1][i] = new Tile(tileTypes.WALL, i, ROOM_HEIGHT - 1);
    }
    for (let i = 0; i < ROOM_HEIGHT; i++) {
        room[i][0] = new Tile(tileTypes.WALL, 0, i);
        room[i][ROOM_WIDTH - 1] = new Tile(tileTypes.WALL, ROOM_WIDTH - 1, i);
    }
    return room;
}

function addDoorsToRoom(room, entryDoor) {
    const doors = {
        top: { x: randBetween(1, ROOM_WIDTH - 2), y: 0 },
        bottom: { x: randBetween(1, ROOM_WIDTH - 2), y: ROOM_HEIGHT - 1 },
        left: { x: 0, y: randBetween(1, ROOM_HEIGHT - 2) },
        right: { x: ROOM_WIDTH - 1, y: randBetween(1, ROOM_HEIGHT - 2) }
    };

    if (entryDoor && doors[entryDoor]) {
        let pos = doors[entryDoor];
        room[pos.y][pos.x] = new Tile(tileTypes.DOOR, pos.x, pos.y);
    }

    // Add additional doors randomly for the other sides.
    Object.entries(doors).forEach(([side, pos]) => {
        if (side === entryDoor) return; // already forced
        if (Math.random() < 0.5) {
            room[pos.y][pos.x] = new Tile(tileTypes.DOOR, pos.x, pos.y);
        }
    });
    return room;
}

function addHoleToRoom(room) {
    const x = randBetween(1, ROOM_WIDTH - 4);
    const y = randBetween(1, ROOM_HEIGHT - 4);
    room[y][x] = new Tile(tileTypes.HOLE, x, y);
    return room;
}

function addSpikesToRoom(room) {
    const x = randBetween(1, ROOM_WIDTH - 4);
    const y = randBetween(1, ROOM_HEIGHT - 4);
    room[y][x] = new Tile(tileTypes.SPIKES, x, y);
    return room;
}

function addBombToRoom(room) {
    const x = randBetween(1, ROOM_WIDTH - 4);
    const y = randBetween(1, ROOM_HEIGHT - 4);
    room[y][x] = new Tile(tileTypes.BOMB, x, y);
    return room;
}

function addRockToRoom(room) {
    const x = randBetween(1, ROOM_WIDTH - 4);
    const y = randBetween(1, ROOM_HEIGHT - 4);
    room[y][x] = new Tile(tileTypes.ROCK, x, y);
    return room;
}
