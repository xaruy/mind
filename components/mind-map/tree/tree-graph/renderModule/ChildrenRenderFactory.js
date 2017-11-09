import NodeShapeRelative from './NodeShapeRelative'
import DataHelper from './DataHelper'

/**
 * 子节点重绘策略工厂
 */
class ChildrenRenderFactory {
    constructor() {}
    static createRenderStrategy(node) {
        let strategy;
        if (node.isRootNode()) {
            strategy = new ChildrenRenderStrategy(new FirstRender());
        } else if (node.isFirstLevelNode()) {
            strategy = new ChildrenRenderStrategy(new FirstLevelRender());
        } else {
            strategy = new ChildrenRenderStrategy(new SecondAndMoreRender());
        }
        return strategy;
    }
}

/**
 * 子节点重绘策略类
 */
class ChildrenRenderStrategy {
    constructor(strategy) {
        this.strategy = strategy;
    }
    reRenderChildrenNode(node) {
        this.strategy.doRender(node);
    }
}

/**
 * 抽象子结点重绘类
 */
class AbstractRender {
    constructor() {
        this.nodeXInterval = 60;
        this.nodeShapeRelative = new NodeShapeRelative();
    }
    commonRender(father, children, direction) {
        //获取父节点中间坐标
        let hfx = father.x + this.nodeShapeRelative.getSingleNodeWidth(father) / 2;
        let hfy = father.y + this.nodeShapeRelative.getSingleNodeHeight(father) / 2;


        let childrenAreaHeight = 0, //结点的所有子结点所占区域的高度
            startY, //子节点区域的起始高度
            childX, //子节点x坐标
            childY, //子节点的y坐标
            orderChildren = [], //子节点排序
            self = this;

        DataHelper.forEach(father.childrenOrder, orderId => {
            orderChildren.push(children[orderId]);
        })
        childX = hfx + direction * (this.nodeXInterval + this.nodeShapeRelative.getSingleNodeWidth(father) / 2);

        DataHelper.forEach(orderChildren, child => {
            //通过结点的areHeight属性保存结点高度
            child.areaHeight = self.nodeShapeRelative.getNodeAreaHeight(child);
            childrenAreaHeight += child.areaHeight;
        });

        startY = hfy - childrenAreaHeight / 2;

        DataHelper.forEach(orderChildren, child => {
            childY = startY + child.areaHeight / 2 - self.nodeShapeRelative.getSingleNodeHeight(child) / 2;

            startY += child.areaHeight;

            self._reRenderNode(child, childX, childY, direction);
        })
    }

    _reRenderNode(node, x, y, direction) {
        //如果节点仍未渲染,则渲染之
        if (!node.shape) {
            node.x = x;
            node.y = y;
            node.gRenderer.drawNode(node);
            //左边节点需左移一个节点宽度
            
            if (direction === -1) {
                node.translate(-this.nodeShapeRelative.getSingleNodeWidth(node), 0);
            }
        } else {
            let dy = y - node.y;
            node.translate(0, dy);
            node.shape[0].attr({
                'text': node.title,
            })
            node.shape.nodeShape(node);
        }
    }

    doRender() {

    }
}

/**
 * 第一层结点渲染类
 */
class FirstRender extends AbstractRender {
    constructor() {
        super();
        this.littleNodeYInterval = 100;
    }
    doRender(node) {
        let children = this.getDirectionChildren(node);
        if (children.leftCount > 2) {
            this.commonRender(node, children.leftChildren, -1);
        } else {
            this.renderLessThanTwo(node, children.leftChildren, -1);
        }

        if (children.rightCount > 2) {
            this.commonRender(node, children.rightChildren, 1);
        } else {
            this.renderLessThanTwo(node, children.rightChildren, 1);
        }
    }

    /**
     * 当节点少于或等于两个时的渲染方法
     * @param {*} father 
     * @param {*} leftChildren 
     * @param {*} direction 
     */
    renderLessThanTwo(father, leftChildren, direction) {
        let self = this;
        //1表示第一个节点，-1表示第二个节点
        let countFlag = 1;
        DataHelper.forEach(leftChildren, function (child) {


            var hfx = father.x + self.nodeShapeRelative.getSingleNodeWidth(father) / 2;
            var hfy = father.y + self.nodeShapeRelative.getSingleNodeHeight(father) / 2;



            var childX = hfx + direction * (self.nodeXInterval + self.nodeShapeRelative.getSingleNodeWidth(father) / 2);
            var childY = hfy - direction * countFlag * self.littleNodeYInterval;

            //@workaround:如果为1，4象限的节点
            if ((direction == 1 && countFlag == 1) || (direction == -1 && countFlag == -1)) {
                childY -= self.nodeShapeRelative.getSingleNodeHeight(child);
            }

            self._reRenderNode(child, childX, childY, direction);

            countFlag = -countFlag;
        })
    }

    /**
     * 根据子结点的direction取得左右子结点集合
     * @param {*} node 
     */
    getDirectionChildren(node) {
        let leftChildren = {},
            rightChildren = {},
            leftCount = 0,
            rightCount = 0;
        DataHelper.forEach(node.children, (child) => {
            if (child.direction == -1) {
                leftChildren[child.id] = child;
                leftCount++;
            } else {
                rightChildren[child.id] = child;
                rightCount++;
            }
        });

        return {
            leftChildren: leftChildren,
            rightChildren: rightChildren,
            leftCount: leftCount,
            rightCount: rightCount,
        };
    }
}

/**
 * 第一层子结点渲染类
 */
class FirstLevelRender extends AbstractRender {
    constructor() {
        super();
    }

    doRender(node) {
        this.commonRender(node, node.children, node.direction);
    }
}

/**
 * 第n(n>=2)层子节点渲染类
 */
class SecondAndMoreRender extends AbstractRender {
    constructor() {
        super();
        this.nodeXInterval = 14;
    }

    doRender(node) {
        this.commonRender(node, node.children, node.direction);
    }
}

export default ChildrenRenderFactory;