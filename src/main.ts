// -- IMPORTS --
import './style.css'
import { FRAME_PER_SIMU } from './consts'
import frag from './frag.glsl?raw'
import vert from './vert.glsl?raw'

import * as twgl from 'twgl.js'
import { GUI, GUIController } from 'dat.gui'
import Stats from 'stats.js'

// -- GUI SETUP --
const gui = new GUI()
gui.name = 'Test'
// simulation game state that the GUI changes.
// must be inside an object because it must be changed by reference.
const gs = {
	isPaused: false,
	blockWidth: 5,
	zoom: 2,
	animationState: 'forward',
	animationSpeed: 3,
	seperateFunctions: false,
	shadeFunction: 'x * y',
	redFunction: 'x * y',
	greenFunction: 'x * y',
	blueFunction: 'x * y'
}

const simuFolder = gui.addFolder('Simulation')
simuFolder.open()
simuFolder.add(gs, 'blockWidth', 4, 7).step(0.0001).listen()
simuFolder.add(gs, 'zoom', 1, 10).listen()
simuFolder.add(gs, 'animationState', ['forward', 'backwards'])
simuFolder.add(gs, 'animationSpeed', 1, 20).step(1)
let shadeFunction!: GUIController, rgbFunctions!: GUI
simuFolder.add(gs, 'seperateFunctions').onFinishChange(state => {
	if (state) {
		// seperate functions are now enabled, hide the general shade function and show the category
		// TODO: actually hide it
		rgbFunctions.show()
		rgbFunctions.open()
	} else {
		rgbFunctions.hide()
		// seperate functions are now disabled, show the general shade function and hide the category
	}
	initWebGL()
})
shadeFunction = simuFolder.add(gs, 'shadeFunction').onFinishChange(initWebGL)
rgbFunctions = simuFolder.addFolder('RGB functions')
;['red', 'green', 'blue'].forEach(color => rgbFunctions.add(gs, `${color}Function`).onFinishChange(initWebGL))
rgbFunctions.hide()
gui.add(gs, 'isPaused')

// -- RENDERING --
// canvas objects
const canvas = document.getElementById('the-canvas') as HTMLCanvasElement
const gl = canvas.getContext('webgl2', { antialias: false })!

// a lateinit variable holding the size of the block, and changed uniformally every frame
let blockSizeLocation!: WebGLUniformLocation
let resolutionLocation!: WebGLUniformLocation

// the last time a frame was rendered, used for timing
let last = 0
const gameTick = () => {
	// see if enough time passed to call a simulation tick
	stats.begin()
	const now = Date.now()
	const elapsed = now - last
	if (elapsed > FRAME_PER_SIMU && !gs.isPaused) {
		last = now
		// now render it
		renderTick()
	}
	stats.end()
	// end by rescheduling this function
	requestAnimationFrame(gameTick)
}

// calls `FPS` times every second.
const renderTick = () => {
	// first apply animation
	const delta = gs.animationSpeed * 0.000001
	gs.blockWidth += gs.animationState == 'forward' ? delta : -delta
	// block width is copied from the object. That is for two reasons:
	// 1) conciseness, no `gs.` prefix needed.
	// 2) speed: accessing an object is slow, better do it once
	const blockWidth = gs.blockWidth
	const drawnWidth = (gs.zoom * canvas.width) / blockWidth
	const drawnHeight = (gs.zoom * canvas.height) / blockWidth
	// give the GPU the current block size
	gl.uniform1f(blockSizeLocation, blockWidth)
	// give the current resolution
	gl.uniform2f(resolutionLocation, drawnWidth, drawnHeight)
	const imageBuffer = new Float32Array(drawnWidth * drawnHeight)
	// the cell counter helps put the image pixels in the right place
	let cellCounter = 0
	// for each column
	for (let y = 0; y < drawnHeight + 1; y += blockWidth) {
		// +1 because otherwise it's missing a line
		// for each row in that column
		for (let x = 0; x < drawnWidth; x += blockWidth) {
			// modify each pixel
			// const woozy = () => ~~(((1 + Math.sin(x*y)))/2 * 255)
			// ctx.fillStyle = `rgba(${woozy()}, ${woozy()}, ${woozy()}, 1)`
			// ctx.fillRect(x, y, blockWidth, -blockWidth)
			imageBuffer[cellCounter] = x
			imageBuffer[cellCounter + 1] = y
			cellCounter += 2
		}
	}
	gl.bufferData(gl.ARRAY_BUFFER, imageBuffer, gl.STATIC_DRAW)
	gl.drawArrays(gl.POINTS, 0, drawnWidth * drawnHeight)
}

// -- EVENTS --
// make canvas fit screen, updated on resize
const resize = () => {
	// make the canvas fit to screen
	canvas.width = window.innerWidth
	canvas.height = window.innerHeight
	// reset the WebGL state
	// set the viewport
	gl.viewport(0, 0, canvas.width, canvas.height)
}

window.onresize = resize

// a helper function that initiates the WebGL instance. Called at start and after every
function initWebGL() {
	// setup program
	// apply the the function given by the user
	let updatedFrag
	// user has enabled different functions for each color base
	if (gs.seperateFunctions) {
		updatedFrag = frag
			.replace('RED_FUNCTION', gs.redFunction)
			.replace('GREEN_FUNCTION', gs.greenFunction)
			.replace('BLUE_FUNCTION', gs.blueFunction)
	} else {
		// default one function for all colors
		updatedFrag = frag
			.replace('RED_FUNCTION', gs.shadeFunction)
			.replace('GREEN_FUNCTION', gs.shadeFunction)
			.replace('BLUE_FUNCTION', gs.shadeFunction)
	}
	const program = twgl.createProgram(gl, [vert, updatedFrag])
	gl.useProgram(program)
	// setup uniforms
	resolutionLocation = gl.getUniformLocation(program, 'u_resolution')!
	blockSizeLocation = gl.getUniformLocation(program, 'u_blockSize')!
	// setup attributes
	// it's more concise to make this into a function of it's own. I'm sure TWGL
	// has a version of this too but the docs are lacking and I can't find it
	const makeBuffer = (location: string, size: number) => {
		const attribLocation = gl.getAttribLocation(program, location)
		const attribBuffer = gl.createBuffer()
		gl.bindBuffer(gl.ARRAY_BUFFER, attribBuffer)
		gl.enableVertexAttribArray(attribLocation)
		gl.vertexAttribPointer(attribLocation, size, gl.FLOAT, false, 0, 0)
	}
	// set the location attribute, which is a 2D vector of the x and y coord of the point
	makeBuffer('a_position', 2)
	// set the point size attribute, which changes the size of the point to be drawn
	// makeBuffer('a_pointSize', 1)
	gl.deleteProgram(program)
}

// a useful display for FPS and stuff
const stats = new Stats()
document.body.appendChild(stats.dom)

// -- INITS --
resize() // initial resize
initWebGL() // WebGL setup
requestAnimationFrame(gameTick)
