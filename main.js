const formatMsec = msec => {
	const _sec = msec/1000
	const _min = _sec/60
	const _hour = _min/60
	const hour = Math.floor(_hour)
	const min = Math.floor(_min - hour*60)
	const sec = Math.floor(_sec - hour*60*60 - min*60)
	return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`
}

const formatBar = (barLength, ratio) => ([...Array(Math.max(Math.round(barLength*ratio)-1, 0))].map(v=>'=').join('')+'>').padEnd(barLength, ' ')

const format = (current, total, startedAt) => {
	const width = process.stdout.columns
	const now = new Date().getTime()
	const diff = now - startedAt
	const ratio = total ? Math.min(current/total, 1.0) : 1.0
	const percentile = total ? `${(ratio*100).toFixed(2)}%`.padStart(7, ' ') : `${current}`
	const elapsed = formatMsec(diff)
	const remain = total ? ' '+formatMsec((diff/current)*(total-current)) : ''
	const time = elapsed + remain
	const perSec = `[${(current/diff*1000).toFixed(2)} iter/sec]`
	const barLength = width - (percentile.length + elapsed.length + remain.length + perSec.length + 5)
	const bar = `[${formatBar(barLength, ratio)}]`
	return `${percentile} ${bar} ${time} ${perSec}`
}

const nqdm = (entity, {length, callback, silent}={}) => {
	const iterator = entity[Symbol.iterator]()
	const startedAt = new Date().getTime()
	const total = length || entity.length
	let current = 0
	return {[Symbol.iterator]: () => ({next: () => {
		callback && callback(current, total, startedAt)
		!silent && process.stdout.write(`\r${format(current, total, startedAt)}`)
		current++
		return iterator.next()
	}})}
}

module.exports = nqdm
