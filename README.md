# nqdm
Simple progress indicator

## Installation

```sh
npm install nqdm
```

## Usage

```js
const nqdm = require('nqdm')

const sleep = sec => new Promise(resolve => setTimeout(resolve, sec*1000))

const arr = [...Array(1000)]

const iterate = async () => {
	for(const v of nqdm(arr)){
		await sleep(0.05)
	}
}

iterate()
```

Results:

```sh
  4.70% [=====>                                                                   ] 00:00:04 00:01:37 [19.72 iter/sec]
```

## Options

### length

You can manually specify total length of items when you works with iterable objects without 'length' property. (Typically for generators.)

```js
function* gen(num) {
	for(let i=0;i<num;i++){
		yield i
	}
}

const g = gen(100)

for(const v of nqdm(g, {length: 100})){
	// do something
}
```

### callback

You can define your own callback function being called per iteration.

```js
const cb = (current, total, startedAt) => {
	console.log( `${(current/total).toFixed(2)}% done.` ) 
}

for(const v of nqdm(arr, {callback: cb})){
	// do something
}

```

### silent

Nqdm will display nothing when set this option to true. (designed to use with callback option.)

```js
for(const v of nqdm(arr, {silent: true})){
	// now nqdm displays nothing.
}
```