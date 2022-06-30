/* 
	TODO:
	give more meaningful error messages than console errors
		 
*/

// -- IMPORTS --
import './style.css'
import { FRAME_PER_SIMU } from './consts'
import { colorGuiItem, randomShader, share } from './utils'
import frag from './frag.glsl?raw'
import vert from './vert.glsl?raw'

import * as twgl from 'twgl.js'
import { GUI, GUIController } from 'dat.gui'
import Stats from 'stats.js'

// simulation game state
export let gs = {
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

// add a warning for people with photosensitive epilepsy
setupFlashWarning()

// -- GUI SETUP --
const gui = new GUI({ width: 400 })

// setup sliders and options. Almost all are set to listen since they can be updated externally
// the simulation folder contains all data that is essential for running this particular simulation
const simuFolder = gui.addFolder('Simulation settings')
simuFolder.open()
simuFolder.add(gs, 'blockWidth', 4, 7).step(0.0001).name('Block width').listen()
simuFolder.add(gs, 'zoom', 1, 10).name('Zoom = <strong style="color: red">lag</strong>').listen()
let rgbFunctions!: GUI, generalFunction!: GUIController
simuFolder.add(gs, 'animationState', ['forward', 'backwards']).name('Animation direction')
simuFolder.add(gs, 'animationSpeed', 1, 1000).name('Simulation speed').step(1)
const updateFolder = (state: boolean) => {
	if (state) {
		// seperate functions are now enabled, hide the general shade function and show the category
		rgbFunctions.show()
		rgbFunctions.open()
		// the `d.ts` file hides the __li property, but I can access it this way
		const elem = (generalFunction as any).__li as HTMLLIElement
		elem.style.display = 'none'
	} else {
		// seperate functions are now disabled, show the general shade function and hide the category
		rgbFunctions.hide()
		const elem = (generalFunction as any).__li as HTMLLIElement
		elem.style.display = ''
	}
	initWebGL()
}
simuFolder.add(gs, 'seperateFunctions').onFinishChange(updateFolder).name('Seperate RGB functions').listen()
generalFunction = simuFolder
	.add(gs, 'shadeFunction')
	.name('Combined shading function')
	.onFinishChange(initWebGL)
	.listen()
rgbFunctions = simuFolder.addFolder('RGB functions')
;['red', 'green', 'blue'].forEach(color => {
	// add the RGB color function
	const elem = rgbFunctions
		.add(gs, `${color}Function`)
		.name(`${color.replace(/^\w/, c => c.toUpperCase())} function`) // capitalize the first letter
		.onFinishChange(initWebGL)
		.listen()
	// make its color fit
	colorGuiItem(elem, color)
})
rgbFunctions.hide() // hidden by default
simuFolder.add(gs, 'slider', 0, 15).step(0.0001).name('Animation slider (n)').listen()

// settings unessential to simulation
const otherFolder = gui.addFolder('Other settings')
otherFolder.open()
otherFolder.add(localGs, 'isPaused').name('Pause')
otherFolder
	.add(localGs, 'maxRandDepth', 0, 30)
	.step(1)
	.name('Max rand function depth = <strong style="color: red">lag</strong>')

// Github and Discord links
const linksFolder = gui.addFolder('Links')
linksFolder.open()
const createLink = (name: string, dest: string, color: string) => {
	const link = linksFolder.add({ fn: () => window.open(dest) }, 'fn').name(name)
	colorGuiItem(link, color)
}
createLink('Github — source code and FAQ', 'https://github.com/Yaron-Ha/WoozyGraph', '#f6f8fA')
createLink('Discord — send builds and suggestions', 'https://discord.gg/hZCRuXmU2S', '#36393f')

gui.add({ fn: randomize }, 'fn').name(
	'Randomize button (alternatively <strong style="color: red">left click canvas</strong>)'
)
gui.add({ fn: share }, 'fn').name('Found or created a cool build? Click here to share its link')
colorGuiItem(gui.add({ fn: () => snapshotCanvas(canvas) }, 'fn').name('Take a screenshot of the canvas'), '#bff2ff')

// -- RENDERING --
// canvas objects
const canvas = document.getElementById('the-canvas') as HTMLCanvasElement
let gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false })!

// lateinit variables holding the size of the block, resolution and slider state
let blockSizeLocation!: WebGLUniformLocation
let resolutionLocation!: WebGLUniformLocation
let sliderLocation!: WebGLUniformLocation

// the last time a frame was rendered, used for timing
let last = 0
const gameTick = () => {
	// begin FPS measure
	stats.begin()
	// see if enough time passed to call a simulation tick
	const now = Date.now()
	const elapsed = now - last
	if (elapsed > FRAME_PER_SIMU && !localGs.isPaused) {
		last = now
		// now render it
		renderTick()
	}
	// end FPS measure
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
	// the size of the canvas that the image is projected on, assuming one point is one pixel
	const projectionSize = (drawnWidth * drawnHeight) / blockWidth
	const imageBuffer = new Float32Array(projectionSize)
	// the cell counter helps put the image pixels in the right place
	let cellCounter = 0
	// for each column
	for (let y = 0; y < drawnHeight; y += blockWidth) {
		// for each row in that column
		for (let x = 0; x < drawnWidth; x += blockWidth) {
			// modify each pixel
			imageBuffer[cellCounter] = x
			imageBuffer[cellCounter + 1] = y
			cellCounter += 2
		}
	}

	gl.bufferData(gl.ARRAY_BUFFER, imageBuffer, gl.STATIC_DRAW)
	// when passing the projection size, divide it by two. That's because a vec2 is passed
	// rather than a regular float
	gl.drawArrays(gl.POINTS, 0, projectionSize / 2)
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

	// setup program
	const program = twgl.createProgram(gl, [vert, updatedFrag])
	gl.useProgram(program)
	// setup uniforms
	resolutionLocation = gl.getUniformLocation(program, 'u_resolution')!
	blockSizeLocation = gl.getUniformLocation(program, 'u_blockSize')!
	sliderLocation = gl.getUniformLocation(program, 'u_slider')!
	// setup attributes
	const positionLocation = gl.getAttribLocation(program, 'a_position')
	const pointBuffer = gl.createBuffer()
	gl.bindBuffer(gl.ARRAY_BUFFER, pointBuffer)
	gl.enableVertexAttribArray(positionLocation)
	// set the location attribute, which is a 2D vector of the x and y coord of the point
	gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0)
	gl.deleteProgram(program)
}

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

function setupFlashWarning() {
	// we first need to check if the user has confirmed they have no sensitivity to flashing imagery
	let confirmedSafe = localStorage.confirmedSafe // null is falsy
	const epilepsyButton = document.getElementById('close-warning') as HTMLButtonElement
	const epilepsyWarning = document.getElementById('flash-warning') as HTMLDivElement
	const canvasContainer = document.getElementById('canvas-container') as HTMLDivElement

	if (!confirmedSafe) {
		// expose the warning
		epilepsyWarning.style.visibility = ''
		canvasContainer.style.opacity = '0.05'
		// it's not a big deal if I don't cancel this later, as it's only visible
		// when the canvas has transparency
		document.body.style.backgroundColor = '#000'
	}

	epilepsyButton.onclick = () => {
		// on cilck, delete the warning and save the confirmation in localStorage
		confirmedSafe = localStorage.confirmedSafe = true
		epilepsyWarning.style.visibility = 'hidden'
		// animate the closing effect
		canvasContainer.style.transition = 'opacity 0.5s ease-in-out'
		canvasContainer.style.opacity = '1'
	}
}

function snapshotCanvas(canvas: HTMLCanvasElement) {
	// I usually don't mess with polyfills but this is pretty essential
	if (!navigator.clipboard || !window.ClipboardItem) {
		alert("Unable to take a screenshot: your browser doesn't support copying images to the clipboard! If you really want to take a screenshot, open WoozyGraph on Chrome.")
		return
	}
	// copies the canvas state to the clipboard. TODO: copy it in its actual resolution
	// copying WebGL canvases is incredibly annoying. I have to set `preserveDrawingBuffer` (slow!) to true
	// or else I get an empty black canvas. Thankfully, I can swap it fast 
	gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: true })!
	// force a re-render
	renderTick()
	// copy the image
	canvas.toBlob((blob: Blob | null) => {
		// console.log()
		navigator.clipboard.write([
			new ClipboardItem({
				// it really shouldn't be null
				'image/png': blob!
			})
		])
		alert('Screenshot successfully copied to clipboard!')
		// restore old `gl` context
		gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: false })!
	})
}

// we need to check if the window contains a hash. If that is the case,
// it means that this page was opened using a link with a serialized `gs` object.
// so let's unserialize it, and override the default `gs`
if (window.location.hash !== '') {
	const hash = window.location.hash.substring(1)
	Object.assign(gs, JSON.parse(atob(hash)))
	// update the folder to show up if `gs.seperateFunctions` is now true
	updateFolder(gs.seperateFunctions)
}

// a useful display for FPS and stuff
const stats = new Stats()
document.body.appendChild(stats.dom)

// -- INITS --
resize() // initial resize
initWebGL() // WebGL setup
requestAnimationFrame(gameTick) // run first tick
