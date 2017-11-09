/**
 * node外形相关
 */
class NodeShapeRelative {
    constructor() {
        //node默认大小
        this.nodeDefaultWidth = 70;
        this.nodeDefaultHeight = 38;
        this.littleNodeDefaultHeight = 26; //第三层之后的节点高度
        this.nodeXInterval = 40; //节点间间隔
        this.nodeYInterval = 16;
    }

    getNodeDefaultWidth() {
        return this.nodeDefaultWidth;
    }

    getNodeDefaultHeight() {
        return this.nodeDefaultHeight;
    }

    getLittleNodeDefaultHeight() {
        return this.littleNodeDefaultHeight
    }

    getNodeXInterval() {
        return this.nodeXInterval;
    }

    getNodeYInterval() {
        return this.nodeYInterval;
    }

    getSingleNodeHeight(node) {
        if (node.shape) {
            return node.shape[1].attr('height');
        } else {
            if (node.isFirstLevelNode()) {
                return this.nodeDefaultHeight;
            } else {
                return this.littleNodeDefaultHeight;
            }
        }
    }

    getSingleNodeWidth(node) {
        if (node.shape) {
            return node.shape[1].attr('width');
        } else {
            return this.nodeDefaultWidth;
        }
    }

    /**
     * 得到整个节点区域的高
     * @param {*} node 
     */
    getNodeAreaHeight(node) {
        let height = 0;
        if (node.childrenCount() > 0) {
            for (let i in node.children) {
                height += this.getNodeAreaHeight(node.children[i]);
            }
        } else {
            height = this.getSingleNodeHeight(node) + this.nodeYInterval * 2;
        }
        return height;
    }

}

export default NodeShapeRelative;