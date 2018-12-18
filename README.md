# nqdm
Simple progress indicator made for *for~of* statements.

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
  4.70% [=====>                                                                  ] 00:00:04 00:01:37 [19.72 iter/sec]
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

### dest

Choose where to write progress indicator 'stdout' or 'stderr', another value will be ignored.  
Defaults to be 'stdout'.

```js
for(const v of nqdm(arr, {dest: 'stderr'})){
	// now nqdm will write the progress into process.stderr
}
```

### callback

You can define your own callback function being called per iteration.

```js
const cb = ({current, total, ratio, elapsed, remain, perSec}) => {
	console.log({current, total, ratio, elapsed, remain, perSec})
}

for(const v of nqdm(arr, {callback: cb})){
	// do something
}

```

### silent

nqdm will display nothing when set this option to true. (designed to use with callback function.)

```js
for(const v of nqdm(arr, {silent: true})){
	// now nqdm displays nothing.
}
```