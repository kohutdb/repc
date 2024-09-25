/**
 * Data transporter over HTTP using fetch.
 */
const httpTransporter = {
    /**
     * @param {string} url
     * @param {Object|Array} data
     * @param {Object} context
     * @returns {Promise<string>}
     */
    transport(url, data = {}, context = {}) {
        return fetch(url, {
            method: 'post',
            headers: {
                ...(context.options.headers || {}),
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        })
            .then((r) => r.text());
    }
}

export default httpTransporter;
