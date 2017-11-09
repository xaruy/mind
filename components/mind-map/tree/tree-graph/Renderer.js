import Raphael from 'raphael'

import Viewport from './renderModule/Viewport'
import ShapeCustomAttr from './renderModule/ShapeCustomAttr'
import NodeShapeRelative from './renderModule/NodeShapeRelative'
import ChildrenRenderFactory from './renderModule/ChildrenRenderFactory'
import Drag from './renderModule/Drag'
import EdgeDraw from './renderModule/EdgeDraw'
import KeyboardEvent from './renderModule/KeyboardEvent'
import TitleInputBox from './renderModule/TitleInputBox'

import DataHelper from './renderModule/DataHelper'

class Renderer {
    constructor(options) {
        this.type = options.type;
        this.canvasDom = options.dom;
        this.titleInput = options.input;
        let canvasWidth = this.canvasDom.clientWidth;
        let canvasHeight = this.canvasDom.clientHeight;
        this.paper = Raphael(this.canvasDom, canvasWidth, canvasHeight - 3);

        this.titleInputBox = new TitleInputBox(this.titleInput, this.canvasDom.offsetTop);

        this.viewportHandle = new Viewport(this.canvasDom, this.paper);
        this.viewportHandle.setViewportDrag();

        this.keyboardHandle = new KeyboardEvent({
            titleInputBox: this.titleInputBox,
            viewportHandle: this.viewportHandle,
        });

        this.nodeShapeRelative = new NodeShapeRelative();

        this.enableRender = {
            canRender: true,
        }

        this.shapeCustomAttr = new ShapeCustomAttr(this.paper);
    }

    /**
     * 设置是否能够渲染
     * @param {*} canRender 
     */
    EnableRender(canRender) {
        this.enableRender.canRender = canRender;
        this.canvasDom.style.opacity = canRender ? 1 : 0.5
    }

    /**
     * 点击画布空白区域，取消选中节点
     * @param {*} graph 
     */
    setCanvasClick(graph) {
        this.canvasDom.addEventListener('mousedown', (event) => {
            if (event.target.nodeName === 'svg') {
                graph.setSelected(null);
            }
            //this.titleInputBox.setUnactive();
        })
    }

    /**
     * 设置标题输入框键盘事件
     * @param {*} graph 
     */
    setTitleInputBoxKeyEvent(graph) {
        this.titleInput.addEventListener('keypress', (event) => {
            event.stopPropagation();
            event.preventDefault();
            if (event.keyCode === 13) {
                this.titleInputBox.showInput && this.setSelectedRender(graph.selected);
            } else {
                this.titleInputBox.setInputText(event.key);
                this.titleInputBox.setActive();
            }
        });

        this.titleInput.addEventListener('keydown', (event) => {
            if (!this.titleInputBox.showInput) {
                this.keyboardHandle.setKeyDown(graph, event);
            }
        });
    }

    /**
     * 设置输入框失去焦点事件
     * @param {*} graph 
     */
    setTitleInputBoxBlur(graph) {
        this.titleInput.addEventListener('blur', (event) => {
            let node = this.titleInputBox.modifyNode;
            let title = event.srcElement.innerText;
            if (title && node.title !== title && title !== '') {
                graph.modifyNodeTitle(node, title);
            }
            this.titleInputBox.setUnactive();
        })
    }

    /**
     * 设置输入框改变内容事件
     */
    setTitleInputBoxInput() {
        this.titleInput.addEventListener('input', () => {
            this.titleInputBox.setActive();
        })
    }

    /**
     * 选择节点时的渲染
     * @param {*} node 被选中的节点
     * @param {*} oldSelected 之前被选中的节点
     */
    setSelectedRender(node, oldSelected) {
        if (node && node.shape) {
            node.shape.selectedShape(node);
            this.viewportHandle.setFocus();
            this.titleInputBox.setPosition(node, this.viewportHandle.viewBox);
        }
        if (oldSelected && oldSelected.shape) {
            oldSelected.shape.unSelectedShape(oldSelected);
        }
    }
    /**
     * 根结点渲染
     * @param {*} rootNode 
     */
    rootNodeRender(rootNode) {
        let self = this;
        let oldWidth = this.nodeShapeRelative.getSingleNodeWidth(rootNode);

        rootNode.shape.nodeShape(rootNode, self.type);
        let newWidth = this.nodeShapeRelative.getSingleNodeWidth(rootNode);
        let gap = newWidth - oldWidth;

        rootNode.translate(-gap / 2, 0);
        DataHelper.forEach(rootNode.children, child => {
            if (child.direction === 1) {
                child.translate(gap, 0);
            }
        });
    }

    /**
     * 新增节点渲染
     * @param {* Object} node 
     */
    addNodeRender(node) {
        //节点渲染
        if (node.x && node.y) {
            this.drawNode(node);
        } else {
            this._reRenderChildrenNode(node.father);
            //向上递归移动父节点的同级节点,只有一个点时不用移动
            if (node.father && node.father.childrenCount() > 1) {
                this._resetBrotherPosition(node.father, this.nodeShapeRelative.getNodeAreaHeight(node));
            }
        }

        //连线渲染
        if (node.connectFather) {
            this._drawEdge(node.connectFather);
        }

        this._setDrag(node);

        this._setDblclick(node);

    }

    /**
     * 节点文本设置渲染
     * @param node
     */
    modifyTitleRender(node) {

        //取得原来的长度
        let oldWidth = this.nodeShapeRelative.getSingleNodeWidth(node);

        //设置文本的shape
        node.shape.nodeShape(node);

        if (node.graph.selected) {
            node.graph.selected.shape.selectedShape(node);
        }

        let newWidth = this.nodeShapeRelative.getSingleNodeWidth(node);
        let gap = newWidth - oldWidth;

        //如果改变label的节点为右方向节点,则只向右移动该节点的子节点
        if (node.direction === 1) {
            DataHelper.forEach(node.children, function (child) {
                child.translate(gap, 0);
            });

            //右节点的边需要重画
            if (node.shape && node.connectFather) {
                this._drawEdge(node.connectFather);
            }
        }
        //如果改变label的节点为左方向节点,则向左移动该节点(translate回递归)和toolbar
        else if (node.direction === -1) {
            node.translate(-gap, 0);

        }
        //如果节点为根结点
        else if (node.isRootNode()) {
            node.translate(-gap / 2, 0);
            DataHelper.forEach(node.children, function (child) {

                if (child.direction === 1) {

                    child.translate(gap, 0);
                } else if (child.direction === -1) {
                    child.translate(-gap / 2, 0);
                }
            });
        }

    }

    /**
     * 在画布中描绘node
     * @param {*} node 
     */
    drawNode(node) {

        let paper = this.paper;
        let title = paper.text(node.x, node.y, node.title);

        let rect = paper.rect(node.x, node.y,
            this.nodeShapeRelative.getNodeDefaultWidth(),
            this.nodeShapeRelative.getNodeDefaultHeight(), 4)
            .data('id', node.id);


        title.toFront();

        node.shape = paper.set().push(title).push(rect);
        node.shape.nodeShape(node);
    }

    /**
     * 移动节点的渲染: 节点移动渲染(通过设置attr的x和y属性),边重绘
     * @param {*} node 
     * @param {*} dx 
     * @param {*} dy 
     */
    translateSingleNodeRender(node, dx, dy) {
        if (node.shape) {
            let rect = node.shape[1],
                posX = rect.attr('x'),
                posY = rect.attr('y');
            rect.attr({
                x: posX + dx,
                y: posY + dy,
            });
            let title = node.shape[0],
                titleX = title.attr('x'),
                titleY = title.attr('y');
            title.attr({
                x: titleX + dx,
                y: titleY + dy,
            });

            //移动节点后,边重画
            if (node.shape && node.connectFather) {
                this._drawEdge(node.connectFather);
            }

        }
    }

    /**
     * 删除节点渲染
     * 需要先断开父节点的children和connectChildren连接才能重新调整当前节点层的节点
     * @param {*} node 
     */
    removeNodeRender(node) {
        this._reRenderChildrenNode(node.father);
        if (node.father) {
            if (node.father.childrenCount() > 0 || node.childrenCount() > 1) {
                this._resetBrotherPosition(node.father, -this.nodeShapeRelative.getNodeAreaHeight(node));
            }
        }
        this.removeNodeAndChildrenShape(node);
        // this.toolbar.setAllUnactive();
    }
    /**
     * 递归删除节点的shape
     * @param {*} node 
     */
    removeNodeAndChildrenShape(node) {
        let self = this;
        //删除节点和边的shape
        if (node.shape) {
            node.shape.remove();
            node.shape = null;
        }
        if (node.connectFather.shape) {
            node.connectFather.shape.remove();
            node.connectFather = null;
        }
        DataHelper.forEach(node.children, function (child) {
            self.removeNodeAndChildrenShape(child);
        });
    }

    /**
     * 在新的father上递归添加原节点（递归添加）的渲染
     * @param {*} node 
     */
    setParentRender(node) {
        console.log('setParentRender-->', node)
        let self = this;
        let childrenWithShapeCount1 = node.father.childrenWithShapeCount();

        self._reRenderChildrenNode(node.father);
        let childrenWithShapeCount2 = node.father.childrenWithShapeCount();

        //向上递归移动父节点的同级节点,只有一个点时不用移动
        if (node.father && node.father.childrenCount() > 1) {
            if (childrenWithShapeCount2 - childrenWithShapeCount1 <= 1) {
                self._resetBrotherPosition(node.father, self.nodeShapeRelative.getNodeAreaHeight(node));
            }
        }

        if (node.connectFather) {
            self._drawEdge(node.connectFather);
        }
        //设置拖动
        this._setDrag(node);

        this._setDblclick(node);

        DataHelper.forEach(node.children, function (child) {
            self.setParentRender(child);
        });
    }

    getCanvasWidth() {
        return this.canvasDom.clientWidth;
    }

    getCanvasHeight() {
        return this.canvasDom.clientHeight;
    }

    /**
     * 重新设置当前节点的子节点的位置
     * @param {*} node 当前节点 
     */
    _reRenderChildrenNode(node) {
        let childrenRenderStrategy = ChildrenRenderFactory.createRenderStrategy(node);
        childrenRenderStrategy.reRenderChildrenNode(node);
    }

    /**
     * 调整当前节点的兄弟节点的位置
     * @param {*} node 当前节点
     * @param {*} nodeAreaHeight 需要调整的高度(一般为最初改变的节点的高度的一半)
     */
    _resetBrotherPosition(node, nodeAreaHeight) {
        let brother, //同级节点
            brotherY, //兄弟节点的高中心
            curY = node.y, //当前节点的高
            moveY = nodeAreaHeight / 2; //需要移动的高度

        //移动兄弟节点
        if (node.father) {
            DataHelper.forEach(node.father.children, function (brother) {
                //当同级结点与当前结点direction相同时才上下移动
                if (brother.direction === node.direction) {
                    if (brother !== node) {
                        brotherY = brother.y;
                        //如果兄弟节点在当前节点的上面,则向上移动
                        if (brotherY < curY) {
                            brother.translate(0, -moveY);
                        }
                        //否则,向下移动
                        else {
                            brother.translate(0, moveY);
                        }
                    }
                }
            });
        }

        //递归父节点
        if (node.father) {
            this._resetBrotherPosition(node.father, nodeAreaHeight);
        }
    }

    /**
     * 创建edge的shape,如果已存在则删除原边重绘(重新设置edge的shape)
     * @param {*} edge 边对象
     */
    _drawEdge(edge) {
        let edgeDraw = new EdgeDraw(edge);
        edgeDraw.drawEdge();
    }

    _setDrag(node) {
        let dragHandle = new Drag(node, {
            toolbar: this.toolbar,
            titleInputBox: this.titleInputBox,
            viewportHandle: this.viewportHandle,
            enableRender: this.enableRender,
        });
        dragHandle.setDrag();
    }

    /**
     * 节点双击事件
     * @param {*} node 
     */
    _setDblclick(node) {
        node.shape.dblclick(() => {
            this.titleInputBox.dblclickActive(node, this.viewportHandle.viewBox)
        });
        node.shape[0].dblclick(() => {
            this.titleInputBox.dblclickActive(node, this.viewportHandle.viewBox)
        });
        node.shape[1].dblclick(() => {
            this.titleInputBox.dblclickActive(node, this.viewportHandle.viewBox)
        });
    }
}

export default Renderer;