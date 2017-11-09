import DataHelper from './DataHelper'
import Raphael from 'raphael'
class Drag {
    constructor(aNode, options) {
        this.node = aNode;
        this.toolbar = options.toolbar;
        this.titleInputBox = options.titleInputBox;
        this.viewportHandle = options.viewportHandle;
        this.paper = this.node.shape[0].paper;
        this.graph = this.node.graph;

        this.enableRender = options.enableRender;

        //克隆的占位节点
        this.cloneShape = null;
        //当前节点可添加的父节点BBox的集合
        this.addableBoxSet = null;
        //最后一个重合的节点id
        this.lastOverlapId = null;
        //当前重合的节点id
        this.overlapNodeId = null;
        //绘制兄弟节点临时标示
        this.temRect = null;
        //拖拽节点插入的位置
        this.insertPosition = null;
    }

    setDrag() {
        if (!this.node.isRootNode()) {
            this.node.shape.drag(this.moveFnc.bind(this), this.startFnc.bind(this), this.endFnc.bind(this));
        } else {
            this.node.shape.mousedown(event => {
                if (!this.enableRender.canRender) {
                    return false;
                }
                this.viewportHandle.mousedownHandle(event);

                this.node.graph.setSelected(this.node);
                //this.toolbar.setActive(this.node);
            });

            this.node.shape.mousemove((event) => {
                if (!this.enableRender.canRender) {
                    return false;
                }
                this.viewportHandle.mousemoveHandle(event);

                if (this.viewportHandle.isDragging()) {}

            });

            this.node.shape.mouseup((event) => {
                if (!this.enableRender.canRender) {
                    return false;
                }
                this.viewportHandle.mouseupHandle(event);
                //设置输入框的位置并获取焦点
                this.titleInputBox.setPosition(this.node, this.viewportHandle.viewBox);
            });
        }
    }

    startFnc() {
        //如果不可渲染，则不可调用start
        if (!this.enableRender.canRender) {
            return false;
        }

        //设置节点的选择渲染
        // _selectedHandle();
        this.node.graph.setSelected(this.node);
        //this.toolbar.setActive(this.node);

        //获得当前节点可添加的父节点BBox的集合
        this.addableBoxSet = this._getAddableBBoxSet();
        this.lastOverlapId = null;

        //让inputBox失去焦点
        this.viewportHandle.setFocus();

    }

    moveFnc(dx, dy) {
        if (!this.enableRender.canRender) {
            return false;
        }

        if (!this.cloneShape) {
            //创一个克隆的节点占位
            this.cloneShape = this._cloneNodeShape(this.node);
        }

        //将节点设为未选择样式的透明样式
        this.node.shape.dragNodeOpacityShape(this.node);
        this.cloneShape.opacityShape();
        //改为当前节点，及其子节点和边透明
        this._setChildrenOpacity(this.node.children);

        this.node.shape[1].node.style.cursor = 'move';
        this.node.shape.transform('t' + dx + ',' + dy);
        this.overlapNodeId = this._getOverlapNodeId();

        if (this.overlapNodeId !== this.lastOverlapId) {
            //如果是根节点只能拖拽为子节点
            if (this.overlapNodeId && this.graph.nodes[this.overlapNodeId].isRootNode()) {
                this.graph.nodes[this.overlapNodeId].shape.overlapShape();
                this.insertPosition = 0
            } else {
                if (this.temRect) {
                    this.temRect.remove();
                    this.temRect = null;
                }
            }
            if (this.lastOverlapId) {
                this.graph.nodes[this.lastOverlapId].shape.unOverlapShape(this.graph.nodes[this.lastOverlapId]);
            }
        } else {
            if (this.overlapNodeId && !this.graph.nodes[this.overlapNodeId].isRootNode()) {
                let overNode = this.graph.nodes[this.overlapNodeId];

                if (this.temRect) {
                    this.temRect.remove();
                    this.temRect = null;
                }

                //在节点上半部分显示临时插入标示
                if (!this.temRect && this.node.y + dy - overNode.y < -10) {
                    this.temRect = this._drawRect(overNode.x, overNode.y - 8);
                    this.insertPosition = -1;
                    this.graph.nodes[this.lastOverlapId].shape.unOverlapShape(this.graph.nodes[this.lastOverlapId]);
                }
                //在节点下半部分显示临时插入标示
                else if (!this.temRect && this.node.y + dy - overNode.y > 10) {
                    this.temRect = this._drawRect(overNode.x, overNode.y + overNode.shape.getBBox().height + 6);
                    this.insertPosition = 1;
                    this.graph.nodes[this.lastOverlapId].shape.unOverlapShape(this.graph.nodes[this.lastOverlapId]);
                } else {
                    this.graph.nodes[this.overlapNodeId].shape.overlapShape();
                    this.insertPosition = 0
                }
            }
        }
        this.lastOverlapId = this.overlapNodeId;
    }

    endFnc() {
        //如果不可渲染，则不可调用end
        if (!this.enableRender.canRender) {
            return false;
        }

        if (this.cloneShape) {
            this.cloneShape.remove();
        }

        if (this.temRect) {
            this.temRect.remove();
            this.temRect = null;
        }

        this.cloneShape = null;

        this._setChildrenNormal(this.node.children);

        if (this.lastOverlapId) {
            let lastOverlapNode = this.graph.nodes[this.lastOverlapId];
            lastOverlapNode.shape.nodeShape(lastOverlapNode);
        }

        this.overlapNodeId = this._getOverlapNodeId();

        //节点改变父节点后的操作
        if (this.overlapNodeId) {
            let overlapNode = this.graph.nodes[this.overlapNodeId];
            let overlapFather = overlapNode.father;
            //添加为子节点
            if (this.insertPosition === 0) {
                this.graph.setParent(this.overlapNodeId, this.node.id);
            }
            //添加为兄节点
            if (this.insertPosition === -1 && overlapFather) {
                this.graph.setParent(overlapFather.id, this.node.id, this.overlapNodeId, -1);
            }
            //添加为弟节点
            if (this.insertPosition === 1 && overlapFather) {
                this.graph.setParent(overlapFather.id, this.node.id, this.overlapNodeId, 1);
            }

        }

        this.node.shape.transform('t' + 0 + ',' + 0);

        this.node.shape[1].node.style.cursor = 'default';
        //将节点设为被选择样式
        this.node.shape.selectedShape(this.node);

        //设置输入框的位置并获取焦点
        this.titleInputBox.setPosition(this.node, this.viewportHandle.viewBox);
    }

    /**
     * 取得克隆的shape：用于占位
     * @param {*} node 
     */
    _cloneNodeShape(node) {
        let newRect = node.shape[1].clone();
        newRect.attr({
            r: 4,
        });
        let newTitle = node.shape[0].clone();
        let newShape = this.paper.set().push(newTitle).push(newRect);
        return newShape;
    }

    /**
     * 将子节点及边设为透明
     * @param {*} children 
     */
    _setChildrenOpacity(children) {
        DataHelper.forEach(children, (child) => {
            child.shape.opacityShape(child);
            child.connectFather.shape.opacityShape();
            this._setChildrenOpacity(child.children);
        });
    }

    /**
     * 将透明子节点及边设为原样
     * @param {*} children 
     */
    _setChildrenNormal(children) {
        DataHelper.forEach(children, (child) => {
            child.shape.unOpacityShape();
            child.connectFather.shape.unOpacityShape();
            this._setChildrenNormal(child.children);
        });
    }

    /**
     * 获得可成为当前节点的父节点的Box集合
     */
    _getAddableBBoxSet() {
        let addableBBoxSet = {};
        let addableSet = this.graph.getParentAddableNodeSet(this.node);

        DataHelper.forEach(addableSet, (curNode) => {
            addableBBoxSet[curNode.id] = curNode.shape.getBBox();
        });
        return addableBBoxSet;
    }

    /**
     * 获得与当前节点重合的节点的id
     */
    _getOverlapNodeId() {
        let nodeBBox = this.node.shape.getBBox();
        for (let id in this.addableBoxSet) {
            let curBBox = this.addableBoxSet[id];
            if (Raphael.isBBoxIntersect(nodeBBox, curBBox)) {
                return id;
            }
        }
        return null;
    }

    _drawRect(x, y) {
        let paper = this.paper;
        let rect = paper.rect(x, y, 50, 2, 4);
        rect.attr({
            stroke: 'red',
            'stroke-width': '3'
        });
        return rect;
    }
}

export default Drag;