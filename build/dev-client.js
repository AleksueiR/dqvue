require('eventsource-polyfill');
const hotClient = require('webpack-hot-middleware/client?noInfo=true&reload=true');

hotClient.subscribe(event => {
    if (event.action === 'reload') {
        // this reloads the whole page;
        // window.location.reload();
    }
});