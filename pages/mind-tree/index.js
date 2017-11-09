import mindeTreeRoute from './mind-tree.route'

import mindTreeController from './MindTree.controller'

module.exports = function (mindApp) {
    mindApp.config(mindeTreeRoute);
    mindApp.controller('mindTreeController', mindTreeController);
}