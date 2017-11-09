import DataHelper from './renderModule/DataHelper'
class Graph {
    constructor(gRenderer, ctr) {
        this.gRenderer = gRenderer;
        this.nodeCount = 0;
        this.edgeCount = 0;

        this.ctrl = ctr;

        this.nodes = {};
        this.edges = {};

        this.selected = null;

        this.root = null;

        //绑定标题输入框失去焦点事件
        this.gRenderer.setTitleInputBoxBlur(this);

        //绑定画布单击事件
        this.gRenderer.setCanvasClick(this);

        //绑定标题输入框键盘事件
        this.gRenderer.setTitleInputBoxKeyEvent(this);

        //绑定标题输入框内容改变事件
        this.gRenderer.setTitleInputBoxInput(this);

    }

    /**
     * 数据载入
     * @param {*} tree 
     */
    load(tree) {
        if (tree) {
            this.root = this._initRoot(tree);
            if (tree.children) {
                this._initChildren(this.root, tree.children);
            }
        }
    }

    /**
     * 添加子节点或兄弟节点
     * @param {*} parent 父节点
     * @param {*} attr 新节点属性集合
     * @param {*} brother 有此参数时添加为此节点的兄弟节点
     */
    addNode(parent, attr, brother) {
        let node = new Node(this, attr);
        this.nodes[node.id] = node;
        this.setParentData(parent, node, brother);

        this.gRenderer.addNodeRender(node);
        this.setSelected(node);
        return node;
    }

    /**
     * 修改节点标题
     * @param {*} node 
     * @param {*} newTitle 
     */
    modifyNodeTitle(node, newTitle) {
        this.ctrl.setNodeTitle(node, newTitle).then(() => {
            node.title = newTitle;
            this.gRenderer.modifyTitleRender(node);
        });
    }

    /**
     * 删除节点
     * 先断开父节点的children和connectChildren连接，再渲染删除，然后删除递归数据
     * @param {*} node 
     */
    removeNode(node) {
        this._removeParentConnect(node);
        this.gRenderer.removeNodeRender(node);

        this._removeNodeData(node);
    }

    setParentData(parent, child, brother, insertPosition) {

        if (child === parent || parent === null) {
            return null;
        }
        if (child.father === parent && !brother) {
            return child.connentFather;
        }
        this._removeParentConnect(child);

        //设置child的root
        child.root = parent.root || parent;
        //设置child的father
        child.father = parent;
        //设置新父节点的children;
        child.father.children[child.id] = child;

        //设置子节点的顺序
        if (brother) {

            let broIndex = child.father.childrenOrder.indexOf(brother.id);
            //如果是添加同级节点并且insertPosition=-11，放在兄弟节点上方
            if (insertPosition === -1) {
                child.father.childrenOrder.splice(broIndex, 0, child.id);
            }
            //如果是添加同级节点并且insertPosition=1，放在兄弟节点下方
            if (!insertPosition || insertPosition === 1) {
                child.father.childrenOrder.splice(broIndex + 1, 0, child.id);
            }

        } else {
            child.father.childrenOrder.push(child.id);
        }


        //设置child的connectFather,并创建新边
        child.connectFather = this.addEdge(parent, child);
        //设置新父节点的connectChildren
        child.father.connectChildren[child.connectFather.id] = child.connectFather;

        this._setNodeDirection(child);
    }

    addEdge(source, target, attr) {
        let edge = new Edge(this, source, target, attr);
        this.edges[edge.id] = edge;
        return edge;
    }

    setSelected(node) {
        if (this.selected === node) {
            return
        }
        let oldSelected = this.selected;
        this.selected = node;
        this.gRenderer.setSelectedRender(this.selected, oldSelected);
    }

    /**
     * 获得当前节点可成为父节点候选的节点集
     * @param {*} node 
     */
    getParentAddableNodeSet(node) {
        let self = this;
        let addableNodeSet = {};
        DataHelper.forEach(self.nodes, curNode => {
            addableNodeSet[curNode.id] = curNode;
        });
        let notAddableNodeSet = self.getChildrenNodeSet(node);
        notAddableNodeSet[node.id] = node;
        if (node.father) {
            notAddableNodeSet[node.father.id] = node.father;
        }

        //在this.nodes副本中除去当前节点及该节点的所有子节点的引用
        DataHelper.forEach(notAddableNodeSet, function (curNode) {
            delete addableNodeSet[curNode.id];
        });
        return addableNodeSet;
    }

    getChildrenNodeSet(node) {
        let self = this;
        let childrenNodeSet = {};
        self._makeChildrenNodeSet(node.children, childrenNodeSet);
        return childrenNodeSet;
    }
    _makeChildrenNodeSet(children, childrenNodeSet) {
        let self = this;
        DataHelper.forEach(children, child => {
            childrenNodeSet[child.id] = child;
            self._makeChildrenNodeSet(child.children, childrenNodeSet);
        })
    }

    setParent(parentId, childId, brotherId, insertPosition) {
        let self = this;
        let parent = self.nodes[parentId];
        let child = self.nodes[childId];
        let brother = self.nodes[brotherId];
        if (child === parent || parent === null) {
            return null;
        }
        let setParentInfo = {
            rootId: child.root.id,
            parentId,
            childId,
            brotherId,
            insertPosition,
        };

        //数据保存进数据库
        this.ctrl.setParentDate(setParentInfo).then(() => {
            if (child.father === parent && !brother) {
                return;
            } else {
                //需要设置新父节点的children，才能正确删除重绘子节点时
                delete child.father.children[child.id];

                //删除子任务顺序列表中的id
                let index = child.father.childrenOrder.indexOf(child.id);
                if (index !== -1) {
                    child.father.childrenOrder.splice(index, 1);
                }

                //在child.connectFather改变之前，递归删除子节点
                self.gRenderer.removeNodeRender(child);
            }
            self.setParentData(parent, child, brother, insertPosition);
            self._resetChildrenProperty(child.children);

            //在新的father上递归添加原节点（递归添加）的渲染
            self.gRenderer.setParentRender(child);
        }, err => {
            console.error(err);
        });
    }

    _resetChildrenProperty(children) {
        let self = this;
        DataHelper.forEach(children, function (child) {
            child.connectFather = self.addEdge(child.father, child);

            self._setNodeDirection(child);
            self._resetChildrenProperty(child.children);
        });
    }

    /**
     * 初始化根节点
     * @param {*} node 
     */
    _initRoot(node) {
        let root = null;
        root = this.addNode(null, {
            x: this.gRenderer.getCanvasWidth() / 4,
            y: this.gRenderer.getCanvasHeight() / 2 - 50,
            id: node.id,
            title: node.title || '中心主题',
        });
        this.gRenderer.rootNodeRender(root);
        return root;
    }

    /**
     * 初始化树中子节点
     * @param {Node} father 
     * @param {*} treeNodes 
     */
    _initChildren(father, treeNodes) {
        if (treeNodes instanceof Array && treeNodes.length) {
            treeNodes.forEach(treeNode => {
                let node = this.addNode(father, {
                    id: treeNode.id,
                    title: treeNode.title || '新节点',
                })
                if (treeNode.children) {
                    this._initChildren(node, treeNode.children)
                }
            })
        }
    }

    _removeParentConnect(node) {
        //若child存在旧父节点,则删除旧父节点child上该节点的引用
        if (node.father) {
            delete node.father.children[node.id];
            //删除旧父节点子节点顺序中的该child
            let index = node.father.childrenOrder.indexOf(node.id);
            if (index !== -1) {
                node.father.childrenOrder.splice(index, 1);
            }
        }
        //若child存在旧父节点,则删除旧父节点connectChildren上与child的边的引用
        if (node.connectFather) {
            //删除父节点与子节点连线的引用
            delete node.father.connectChildren[node.connectFather.id];
        }
    }

    /**
     * 递归删除节点的数据
     * @param {*} node 
     */
    _removeNodeData(node) {
        let self = this;
        //删除父节点相关:删除父节点与该节点的边界,从父节点的children上删除该节点,最后删除父节点引用
        //数组中的属性设为undefined,其他引用设为null
        self._removeParentConnect(node);
        node.father = null;
        node.connectFather = null;

        DataHelper.forEach(node.children, function (child) {
            self._removeNodeData(child);
        });

        //删除nodes和edges集合中该对象的引用
        delete self.nodes[node.id];
        if (node.connectFather) {
            delete self.edges[node.connectFather.id];
        }
    }

    /**
     * 设置节点的direction属性
     * -1表示左边,1表示右边,null表示未设置
     * @param {*} node 
     * @param {*} tag 为1时全部在右边,为2时左右交替
     */
    _setNodeDirection(node, tag = 1) {
        if (tag === 1) {
            node.direction = 1;
        } else if (tag === 2) {
            //如果为第一层节点,则根据左右节点数赋值位置值
            if (node.isFirstLevelNode()) {
                if (this._isFirstNodeRightMoreThanLeft()) {
                    node.direction = -1;
                } else {
                    node.direction = 1;
                }
            }
            //如果为第n层(n>=2)节点,则按照父节点的direction设置
            else if (!node.isFirstLevelNode() && !node.isRootNode()) {
                node.direction = node.father.direction;
            }
        }
    }
}

/**
 * 节点对象
 */
class Node {
    constructor(g, attr) {
        if (!attr) {
            attr = {}
        };
        this.graph = g;
        this.gRenderer = g.gRenderer;
        if (attr.hasOwnProperty('id')) {
            this.id = attr.id;
        } else {
            //TODO 节点id需要重构
            this.id = new Date().getTime();
            this.graph.nodeCount++;
        }
        if (attr.hasOwnProperty('x') && attr.hasOwnProperty('y')) {
            this.x = attr.x;
            this.y = attr.y;
        } else {
            this.x = null;
            this.y = null;
        }

        this.title = attr.title || '新节点';

        //节点的直接子节点引用集合
        this.children = {};
        this.childrenOrder = [];
        //节点的根节点引用
        this.root = null
        //节点的父节点引用
        this.father = null;

        //与父节点的边的引用
        this.connectFather = null;
        //与子节点的边的引用集合
        this.connectChildren = {};

        //节点的图形,其类型为Raphael的element或set对象
        this.shape = null;
    }

    getRootNode() {
        if (this === this.graph.root) {
            return this
        }
        if (!this.father) {
            return this;
        } else {
            let fatherNode = this.father;
            while (fatherNode.father) {
                fatherNode = fatherNode.father;
            }
            return fatherNode;
        }
    }

    isRootNode() {
        return this === this.getRootNode();
    }

    isFirstLevelNode() {
        return this.father && this.father === this.getRootNode();
    }

    isSecondMoreNode() {
        return !this.isRootNode() && !this.isFirstLevelNode();
    }

    childrenCount() {
        return DataHelper.count(this.children);
    }
    childrenWithShapeCount() {
        let self = this;
        let count = 0;
        DataHelper.forEach(self.children, child => {
            if (child.shape) {
                count++;
            }
        });
        return count;
    }

    translate(dx, dy) {
        let self = this;
        self.x += dx;
        self.y += dy;

        //节点移动渲染
        this.gRenderer.translateSingleNodeRender(self, dx, dy);

        DataHelper.forEach(self.children, child => {
            child.translate(dx, dy);
        });
    }
}

/**
 * 链接线对象
 */
class Edge {
    constructor(g, source, target, attr) {
        if (!attr) attr = {};
        this.graph = g;
        //TODO需要重构id
        this.id = new Date().getTime();
        this.graph.edgeCount++;

        this.source = source;
        this.target = target;

        this.shape = null
    }
}

export default Graph;