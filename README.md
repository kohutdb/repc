# repc

Simple yet powerful JSON-RPC client for JavaScript and Node.js. If you need a server,
try [sepc](https://github.com/kohutd/sepc).

## Installation

```shell
npm i repc
```

## Usage

```javascript
repc(url, options)
```

Call:

```javascript
import repc from 'repc';

const math = repc('https://math.juana.dev/v1');

const result = await math.call('add', [2, 2]);
```

Notification:

```javascript
import repc from 'repc';

const math = repc('https://math.juana.dev/v1');

math.notify('ping');
```

Batch:

```javascript
import repc from 'repc';

const math = repc('https://math.juana.dev/v1');

const responses = await math.batch(
    (builder) => builder
        .call('add', [2, 2])
        .call('div', [3.14, 0])
        .call('mul', [6, 6])
        .call('sub', [10, 5])
        .notify('ping')
);
```

## Options

### `id`

Request ID generation function.

- type: `function(method, params)`

### `transporter`

Data transporter. Must implement `transport` function which returns `Promise<string>`.

- type: `object`
- example:

```javascript
const httpTransporter = {
    transport: (url, data, context) =>
        fetch(url, {
            body: JSON.stringify(data),
            headers: context.options.headers,
        }).then((r) => r.text()),
}
```

## Methods

### `send(request, options)`

Make request. Returns response.

### `call(method, params, options)`

Call method. Returns result.

### `notify(method, params, options)`

Send notification. Returns nothing.

### `batch(builder, options)`

Make several requests at the same time.
Returns array of responses.
