const ratio = (current, total) => Math.min(current/total, 1.0)

const elapsed = (now, startedAt) => now - startedAt

const remain = (current, total, now, startedAt) => ((now - startedAt)/current)*(total-current)

const perSec = (current, now, startedAt) => current/(now - startedAt)*1000

const formatMsec = msec => {
	const _sec = msec/1000
	const _min = _sec/60
	const _hour = _min/60
	const hour = Math.floor(_hour)
	const min = Math.floor(_min - hour*60)
	const sec = Math.floor(_sec - hour*60*60 - min*60)
	return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const formatPercentile = (ratio) => `${(ratio*100).toFixed(2)}%`.padStart(7, ' ')

const formatBar = (barLength, ratio) => ([...Array(Math.max(Math.round(barLength*ratio)-1, 0))].map(v=>'=').join('')+'>').padEnd(barLength, ' ')

const format = (current, total, ratio, elapsed, remain, perSec, width) => {
	const _percentile = total ? formatPercentile(ratio) : `${current}`
	const _elapsed = formatMsec(elapsed)
	const _remain = remain ? ' '+ formatMsec(remain) : ''
	const _time = _elapsed + _remain
	const _perSec = `[${perSec.toFixed(2)} iter/sec]`
	const barLength = width - (_percentile.length + _elapsed.length + _remain.length + _perSec.length + 5)
	const bar = `[${formatBar(barLength, ratio)}]`
	return `${_percentile} ${bar} ${_time} ${_perSec}`
}

const nqdm = (entity, {length, callback, silent, dist='stdout'}={}) => {
	const iterator = entity[Symbol.iterator]()
	const startedAt = new Date().getTime()
	const total = length || entity.length
	let current = 0
	return {[Symbol.iterator]: () => ({next: () => {
		const now = new Date().getTime()
		const _ratio = total ? ratio(current, total) : 1.0
		const _elapsed = elapsed(now, startedAt)
		const _remain = total ? remain(current, total, now, startedAt) : null
		const _perSec = perSec(current, now, startedAt)
		const _dist = dist == 'stdout' ? process.stdout : dist == 'stderr' ? process.stderr : null
		const width = _dist ? _dist.columns : null
		;callback && callback({current, total, ratio: _ratio, elapsed: _elapsed, remain: _remain, perSec: _perSec})
		;(!silent && _dist) && _dist.write(`\r${format(current, total, _ratio, _elapsed, _remain, _perSec, width)}`)
		current++
		return iterator.next()
	}})}
}

module.exports = nqdm
