class Tile {
    constructor(type, x, y, prop = {}) {
        this.type = type; // e.g., WALL, DOOR, etc.
        this.x = x;
        this.y = y;
        this.prop = prop; // additional properties (walkable, damage, etc.)
    }
}

class Player {
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

const tileTypes = {
    EMPTY: { id: 0, name: "EMPTY", walkable: true },
    WALL: { id: 1, name: "WALL", walkable: false },
    DOOR: { id: 2, name: "DOOR", walkable: true },
    HOLE: { id: 3, name: "HOLE", walkable: false },
    SPIKES: { id: 4, name: "SPIKES", walkable: true, damage: 1 },
    BOMB: { id: 5, name: "BOMB", walkable: false, damage: 2 },
    ROCK: { id: 6, name: "ROCK", walkable: false },
};

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 40;
const ROOM_WIDTH = canvas.width / TILE_SIZE;
const ROOM_HEIGHT = canvas.height / TILE_SIZE;

const player = new Player(x = ROOM_WIDTH / 2, y = ROOM_HEIGHT / 2, 
                          size = 0.6, speed = 0.1, currentHealth = 5, name = "default", 
                          playerCoolDown = 60, shotDistance = 5);

let keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

const dungeon = {};
const visitedRooms = new Set();
let playerHitCooldown = player.playerCoolDown;
let currentRoom = { x: 10, y: 10 };
visitedRooms.add(`${currentRoom.x},${currentRoom.y}`);

function generateRoom(entryDoor) {
    let room = [];
    // basic room generation
    room = createEmptyRoom(room);
    room = createWalls(room);
    room = addDoorsToRoom(room, entryDoor);

    // additional room floor modifiers
    room = addHoleToRoom(room);

    // additional room on floor modifier
    room = addSpikesToRoom(room);
    room = addBombToRoom(room);
    room = addRockToRoom(room);
    
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

function sideFromPos({ x, y }) {
    if (y === 0) return 'top';
    if (y === ROOM_HEIGHT - 1) return 'bottom';
    if (x === 0) return 'left';
    if (x === ROOM_WIDTH - 1) return 'right';
}

function sideOpposite(side) {
    return { top: 'bottom', bottom: 'top', left: 'right', right: 'left' }[side];
}

function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// New helper for floats
function randFloat(min, max) {
    return Math.random() * (max - min) + min;
}

function getRoom(x, y, entryDoor) {
    const key = `${x},${y}`;
    if (!dungeon[key]) {
        dungeon[key] = generateRoom(entryDoor);
        dungeon[key].enemies = spawnEnemies();
    }
    return dungeon[key];
}

// TODO random room as always given 1st room
let roomMap = getRoom(currentRoom.x, currentRoom.y, "left");
visitedRooms.add(`${currentRoom.x},${currentRoom.y}`);

function movePlayer(dx, dy) {
    const newX = player.x + dx, newY = player.y + dy;
    const tileX = Math.floor(newX), tileY = Math.floor(newY);
    const tile = roomMap[tileY]?.[tileX];

    switch(tile.type){
        case tileTypes.WALL:
            break;
        case tileTypes.DOOR:
            handleEnterDoor(tileX, tileY);
            break;
        case tileTypes.BOMB:
            explodeBomb(tileX, tileY);
            break;
        default:
            player.x = newX; 
            player.y = newY;
            break;
    }
}

function handleEnterDoor(tileX, tileY) {
    let entryDoor;
    if (tileY === 0) { 
        currentRoom.y--; 
        entryDoor = 'bottom'; 
        player.y = ROOM_HEIGHT - 2; 
    } else if (tileY === ROOM_HEIGHT - 1) { 
        currentRoom.y++; 
        entryDoor = 'top'; 
    } else if (tileX === 0) { 
        currentRoom.x--; 
        entryDoor = 'right'; 
    } else if (tileX === ROOM_WIDTH - 1) { 
        currentRoom.x++; 
        entryDoor = 'left'; 
    }
    
    // Clamp room values if needed
    currentRoom.x = Math.max(0, Math.min(ROOM_WIDTH - 1, currentRoom.x));
    currentRoom.y = Math.max(0, Math.min(ROOM_HEIGHT - 1, currentRoom.y));

    // Removed entryDoor argument since getRoom doesn't use it
    roomMap = getRoom(currentRoom.x, currentRoom.y, entryDoor);
    visitedRooms.add(`${currentRoom.x},${currentRoom.y}`);

    // lets spawn at our door now
    switch (entryDoor) {
        case "top":
            player.x = ROOM_WIDTH / 2;
            player.y = 1;
            break;
        case "bottom":
            player.x = ROOM_WIDTH / 2;
            player.y = ROOM_HEIGHT-1;
            break;
        case "left":
            player.x = 1;
            player.y = ROOM_HEIGHT / 2;
            break;
        case "right":
            player.x = ROOM_WIDTH-1;
            player.y = ROOM_HEIGHT / 2;
            break;
    }
}

function explodeBomb(tileX, tileY) {
    console.log("boom");
    roomMap[tileY][tileX] = new Tile(tileTypes.EMPTY, tileX, tileY);
}

function update() {
    if (keys['w'] || keys['arrowup']) movePlayer(0, -player.speed);
    if (keys['s'] || keys['arrowdown']) movePlayer(0, player.speed);
    if (keys['a'] || keys['arrowleft']) movePlayer(-player.speed, 0);
    if (keys['d'] || keys['arrowright']) movePlayer(player.speed, 0);
    if (keys[' ']) {
        shootClosestEnemy();
        keys[' '] = false;
    }
}

function drawMinimap() {
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillRect(5, 5, 110, 110);
    visitedRooms.forEach(room => {
        const [x, y] = room.split(',').map(Number);
        // draw yourself or the path
        ctx.fillStyle = (x === currentRoom.x && y === currentRoom.y) ? 'yellow' : '#555';
        ctx.fillRect(10 + x * 5, 10 + y * 5, 5, 5);
    });
}

function spawnEnemies() {
    const enemies = [];
    for (let i = 0; i < randBetween(1, 3); i++) {
        enemies.push({
            x: randBetween(1, ROOM_WIDTH - 2) + 0.5,
            y: randBetween(1, ROOM_HEIGHT - 2) + 0.5,
            size: randFloat(0.35, 3.5),  // use random float for enemy size
            speed: randFloat(0.01, 0.05) // and speed
        });
    }
    return enemies;
}

function updateEnemies() {
    const room = dungeon[`${currentRoom.x},${currentRoom.y}`];
    if (!room.enemies) return;

    room.enemies.forEach(enemy => {
        // Calculate centers of the player and enemy squares
        const playerCenterX = player.x + player.size / 2;
        const playerCenterY = player.y + player.size / 2;
        const enemyCenterX = enemy.x + enemy.size / 2;
        const enemyCenterY = enemy.y + enemy.size / 2;
    
        // Compute the directional vector from enemy to player's center
        const dx = playerCenterX - enemyCenterX;
        const dy = playerCenterY - enemyCenterY;
        const distance = Math.hypot(dx, dy);
    
        // Update enemy's position toward the player's center (avoid division by zero)
        if (distance > 0) {
            enemy.x += (dx / distance) * enemy.speed;
            enemy.y += (dy / distance) * enemy.speed;
        }
    
        // AABB collision detection between two squares:
        // Check if the player and enemy squares overlap
        if (
            player.x < enemy.x + enemy.size &&
            player.x + player.size > enemy.x &&
            player.y < enemy.y + enemy.size &&
            player.y + player.size > enemy.y &&
            playerHitCooldown <= 0
        ) {
            playerHit();
        }
    });
    
    if (playerHitCooldown > 0) playerHitCooldown--;
}

// Simplified playerHit: removed duplicate and extra setInterval logic.
function playerHit() {
    if (playerHitCooldown > 0) return;
    playerHitCooldown = player.playerCoolDown;
    player.currentHealth--;
    if (player.currentHealth <= 0) gameOver();
}

function shootClosestEnemy() {
    const room = dungeon[`${currentRoom.x},${currentRoom.y}`];
    if (!room.enemies || room.enemies.length === 0) return;

    let closestEnemy = null;
    let minDist = Infinity;

    room.enemies.forEach(enemy => {
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        if (dist < minDist) {
            minDist = dist;
            closestEnemy = enemy;
        }
    });

    if (closestEnemy && minDist < player.shotDistance) { // range to shoot
        room.enemies = room.enemies.filter(e => e !== closestEnemy);
    }
}

function gameOver() {
    alert('Game Over!');
    keys = {};
}

function renderEnemies() {
    const room = dungeon[`${currentRoom.x},${currentRoom.y}`];
    if (!room.enemies) return;

    ctx.fillStyle = 'red';
    room.enemies.forEach(enemy => {
        ctx.fillRect(
            enemy.x * TILE_SIZE, 
            enemy.y * TILE_SIZE, 
            enemy.size * TILE_SIZE, 
            enemy.size * TILE_SIZE
        );
    });
}

function renderHealth() {
    ctx.fillStyle = 'red';
    for (let i = 0; i < player.currentHealth; i++) {
        ctx.fillRect(10 + i * 25, canvas.height - 25, 20, 20);
    }
}

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw each tile by checking its type property.
    roomMap.forEach((row, y) => {
        row.forEach((tile, x) => {
            ctx.fillStyle = tile.type === tileTypes.WALL ? '#444' : 
                            tile.type === tileTypes.DOOR ? '#964B00' : 
                            tile.type === tileTypes.BOMB ? '#A6BB00' : 
                            tile.type === tileTypes.HOLE ? '#064BC0' : 
                            tile.type === tileTypes.ROCK ? '#26AB40' : 
                            tile.type === tileTypes.SPIKES ? '#36EB80' : 
                            '#000';
            ctx.fillRect(x * TILE_SIZE, y * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        });
    });

    // Render the player.
    ctx.fillStyle = 'white';
    ctx.fillRect(player.x * TILE_SIZE, player.y * TILE_SIZE, player.size * TILE_SIZE, player.size * TILE_SIZE);

    renderEnemies();
    renderHealth();
    drawMinimap();
}

function gameLoop() {
    update();
    updateEnemies();
    render();
    requestAnimationFrame(gameLoop);
}

gameLoop();