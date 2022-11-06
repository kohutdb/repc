function httpFetchTransport(url, data = {}, context = {}) {
    return context.options.fetch(url, {
        method: 'post',
        headers: {
            ...context.options.headers,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
    })
        .then((r) => r.text())
        .then((text) => {
            text = text.trim();

            if (text) {
                return JSON.parse(text);
            }

            if (Array.isArray(data)) {
                return [];
            }

            return {
                jsonrpc: '2.0',
                error: null,
                result: undefined,
                id: null,
            };
        });
}

function fillOptions(options = {}) {
    options.fetch = options.fetch || global.fetch;
    options.transport = options.transport || httpFetchTransport;

    return options;
}

export class JsonRpcError extends Error {
    constructor(error) {
        super(error.message);

        this.code = error.code;
        this.message = error.message;
        this.data = error.data;
    }
}

function repc(url, options = {}) {
    const repcOptions = fillOptions(options);

    const context = {
        url,
        call,
        batch,
        options: repcOptions,
        lastId: 0,
    };

    function call(method, params = {}, options = {}) {
        const callOptions = { ...repcOptions, ...options };

        return callOptions.transport(
            url,
            {
                jsonrpc: '2.0',
                method,
                params,
                id: ++options.lastId,
            },
            {
                ...context,
                options: callOptions,
            },
        ).then((data) => {
            const error = data.error;
            if (error) {
                throw new JsonRpcError(error);
            }

            return data.result;
        });
    }

    function batch(calls, options) {
        if (Array.isArray(calls)) {
            calls = [calls];
        }

        const callOptions = { ...repcOptions, ...options };

        calls = calls.map((call) => {
            if (Array.isArray(call)) {
                return {
                    jsonrpc: '2.0',
                    method: call[0],
                    params: call[1],
                    id: ++options.lastId,
                };
            }

            return {
                jsonrpc: '2.0',
                method: call.method,
                params: call.params,
                id: ++options.lastId,
            };
        });

        return callOptions.transport(
            url,
            calls,
            {
                ...context,
                options: callOptions,
            },
        ).then((data) => {
            return data.map((item) => {
                const error = item.error;
                if (error) {
                    return new JsonRpcError(error);
                }

                return item.result;
            })
        });
    }

    return context;
}

repc.flat = (url, options = {}) => {
    const rpc = repc(url, options);

    return new Proxy({}, {
        get(target, p, receiver) {
            return (params = {}, options = {}) => {
                return rpc.call(p, params, options);
            };
        },
    });
};

repc.hyperflat = (url, options = {}) => {
    const rpc = repc(url, options);

    return new Proxy({}, {
        get(target, p, receiver) {
            return (...params) => {
                return rpc.call(p, params, options);
            };
        },
    });
};

export default repc;
