export const FPS = 30
// the inverse of that times 1000, meaning the time in miliseconds between frames
export const FRAME_PER_SIMU = (1 / FPS) * 1000
// functions I already wrote, used when randomizing the general function
export const BUILTIN_FUNCTIONS = [
    "x * y * n"
]
// functions I already wrote, that come in triads
export const BUILTIN_FUNCTIONS_RGB = [
    ['x * y * (n / 2.0)', 'x * y * n * 2.0', 'x * y * n']
]