import sidebarCtr from './sidebar.controller'

function sidebarComponent() {
    return {
        bindings: {
            activeIndex: '<', //选中根任务的下标
            rootList: '<',
            onChoose: '&',
            onCreate: '&',
        },
        controller: sidebarCtr,
        template: require('./sidebar.html')
    }
}
export default sidebarComponent;