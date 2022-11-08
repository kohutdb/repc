import httpTransporter from "./httpTransporter.js";

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
 * Fill options with default values.
 *
 * @param {Object} options
 * @returns {*}
 */
function fillOptions(options = {}) {
    let lastId = 0;

    options.transporter = options.transporter || httpTransporter;
    options.id = options.id || ((method, params = []) => ++lastId);

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
    };

    /**
     * Send a request.
     *
     * @param {Object|Array} request
     * @param {Object} options
     * @returns {Promise<*>}
     */
    function send(request = {}, options = {}) {
        const sendOptions = { ...repcOptions, ...options };

        return sendOptions.transporter.transport(
            url,
            request,
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
     * @returns {Promise<*>}
     */
    function call(method, params = [], options = {}) {
        const callOptions = { ...repcOptions, ...options };

        return send(
            {
                jsonrpc: '2.0',
                method,
                params,
                id: callOptions.id(method, params),
            },
            callOptions,
        ).then((response) => {
            if (!response) {
                return response;
            }

            const error = response.error;

            if (error) {
                throw new JsonRpcError(error);
            }

            return response.result;
        });
    }

    /**
     * Send a notification.
     *
     * @param {string} method
     * @param {Object|Array} params
     * @param {Object} options
     * @returns {Promise<void>}
     */
    function notify(method, params = [], options = {}) {
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
     * @param {Function} buildFn
     * @param {Object} options
     * @returns {Promise<*[]>}
     */
    function batch(buildFn, options = {}) {
        const batchOptions = { ...repcOptions, ...options };

        const requests = [];

        const builder = {
            call(method, params = [], id = undefined) {
                if (!id) {
                    id = batchOptions.id();
                }

                requests.push({
                    jsonrpc: '2.0',
                    method,
                    params,
                    id,
                });

                return builder;
            },
            notify(method, params = []) {
                requests.push({
                    jsonrpc: '2.0',
                    method,
                    params,
                });

                return builder;
            },
        };

        buildFn(builder);

        return send(
            requests,
            batchOptions,
        ).then((response) => {
            if (!response) {
                return [];
            }

            return response;
        });
    }

    return context;
}

export default repc;
