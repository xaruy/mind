import angular from 'angular';

import common from '../_common';

require('angular-ui-router');
require('angular-ui-bootstrap');
require('angular-animate');
const mindApp = angular.module('mindApp', ['ui.router', 'ui.bootstrap', 'ngAnimate', common]);

require('./components/sidebar/index')(mindApp);
require('./components/mind-map/index')(mindApp);

require('./components/mind-map/tree/index')(mindApp);

require('./pages/mind-tree/index')(mindApp);

export default 'mindApp';