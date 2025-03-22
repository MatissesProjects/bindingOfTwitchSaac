import Player from './modules/Player.js';
import { tileTypes } from './constants/tileTypes.js';
import * as roomGenerator from './rooms/roomGenerator.js';
import { randBetween, randFloat } from './utils/random.js';
import Tile from './modules/Tile.js'

const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const TILE_SIZE = 40;
const ROOM_WIDTH = canvas.width / TILE_SIZE;
const ROOM_HEIGHT = canvas.height / TILE_SIZE;

const player = new Player(ROOM_WIDTH / 2, ROOM_HEIGHT / 2, 0.6, 0.1, 5, 60, 5, 2);

// Event Listeners
let keys = {};
document.addEventListener('keydown', e => keys[e.key.toLowerCase()] = true);
document.addEventListener('keyup', e => keys[e.key.toLowerCase()] = false);

// Game State Variables
const dungeon = {};
const visitedRooms = new Set();
let playerHitCooldown = player.playerCoolDown;
let currentRoom = { x: 10, y: 10 };
visitedRooms.add(`${currentRoom.x},${currentRoom.y}`);

function getRoom(x, y, entryDoor) {
    const key = `${x},${y}`;
    if (!dungeon[key]) {
        dungeon[key] = roomGenerator.generateRoom(entryDoor, ROOM_HEIGHT, ROOM_WIDTH);
        dungeon[key].enemies = spawnEnemies();
    }
    return dungeon[key];
}

// TODO random room as always given 1st room
let roomMap = getRoom(currentRoom.x, currentRoom.y, "left");
visitedRooms.add(`${currentRoom.x},${currentRoom.y}`);

function movePlayer(dx, dy) {
    // TODO this appears to only check the bottom right hand quadrent
    //      we want to make sure possibly to add the other 3
    const newX = player.x + dx, newY = player.y + dy;
    const tileX = Math.floor(newX), tileY = Math.floor(newY);
    const tile = roomMap[tileY][tileX];

    switch(tile.type){
        case tileTypes.DOOR:
            handleEnterDoor(tileX, tileY);
            break;
        case tileTypes.SPIKE:
            playerHit();
            break;
        case tileTypes.WALL:
        case tileTypes.HOLE:
        case tileTypes.ROCK:
            console.log("stuck on a " + tile.type);
            break;

        // TODO we are going to want to know if we can walk though that object type
        //      for instance bomb is a no, items is a yes
        default:
        // case tileTypes.EMPTY:
            player.x = newX; 
            player.y = newY;
        //     break;
        // default:
            console.log("what is this type? " + tile.type);
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
            player.y = ROOM_HEIGHT - 1;
            break;
        case "left":
            player.x = 1;
            player.y = ROOM_HEIGHT / 2;
            break;
        case "right":
            player.x = ROOM_WIDTH - 1;
            player.y = ROOM_HEIGHT / 2;
            break;
    }
}

function explodeBomb(tileX, tileY) {
    console.log("boom");
    roomMap[tileY][tileX] = new Tile(tileTypes.EMPTY, tileX, tileY);

    const room = dungeon[`${currentRoom.x},${currentRoom.y}`];
    if (!room.enemies || room.enemies.length === 0) return;

    let enemyList = [];
    let radius = 5;

    room.enemies.forEach(enemy => {
        // TODO we want to use the bomb xy tile not the players
        //      this way we can drop a bomb as the player
        const dist = Math.hypot(player.x - enemy.x, player.y - enemy.y);
        console.log(dist);
        if (dist < radius) {
            enemyList.push(enemy);
        }
    });

    if (enemyList) { // range to go boom
        room.enemies = room.enemies.filter(e => !enemyList.includes(e));
    }

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
    if (keys['b']) dropBomb(player);
    if (keys['g']) addItemToInventory(player);
}

function dropBomb(player) {
    console.log(`attempting to drop a bomb at player loc ${player.x} ${player.y}`);

    // no bombs
    if (player.numberBombs <= 0) return;

    // if timebetween drop bomb is greater than drop bomb else return
    // check timebetween

    console.log(`dropping bomb at player loc ${player.x} ${player.y}`);
    player.numberBombs--;
    const bombX = Math.floor(player.x), bombY = Math.floor(player.y);
    roomMap[bombY][bombX] = new Tile(tileTypes.BOMB, bombX, bombY);
    setTimeout(function() {
        explodeBomb(bombX, bombY);
    }, 1000);
}

function addItemToInventory(player) {
    player.numberBombs++;
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
            ctx.fillStyle = tile.type === tileTypes.WALL ?  '#444' :    // grey
                            tile.type === tileTypes.DOOR ?  '#964B00' : // orange
                            tile.type === tileTypes.BOMB ?  '#A6BB00' : // yellow
                            tile.type === tileTypes.HOLE ?  '#064BC0' : // blue
                            tile.type === tileTypes.ROCK ?  '#26AB40' : // dark green
                            tile.type === tileTypes.SPIKE ? '#36EB80' : // light green
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