// -- IMPORTS --
import './style.css'
import { FRAME_PER_SIMU } from './consts'

// -- RENDERING --
// canvas objects
const canvas = document.getElementById('the-canvas') as HTMLCanvasElement
const ctx = canvas.getContext('2d')!

let blockSize = 5
// the last time a frame was rendered, used for timing
let last = 0
let isPaused = false

const gameTick = () => {
	// see if enough time passed to call a simulation tick
	const now = Date.now()
	const elapsed = now - last
	if (elapsed > FRAME_PER_SIMU && !isPaused) {
		last = now
		// now render it
		renderTick(blockSize)
	}
	requestAnimationFrame(gameTick)
	// end by rescheduling this function
}

// calls `FPS` times every second.
const renderTick = (blockWidth: number) => {
	// for each column
	const drawWidth = ctx.canvas.width + blockWidth
	const drawnHeight = ctx.canvas.height + blockWidth
	for (let y = 0; y < drawnHeight; y += blockWidth) {
		// for each row in that column
		for (let x = 0; x < drawWidth; x += blockWidth) {
			// modify each pixel
			const woozy = () => ~~(((1 + Math.sin(x*y)))/2 * 255)
			ctx.fillStyle = `rgba(${woozy()}, ${woozy()}, ${woozy()}, 1)`
			ctx.fillRect(x, y, blockWidth, -blockWidth)
		}
	}
}

// -- EVENTS --
// make canvas fit screen, updated on resize
const resize = () => {
	// make the canvas fit to screen
	canvas.width = window.innerWidth
	canvas.height = window.innerHeight
}

window.onresize = resize

window.onkeydown = (event: KeyboardEvent) => {
	if (event.code == 'Space') {
		// toggle pause
		isPaused = !isPaused
	}
}

resize() // initial resize
requestAnimationFrame(gameTick)