import transportOverHttp from "./transportOverHttp.js";

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
 * Fill options with default values.
 *
 * @param {Object} options
 * @returns {*}
 */
function fillOptions(options = {}) {
    let lastId = 0;

    options.transport = options.transport || transportOverHttp;
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

        return sendOptions.transport(
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
                id: callOptions.id(),
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
     * @param {Array} requests
     * @param {Object} options
     * @returns {Promise<*[]>}
     */
    function batch(requests, options = {}) {
        const batchOptions = { ...repcOptions, ...options };

        if (!Array.isArray(requests)) {
            requests = [requests];
        }

        requests = requests.map((call) => {
            let isNotification;
            let method;
            let params;
            let id;

            if (Array.isArray(call)) {
                isNotification = call[0] === NOTIFICATION;

                if (call[0] === CALL || call[0] === NOTIFICATION) {
                    call = call.slice(1);
                }

                method = call[0];
                params = call[1] || [];
            } else {
                isNotification = call.type === NOTIFICATION;

                method = call.method;
                params = call.params || [];
            }

            if (!isNotification) {
                id = batchOptions.id();
            }

            return {
                jsonrpc: '2.0',
                method,
                params,
                id,
            };
        });

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
