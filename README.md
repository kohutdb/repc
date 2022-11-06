# repc

Simple yet powerful JSON-RPC client for JavaScript and Node.js.

## Installation

```shell
npm i repc
```

## Usage

```javascript
repc(url, options)
```

Normal mode:

```javascript
import repc from 'repc';

const math = repc('https://math.juana.dev/v1/call');

const result = await math.call('add', [2, 2]);
const result = await math.call('div', [3.14, 0]); // DivisonByZero error
```

Flat mode:

```javascript
import repc from 'repc';

const math = repc.flat('https://math.juana.dev/v1/call');

const result = await math.add([2, 2]);
const result = await math.div({ a: 3.14, b: 0 }); // DivisonByZero error
```

Hyperflat mode (not recommended):

```javascript
import repc from 'repc';

const math = repc.hyperflat('https://math.juana.dev/v1/call');

const result = await math.add(2, 2);
const result = await math.div({ a: 3.14, b: 0 }); // First parameter invalid type error
```

## Options

### `headers`

Initial headers.

- type: `Object`
- example: `{ Authorization: 'Bearer ...' }`

### `fetch`

Fetch function.

- type: `Function`
- example: `window.fetch`

### `transport`

Data transportation function.

- type: `Function(name, parameters, options, context)`
- example:

```javascript
(name, parameters, options, context) =>
    fetch(context.url, {
        data: JSON.stringify({
            jsonrpc: "2.0",
            method: name,
            params: parameters,
            id: null,
        }),
        headers: context.getHeaders(),
    }).then((r) => r.json());
```

## Methods

> Work only in normal mode.

### `setHeaders(headers)`

Replace all headers.

### `setHeader(name, value)`

Set value for a single header.

### `getHeaders()`

Get all headers.

### `getHeader(name)`

Get single header value.
