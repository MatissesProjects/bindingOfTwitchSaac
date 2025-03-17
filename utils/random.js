export function randBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// New helper for floats
export function randFloat(min, max) {
    return Math.random() * (max - min) + min;
}