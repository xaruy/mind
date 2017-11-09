import mindComponent from './mind.component';

import MindService from './mind.service';

module.exports = function (mindApp) {
    mindApp.component('mindMap', mindComponent());
    mindApp.service('MindAPI', MindService);
}