import { GUIController } from 'dat.gui'
import { gs } from './main'

// random array element
const rndElem = <T>(array: T[]) => array[~~(Math.random() * array.length)]

export function randomShader(maxDepth: number): string {
	// creates and returns a random shader function
	const variables = ['x', 'y', 'n']
	const operators = ['+', '-', '*', '/'] // two parameter operators
	const functions1 = [
		'sin',
		'cos',
		'tan',
		'abs',
		'ceil',
		'round',
		'log',
		'sqrt',
		// 'asin', 'acos', 'atan', 'sinh', // removed because they always appear black
		'cosh',
		'tanh',
		'inversesqrt',
		'radians'
	]
	const functions2 = ['pow', 'min', 'max']

	const createExpression = (internal1?: string, internal2?: string) => {
		// creates a mathematical expression of one or two paramters. Optionally takes one or two
		// additional expressions which are added to the variable list
		const usesTwo = Math.random() < 0.5 // should the expression take two variables?
		if (usesTwo) {
			// take two variables, preferably `internal` if not null
			// add a random number as a variable
			const specificVars = [(Math.random() * 20).toFixed(3), ...variables]
			const exprs = shuffleArray([internal1 ?? rndElem(specificVars), internal2 ?? rndElem(specificVars)])
			if (Math.random() < 0.5) {
				// use operators?
				const operator = rndElem(operators)
				// operators always get wrapped inside parenthesis to prevent messing with PEMDAS
				return `(${exprs[0]} ${operator} ${exprs[1]})` // example: "(x - y)"
			} else {
				// use functions with two inputs
				const fun2 = rndElem(functions2)
				return `${fun2}(${exprs[0]}, ${exprs[1]})` // example: "pow(x, n)"
			}
		} else {
			// only take one. If an internal expression was given, wrap it in another expression,
			// otherwise select a variable instead. If two internal expressions were given, it just ignores the second
			const expr = internal1 ?? rndElem(variables)
			const fun1 = rndElem(functions1)
			return `${fun1}(${expr})` // example: "sin(x)"
		}
	}

	const createScope = (maxDepth: number, depth: number = 0, innerScope?: string): string => {
		// creates a code scope and integrates various functions
		// returns early if max recursion depth was reached, or the scope is already valid
		if (depth > maxDepth || (Math.random() > maxDepth / 3 && innerScope)) return innerScope!
		innerScope ??= createExpression()
		const scope1 = createScope(maxDepth, depth + 1, innerScope)
		const scope2 = createExpression()
		return createExpression(scope1, scope2)
	}

	return createScope(maxDepth)
}

// taken from Laurens Holst's answer on StackOverflow
export function shuffleArray<T>(array: T[]): T[] {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1))
		;[array[i], array[j]] = [array[j], array[i]]
	}
	return array
}

export function share() {
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

export function colorGuiItem(elem: GUIController, color: string) {
	const container = (elem as any).__li as HTMLLIElement
	container.style.borderLeftColor = color
}
