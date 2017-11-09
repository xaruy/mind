import sidebarComponent from './sidebar.component';
import sidebarService from './sidebar.service'

module.exports = function (mindApp) {
    require('./sidebar.css');
    mindApp.component('mindSidebar', sidebarComponent())
        .service('SidebarAPI', sidebarService);
}