docute.init({
    landing: 'landing.html',
    debug: true,
    repo: 'AleksueiR/dqvue',
    tocVisibleDepth: 3,
    nav: {
        default: [
            {
                title: 'Home',
                path: '/home'
            },
            {
                title: 'Samples',
                path: '/samples/'
            },
            {
                title: 'API',
                path: '/api'
            }
        ]
    },
    plugins: [evanyou()]
});
