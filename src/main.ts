const ratio = (current:number, total:number) => Math.min(current/total, 1.0)

const elapsed = (now:number, startedAt:number) => now - startedAt

const remain = (current:number, total:number, now:number, startedAt:number) => ((now - startedAt)/current)*(total-current)

const perSec = (current:number, now:number, startedAt:number) => current/(now - startedAt)*1000

const formatMsec = (msec:number) => {
	const _sec = msec/1000
	const _min = _sec/60
	const _hour = _min/60
	const hour = Math.floor(_hour)
	const min = Math.floor(_min - hour*60)
	const sec = Math.floor(_sec - hour*60*60 - min*60)
	return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const formatPercentile = (ratio:number) => `${(ratio*100).toFixed(2)}%`.padStart(7, ' ')

const formatBar = (barLength:number, ratio:number) => ([...Array(Math.max(Math.round(barLength*ratio)-1, 0))].map(v=>'=').join('')+'>').padEnd(barLength, ' ')

const format = (current:number, ratio:number, elapsed:number, perSec:number, width:number, total?:number, remain?:number) => {
	const _percentile = total ? formatPercentile(ratio) : `${current}`
	const _elapsed = formatMsec(elapsed)
	const _remain = remain!=null ? ' '+ formatMsec(remain) : ''
	const _time = _elapsed + _remain
	const _perSec = `[${perSec.toFixed(2)} iter/sec]`
	const barLength = width - (_percentile.length + _elapsed.length + _remain.length + _perSec.length + 5)
	const bar = `[${formatBar(barLength, ratio)}]`
	return `${_percentile} ${bar} ${_time} ${_perSec}`
}

type IterFunc<T=any, U=any> = (value: T, index?: number, array?: T[]) => U

const isNumber = (obj?: any):obj is number => obj !== undefined && typeof obj === 'number' && isFinite(obj)
const isFunction = <T, U>(obj?: any):obj is IterFunc<T, U> => obj !== undefined && typeof obj === 'function'
const hasIterationProtocol = <T>(variable:any):variable is Iterable<T> => variable !== null && variable !== undefined && Symbol.iterator in Object(variable)

function* infiniter() { while(true){ yield } }
function* limitter(n:number) { for(let i=0;i<n;i++){ yield i } }

interface NqdmOptions {
	length?: number,
	callback?: (...args:any[]) => any,
	silent?: boolean,
	dest?: 'stdout' | 'stderr'
}

const updateProgressBar = (current:number, startedAt:number, silent:boolean, dest:NodeJS.WriteStream, width:number, total?: number, callback?: (...args: any[])=>any) => {
	const now = new Date().getTime()
	const _ratio = total ? ratio(current, total) : 1.0
	const _elapsed = elapsed(now, startedAt)
	const _remain = total ? remain(current, total, now, startedAt) : undefined
	const _perSec = perSec(current, now, startedAt)
	;callback && callback({current, total, ratio: _ratio, elapsed: _elapsed, remain: _remain, perSec: _perSec})
	;(!silent && dest) && dest.write(`\r${format(current, _ratio, _elapsed, _perSec, width, total, _remain)}`)
}

const nextFactory = <T, U=void, P=unknown>(iterator: Iterator<T, U, P>|Generator<T, U, P>, startedAt: number, total?: number, callback?: (...args: any[])=>any, silent:boolean=false, dest:'stdout'|'stderr'='stdout') => {
	let current = 0
	const _dest = dest == 'stdout' ? process.stdout : process.stderr
	const width = _dest.columns || 24
	return () => {
		updateProgressBar(current, startedAt, silent, _dest, width, total, callback)
		current++
		return iterator.next()
	}
}

const nqdmForIterable = <T>(entity:Iterable<T> | Array<T>, options:NqdmOptions={}) => {

	const {length, callback, silent, dest} = options

	const iterator = entity[Symbol.iterator]()

	const startedAt = new Date().getTime()
	const total = Array.isArray(entity) ? entity.length : length ? length : undefined

	const iterable:Iterable<T> = {
		[Symbol.iterator]: () => ({next: nextFactory(iterator, startedAt, total, callback, silent, dest)})
	}

	return iterable
	
}

const nqdmForNumber = (length: number, options:NqdmOptions={}) => {

	const {callback, silent, dest} = options

	const entity = Object.assign(limitter(length), {length})
	const iterator = entity[Symbol.iterator]()
	
	const startedAt = new Date().getTime()
	const total = isNumber(length) ? length : undefined

	const iterable = {
		[Symbol.iterator]: () => ({next: nextFactory(iterator, startedAt, total, callback, silent, dest)})
	}

	return iterable
	
}

const nqdmForUndefined = (options:NqdmOptions={}) => {

	const {length, callback, silent, dest} = options

	const entity = infiniter()
	const iterator = entity[Symbol.iterator]()
	
	const startedAt = new Date().getTime()
	const total = isNumber(length) ? length-1 : undefined

	const iterable:Iterable<undefined>&{process: ()=>IteratorResult<undefined, any>} = {
		[Symbol.iterator]: () => ({next: nextFactory(iterator, startedAt, total, callback, silent, dest)}),
		process: () => ({value: undefined, done: false})
	}
	iterable.process = iterable[Symbol.iterator]().next

	return iterable
}

const nqdmForIterFunction = <T, U>(func:IterFunc<T, U>, options:NqdmOptions={}) => {
	const {callback, silent, dest} = options
	let current = 0
	const startedAt = new Date().getTime()
	const _dest = dest == 'stdout' ? process.stdout : process.stderr
	const width = _dest.columns || 24
	const wrapper:IterFunc<T, U> = (v,i,a) => {
		const length = (a||{}).length
		updateProgressBar(current, startedAt, silent||false, _dest, width, length, callback)
		current++
		return func(v,i,a)
	}
	return wrapper
}

export type HandlerType<T> =
	T extends undefined ? Iterable<undefined>&{process: Iterator<undefined>['next']} :
	T extends IterFunc ? IterFunc<Parameters<T>[0], ReturnType<T>> :
	T extends Array<any> ? T :
	T extends Generator<any> ? T :
	Iterable<T>

export function nqdm(options?: NqdmOptions): HandlerType<undefined>
export function nqdm(entity: number, options?: NqdmOptions): HandlerType<number>
export function nqdm<T extends undefined|IterFunc|Array<any>|Generator<any>=undefined>(entity: T, options?: NqdmOptions): HandlerType<T>
export function nqdm<T extends undefined|number|IterFunc|Array<any>|Generator<any>=undefined>(entity?: T, options: NqdmOptions={}){
	if (isNumber(entity)){
		return <HandlerType<number>>nqdmForNumber(entity, options)
	} else if (hasIterationProtocol(entity)) {
		return <HandlerType<T>>nqdmForIterable(entity, options)
	} else if (isFunction(entity)) {
		return <HandlerType<T>>nqdmForIterFunction(entity, options)
	} else {
		return <HandlerType<T>>nqdmForUndefined(entity as NqdmOptions)
	}
}

export default nqdm