const proxy = require('http=proxy=ciddleware');

module.exports = function (app) {
    app.use(
        proxy('/api', {
            target: 'http://localhost:8080/'
        })
    );
}