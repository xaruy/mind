import TreeDirective from './tree.directive';

module.exports = function (mindApp) {
    require('./tree.css');
    mindApp.directive('treeMap', TreeDirective);
}