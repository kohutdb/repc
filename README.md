# repc

Simple yet powerful JSON-RPC client for JavaScript and Node.js.

## Installation

```shell
npm i repc
```

## Usage

```javascript
repc(url, options)

repc.flat(url, options)

repc.hyperflat(url, options)
```

Normal mode:

```javascript
import repc from 'repc';

const math = repc('https://math.juana.dev/v1');

const result = await math.call('add', [2, 2]);
const result = await math.call('div', [3.14, 0]); // DivisonByZero error
```

Flat mode:

```javascript
import repc from 'repc';

const math = repc.flat('https://math.juana.dev/v1');

const result = await math.add([2, 2]);
const result = await math.div({ a: 3.14, b: 0 }); // DivisonByZero error
```

Hyperflat mode (not recommended):

```javascript
import repc from 'repc';

const math = repc.hyperflat('https://math.juana.dev/v1');

const result = await math.add(2, 2);
const result = await math.div({ a: 3.14, b: 0 }); // First parameter invalid type error
```

Batch:

```javascript
import repc, { NOTIFICATION } from 'repc';

const math = repc('https://math.juana.dev/v1');

const result = await math.batch([
    // calls
    ['add', [2, 2]],
    { method: 'div', params: { a: 3.14, b: 0 } },
    // notifications
    [NOTIFICATION, 'add', [2, 2]],
    { type: NOTIFICATION, method: 'div', params: { a: 3.14, b: 0 } },
]);
```

## Options

### `headers`

Headers when using over HTTP.

- type: `Object`
- example: `{ Authorization: 'Bearer ...' }`

### `transport`

Data transportation function. Must return `Promise<string>`.

- type: `Function(url, data, context)`
- example:

```javascript
(url, data, context) =>
    fetch(url, {
        body: JSON.stringify(data),
        headers: context.options.headers,
    }).then((r) => r.text());
```

## Methods

> Available only in normal mode.

### `send(data, options)`

Make a request.

### `call(method, params, options)`

Call a method.

### `notify(method, params, options)`

Call notification method.

### `batch(requests, options)`

Make several requests at the same time.
Returns list of raw responses.
