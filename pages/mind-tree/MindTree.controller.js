class MindTreeController {
    constructor($, $state, $stateParams, SidebarAPI, UserDBAPI, MindAPI, UtilService, BaiDuAPI) {
        Object.assign(this, {
            $,
            $state,
            $stateParams,
            SidebarAPI,
            UserDBAPI,
            MindAPI,
            UtilService,
        });
        this.rootList = null; //根节点列表
        this.activeRootid = null; //选中节点的id
        this.activeIndex = 0; //选中节点的位置

        this.tree = null; //树结构

        // 脑图功能的统计
        BaiDuAPI.addBaiDuData('mind_tree');

        this.$init();

        this.$.$on('UPDATESIDETITLE', async() => {
            try {
                this.rootList = await this.getRootList();
            } catch (err) {
                console.error(err);
            }
            this.$.$apply();
        });
    }

    async $init() {
        this.UtilService.showLoading();
        this.rootList = this.$stateParams.rootlist;
        if (!this.rootList) {
            try {
                this.rootList = await this.getRootList();
            } catch (err) {
                console.error(err);
            }
        }

        let treeid = this.$stateParams.treeid;
        if (this.rootList && this.rootList.length) {
            //如果treeid为空则选择第一个根节点,并跳转
            if (!treeid) {
                treeid = this.rootList[0].id;
                this.chooseMind(treeid);
            } else {
                //获取该节点的位置
                let index = this.rootList.findIndex(root => {
                    return root.id === treeid;
                });
                this.activeIndex = index;
                this.activeRootid = treeid;

                //获得整棵树
                try {
                    this.tree = await this.MindAPI.getTreeByRootId(treeid);
                } catch (err) {
                    console.error(err);
                }
                this.UtilService.hideLoading();
                this.$.$apply();
            }
        } else {
            this.UtilService.hideLoading();
        }
    }

    /**
     * 获取根节点列表
     */
    async getRootList() {
        let userid = await this.UserDBAPI.getUserId();
        if (userid) {
            let rootList = await this.SidebarAPI.getRootList(userid);
            return rootList;
        } else {
            //alert('这台设备未被登记，请去氢考勤注册！')
            this.$state.go('app.login.scan');
        }
    }

    /**
     * 新建脑图
     */
    async createMind() {
        try {
            let userid = await this.UserDBAPI.getUserId()
            let mindObj = {
                title: '中心主题',
                creator: userid
            }
            await this.SidebarAPI.createRoot(mindObj);
            //重新获得根节点并更新
            this.rootList = await this.getRootList();
            this.chooseMind(this.rootList[0].id);
        } catch (err) {
            console.error(err);
        }
    }

    /**
     * 选中某个任务树
     * @param {nodeObj} root 
     * @param {int} index 
     */
    chooseMind(rootid, index) {
        console.log(index + 'fsaf ' + this.activeIndex)
        this.$state.go('app.mind', {
            treeid: rootid,
            rootlist: this.rootList,
        });
    }

}

MindTreeController.$inject = ['$scope', '$state', '$stateParams', 'SidebarAPI', 'UserDBAPI', 'MindAPI', 'UtilService', 'BaiDuAPI'];

export default MindTreeController;