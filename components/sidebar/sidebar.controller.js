class SidebarController {
    constructor($) {
        Object.assign(this, {
            $
        });
    }

    changeWidth(width) {
        console.log('width', width);

    }


}

SidebarController.$inject = ['$scope'];
export default SidebarController;