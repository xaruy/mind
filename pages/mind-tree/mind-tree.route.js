mindeTreeRoute.$inject = ['$stateProvider', '$urlRouterProvider'];
export default function mindeTreeRoute($stateProvider, $urlRouterProvider) {
    $stateProvider.state('app.mind', {
        url: '/mind/:treeid',
        params: {
            rootlist: undefined,
        },
        views: {
            "app-container@app": {
                template: require('./mind-tree.html'),
                controller: 'mindTreeController',
                controllerAs: 'mindCtr'
            }
        }
    });
}