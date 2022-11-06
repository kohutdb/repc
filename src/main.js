/**
 * A JSON-RPC error.
 */
export class JsonRpcError extends Error {
    constructor(error) {
        super(error.message);

        this.code = error.code;
        this.message = error.message;
        this.data = error.data;
    }
}

/**
 * Call method request type.
 */
export const CALL = Symbol('call');

/**
 * Notification request type.
 */
export const NOTIFICATION = Symbol('notification');

/**
 * Transport data over HTTP using fetch.
 *
 * @param {string} url
 * @param {Object|Array} data
 * @param {Object} context
 * @returns {Promise<string>}
 */
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
        .then((r) => r.text());
}

function fillOptions(options = {}) {
    options.fetch = options.fetch || global.fetch;
    options.transport = options.transport || httpFetchTransport;

    return options;
}

/**
 * Build a context.
 *
 * @param {string} url
 * @param {Object} options
 * @returns {Object}
 */
function repc(url, options = {}) {
    const repcOptions = fillOptions(options);

    /**
     * The repc context.
     */
    const context = {
        url,
        send,
        call,
        notify,
        batch,
        options: repcOptions,
        lastId: 0,
    };

    /**
     * Send a request.
     *
     * @param {Object|Array} data
     * @param {Object} options
     * @returns {*}
     */
    function send(data = {}, options = {}) {
        const sendOptions = { ...repcOptions, ...options };

        return sendOptions.transport(
            url,
            data,
            {
                ...context,
                options: sendOptions,
            },
        ).then((text) => {
            text = (text || '').trim();

            if (text) {
                return JSON.parse(text);
            }

            return undefined;
        });
    }

    /**
     * Call a method.
     *
     * @param {string} method
     * @param {Object|Array} params
     * @param {Object} options
     * @returns {*}
     */
    function call(method, params = {}, options = {}) {
        const callOptions = { ...repcOptions, ...options };

        return send(
            {
                jsonrpc: '2.0',
                method,
                params,
                id: ++context.lastId,
            },
            callOptions,
        ).then((data) => {
            if (!data) {
                return data;
            }

            const error = data.error;

            if (error) {
                throw new JsonRpcError(error);
            }

            return data.result;
        });
    }

    /**
     * Send a notification.
     *
     * @param {string} method
     * @param {Object|Array} params
     * @param {Object} options
     * @returns {*}
     */
    function notify(method, params = {}, options = {}) {
        const notifyOptions = { ...repcOptions, ...options };

        return send(
            {
                jsonrpc: '2.0',
                method,
                params,
            },
            notifyOptions,
        ).then(() => undefined);
    }

    /**
     * Send a batch of requests.
     *
     * @param {Array} requests
     * @param {Object} options
     * @returns {*|*[]}
     */
    function batch(requests, options = {}) {
        const batchOptions = { ...repcOptions, ...options };

        if (!Array.isArray(requests)) {
            requests = [requests];
        }

        requests = requests.map((call) => {
            let id = ++context.lastId;

            if (Array.isArray(call)) {
                if (call[0] === NOTIFICATION) {
                    id = undefined;
                }

                if (call[0] === CALL || call[0] === NOTIFICATION) {
                    call = call.slice(1);
                }

                return {
                    jsonrpc: '2.0',
                    method: call[0],
                    params: call[1] || {},
                    id,
                };
            }

            return {
                jsonrpc: '2.0',
                method: call.method,
                params: call.params || {},
                id: call.type === NOTIFICATION ? undefined : id,
            };
        });

        return send(
            requests,
            batchOptions,
        ).then((data) => {
            if (!data) {
                return [];
            }

            return data;
        });
    }

    return context;
}

/**
 * Create repc in flat mode.
 *
 * @param {string} url
 * @param {Object} options
 * @returns {(function(*=, *=): *)|{}}
 */
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

/**
 * Create repc in hyperflat mode.
 *
 * @param {string} url
 * @param {Object} options
 * @returns {(function(*=, *=): *)|{}}
 */
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
