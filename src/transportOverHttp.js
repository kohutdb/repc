/**
 * Transport data over HTTP using fetch.
 *
 * @param {string} url
 * @param {Object|Array} data
 * @param {Object} context
 * @returns {Promise<string>}
 */
function transportOverHttp(url, data = {}, context = {}) {
    return fetch(url, {
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

export default transportOverHttp;
