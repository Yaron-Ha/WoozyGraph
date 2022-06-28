/* 
	TODO:
	give more meaningful error messages than console errors
	fix firefox
		 
*/

// -- IMPORTS --
import './style.css'
import { FRAME_PER_SIMU } from './consts'
import { randomShader } from './utils'
import frag from './frag.glsl?raw'
import vert from './vert.glsl?raw'

import * as twgl from 'twgl.js'
import { GUI } from 'dat.gui'
import Stats from 'stats.js'

// simulation game state
let gs = {
	blockWidth: 5.42,
	zoom: 2,
	animationState: 'forward',
	animationSpeed: 3,
	seperateFunctions: false,
	shadeFunction: 'x * y * n',
	redFunction: 'x * y * n',
	greenFunction: 'x * y * n',
	blueFunction: 'x * y * n',
	slider: 5
}

// game state that is local to the computer and doesn't affect the simulation.
let localGs = {
	isPaused: false,
	maxRandDepth: 5
}

// -- GUI SETUP --
const gui = new GUI({ width: 400 })

// setup sliders and options. Almost all are set to listen since they can be updated externally
// the simulation folder contains all data that is essential for running this particular simulation
const simuFolder = gui.addFolder('Simulation settings')
simuFolder.open()
simuFolder.add(gs, 'blockWidth', 4, 7).step(0.0001).name('Block width').listen()
simuFolder.add(gs, 'zoom', 1, 10).name('Zoom').listen()
let rgbFunctions!: GUI
simuFolder.add(gs, 'animationState', ['forward', 'backwards']).name('Animation direction')
simuFolder.add(gs, 'animationSpeed', 1, 1000).name('Simulation speed').step(1)
const updateFolder = (state: boolean) => {
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
}
simuFolder.add(gs, 'seperateFunctions').onFinishChange(updateFolder).name('Seperate RGB functions').listen()
simuFolder.add(gs, 'shadeFunction').name('General function').onFinishChange(initWebGL).listen()
rgbFunctions = simuFolder.addFolder('RGB functions')
;['red', 'green', 'blue'].forEach(color =>
	rgbFunctions
		.add(gs, `${color}Function`)
		.name(`${color.replace(/^\w/, c => c.toUpperCase())} function`) // capitalize the first letter
		.onFinishChange(initWebGL)
		.listen()
)
rgbFunctions.hide() // hidden by default
simuFolder.add(gs, 'slider', 0, 15).step(0.0001).name('Animation slider (n)').listen()

const otherFolder = gui.addFolder('Other settings')
otherFolder.open()
otherFolder.add(localGs, 'isPaused').name('Pause')
otherFolder
	.add(localGs, 'maxRandDepth', 0, 30)
	.step(1)
	.name('Max rand function depth = <strong style="color: red">lag</strong>')
gui.add({ fn: randomize }, 'fn').name(
	'Randomize button (alternatively <strong style="color: red">left click canvas</strong>)'
)

const share = () => {
	// creates a link to the current build and copies it.
	// serialize into JSON and then base64
	// it's okay to opt out of type checking for this, it's the most concise way
	// and I'm not going to use the value of gsCopy in my code anymore
	const gsCopy: any = { ...gs }
	if (gs.seperateFunctions) {
		// seperate functions? Remove the regular function, we don't need it in the link.
		delete gsCopy.shadeFunction
	} else {
		delete gsCopy.redFunction
		delete gsCopy.greenFunction
		delete gsCopy.blueFunction
	}

	const serialized = btoa(JSON.stringify(gsCopy))
	const loc = window.location
	// I'm not using window.location.href because if the page was opened with a link,
	// the hash would appear there
	const link = loc.origin + loc.pathname + '#' + serialized
	navigator.clipboard.writeText(link)
	alert('Link was successfully created and copied into your clipboard!')
}

gui.add({ fn: share }, 'fn').name('Found or created a cool build? Click to share it')

// -- RENDERING --
// canvas objects
const canvas = document.getElementById('the-canvas') as HTMLCanvasElement
const gl = canvas.getContext('webgl2', { antialias: false })!

// lateinit variables holding the size of the block, resolution and slider state
let blockSizeLocation!: WebGLUniformLocation
let resolutionLocation!: WebGLUniformLocation
let sliderLocation!: WebGLUniformLocation

// the last time a frame was rendered, used for timing
let last = 0
const gameTick = () => {
	// see if enough time passed to call a simulation tick
	stats.begin()
	const now = Date.now()
	const elapsed = now - last
	if (elapsed > FRAME_PER_SIMU && !localGs.isPaused) {
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
	const clamp = (num: number, min: number, max: number) => Math.min(Math.max(num, min), max)
	// first apply animation
	const scale = gs.animationSpeed * 0.000001
	const delta = gs.animationState == 'forward' ? scale : -scale
	gs.slider = clamp(gs.slider + delta, 0, 15)
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
	// give the current state of the slider
	gl.uniform1f(sliderLocation, gs.slider)

	const imageBuffer = new Float32Array(drawnWidth * drawnHeight)
	// the cell counter helps put the image pixels in the right place
	let cellCounter = 0
	// for each column
	for (let y = 0; y < drawnHeight + 1; y += blockWidth) {
		// +1 because otherwise it's missing a line
		// for each row in that column
		for (let x = 0; x < drawnWidth; x += blockWidth) {
			// modify each pixel
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

// randomize on left click. If the user presses right click, then the last game state will
// be loaded. This is helpful if someone misclicked or they pressed too fast to notice a cool pattern!
const oldStates: typeof gs[] = []
canvas.onclick = (_: MouseEvent) => {
	// backup GS
	oldStates.push({ ...gs }) // "deep"-copy GS when pushing
	randomize()
}
// on right click, restore
canvas.oncontextmenu = (ev: MouseEvent) => {
	if (oldStates.length > 0) {
		// there are old states, restore them. I'm using `Object.assign` instead of
		// simply making `gs` equal `oldStates.pop()` because doing so bugs out the GUI listeners
		Object.assign(gs, oldStates.pop()!)
		initWebGL()
	}
	// disable the annoying pop up that shows up on right click
	ev.preventDefault()
}

// -- HELPER FUNCTIONS --
// a helper function that initiates the WebGL instance. Called at start and after every
function initWebGL() {
	// setup program
	// apply the the function given by the user using preprocessing
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
	sliderLocation = gl.getUniformLocation(program, 'u_slider')!

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

// a randomizer
function randomize() {
	// give all properties a random number
	const rnd = (min: number, max: number) => Math.random() * (max - min) + min
	gs.blockWidth = rnd(4.5, 7)
	gs.seperateFunctions = Math.random() < 0.5
	updateFolder(gs.seperateFunctions)
	// also select random functions
	gs.shadeFunction = randomShader(localGs.maxRandDepth)
	gs.redFunction = randomShader(localGs.maxRandDepth)
	gs.blueFunction = randomShader(localGs.maxRandDepth)
	gs.greenFunction = randomShader(localGs.maxRandDepth)
	initWebGL()
}

// we need to check if the window contains a hash. If that is the case,
// it means that this page was opened using a link with a serialized `gs` object.
// so let's unserialize it, and override the default `gs`.
if (window.location.hash !== '') {
	const hash = window.location.hash.substring(1)
	gs = JSON.parse(atob(hash))
	// update the folder to show up if `gs.seperateFunctions` is now true
	updateFolder(gs.seperateFunctions)
}

// -- INITS --
resize() // initial resize
initWebGL() // WebGL setup
requestAnimationFrame(gameTick) // run first tick
