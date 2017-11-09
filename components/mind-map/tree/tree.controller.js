class TreeController {
    constructor($, $state, MindAPI, UserDBAPI) {
        Object.assign(this, {
            $,
            $state,
            MindAPI,
            UserDBAPI,
        });
    }

    /**
     * 修改节点标题
     * @param {*} node 
     * @param {*} newTitle 
     */
    async setNodeTitle(node, newTitle) {

        if (newTitle && newTitle !== '') {

            let nodeInfo = {};
            nodeInfo.nodeId = node.id;
            nodeInfo.title = newTitle;
            nodeInfo.rootId = node.id;

            if (node.root) {
                nodeInfo.rootId = node.root.id;
            }

            await this.MindAPI.setNodeTitle(nodeInfo);

            //如果是根节点，广播边栏同时更新
            if (!node.root) {
                this.$.$emit('UPDATESIDETITLE');
            }
        }
    }

    /**
     * 添加子节点
     */
    async addSubNode() {
        let newNode = {};
        if (this.$.graph.selected) {
            newNode.title = '新节点';
            newNode.creator = await this.UserDBAPI.getUserId();
            let fatherNode = this.$.graph.selected;

            newNode.rootid = fatherNode.id;
            if (fatherNode.root) {
                newNode.rootid = fatherNode.root.id;
            }
            newNode.fatherid = fatherNode.id;
            newNode = await this.MindAPI.createNode(newNode);
            this.$.graph.addNode(fatherNode, newNode);
        } else {
            console.log('father can\'t null!');
        }
    }

    /**
     * 添加兄弟节点
     */
    async addBroNode() {
        let newNode = {};
        if (this.$.graph.selected) {
            if (this.$.graph.selected.isRootNode()) {
                console.log('cannot add brother node for root');
            } else {
                newNode.title = '新节点';
                newNode.creator = await this.UserDBAPI.getUserId();
                let broNode = this.$.graph.selected;
                newNode.rootid = broNode.root.id;
                newNode.fatherid = broNode.father.id;
                newNode.broid = broNode.id;
                newNode = await this.MindAPI.createNode(newNode);
                this.$.graph.addNode(this.$.graph.selected.father, newNode, this.$.graph.selected);
            }
        } else {
            console.log('father can\'t null!');
        }
    }

    /**
     * 删除子节点
     */
    async delectNode() {
        if (this.$.graph.selected) {

            let nodeInfo = {};
            let node = this.$.graph.selected;
            nodeInfo.nodeId = node.id;
            nodeInfo.rootId = node.id;
            nodeInfo.fatherId = node.id;
            nodeInfo.userId = await this.UserDBAPI.getUserId();

            if (node.root) {
                nodeInfo.rootId = node.root.id;
            }

            if (node.father) {
                nodeInfo.fatherId = node.father.id
            }

            //如果删除的是根节点需要重新跳转页面
            if (this.$.graph.selected.isRootNode()) {
                await this.MindAPI.deleteNode(nodeInfo);
                this.$state.go('app.mind', {
                    treeid: null,
                    rootlist: null,
                });
            } else {
                await this.MindAPI.deleteNode(nodeInfo);
                this.$.graph.removeNode(this.$.graph.selected);
                this.$.graph.setSelected(null);
            }
        } else {
            console.log('node can\'t null!');
        }
    }

    /**
     * 拖拽节点后保存进数据
     * @param {*} setParentInfo 
     */
    async setParentDate(setParentInfo) {
        await this.MindAPI.setParentDate(setParentInfo);
    }
}

TreeController.$inject = ['$scope', '$state', 'MindAPI', 'UserDBAPI'];

export default TreeController;