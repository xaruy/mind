import LDB from '@leither/ldb';

class MindService {
    constructor(DB) {
        Object.assign(this, DB);
        this.ldb = LDB.getLDB(G);
    }

    /**
     * 通过rootid获取整棵树
     * @param {*} id 
     */
    async getTreeByRootId(id) {
        let tree = null;
        const key = this.MIND_KEY + id;
        let nodesInfo = await this.ldb.doOne(this.ldb.hgetall(key));
        if (nodesInfo && nodesInfo.length) {
            tree = this._assembleTree(nodesInfo, id);
        }
        return tree;
    }

    /**
     * 拼装成树结构
     * @param {*} nodesInfo 数据库中读取到的所有节点信息 
     * @param {string} rootid 根节点id
     */
    _assembleTree(nodesInfo, rootid) {
        let rootInfo = nodesInfo.find(nodeInfo => {
            return nodeInfo.field === rootid;
        });
        let tree = this._getNodeObj(rootInfo, nodesInfo);
        return tree;
    }

    /**
     * 递归获取所有节点对象
     * @param {*} nodeInfo 某个节点信息
     * @param {*} nodesInfo 数据库中读取到的所有节点信息 
     */
    _getNodeObj(nodeInfo, nodesInfo) {
        let node = null;
        if (nodeInfo) {
            node = JSON.parse(nodeInfo.value);
            if (node.childrenids && node.childrenids.length) {
                node.children = [];
                node.childrenids.forEach(childId => {
                    let childInfo = this._getNodeInfo(childId, nodesInfo);
                    node.children.push(this._getNodeObj(childInfo, nodesInfo));
                })
            }
        }
        return node;
    }

    /**
     * 通过id查找nodesInfo中的值
     * @param {*} id 节点id
     * @param {*} nodesInfo 数据库中读取到的所有节点信息 
     */
    _getNodeInfo(id, nodesInfo) {
        let nodeInfo = nodesInfo.find(info => {
            return info.field.indexOf(id) > -1;
        })
        return nodeInfo;
    }

    /**
     * 创建新节点
     * @param {Obj} nodeInfo {*title,*creator,*rootid,*fatherid,broid}
     */
    async createNode(nodeInfo) {
        const sysTime = await this._getSysTime();
        const createdTime = sysTime.getTime();
        let {
            title,
            creator,
            rootid,
            fatherid,
            broid,
        } = nodeInfo;
        const regString = creator + '#' + createdTime
        const id = await this._getNewNodeId(regString);
        let newNode = {
            id,
            title,
            createdTime,
            fatherid,
            rootid,
            creator,
        }

        console.log('nodeInfo===>', nodeInfo);

        if (!fatherid || !rootid) {
            return;
        }

        const key = this.MIND_KEY + rootid;
        let fatherNode = await this.getNodeByID(key, fatherid);
        const value = JSON.stringify(newNode);
        //保存新节点进数据库中
        await this.ldb.doOne(this.ldb.hset(key, id, value));

        //更新父节点的childrenids
        await this._addInFatherNode(fatherNode, id, broid);

        return newNode;
    }

    /**
     * 通过id获取node对象
     * @param {*} key 
     * @param {*} id 
     */
    async getNodeByID(key, id) {
        let node = null;
        if (id) {
            let nodeInfo = await this.ldb.doOne(this.ldb.hget(key, id));
            if (nodeInfo) {
                node = JSON.parse(nodeInfo);
            }
        }
        return node;
    }

    /**
     * 设置node
     * @param {*} key 
     * @param {*} id 
     * @param {*} node 
     */
    async setNode(key, id, node) {
        let nodeInfo = JSON.stringify(node);
        console.log('setNode===>', key, id, node);
        await this.ldb.doOne(this.ldb.hset(key, id, nodeInfo));
    }

    /**
     * 在H_ROOT_LIST表中，通过id获取根任务
     * @param {*} key 
     * @param {*} id 
     */
    async getRootByID(key, id) {
        let root = null;
        if (id) {
            let rootInfoArr = await this.ldb.doOne(this.ldb.hscan(key, '', id + '$', '', true));
            if (rootInfoArr && rootInfoArr.length) {
                let rootInfo = rootInfoArr[0];
                let field = rootInfo.field;
                let varArr = field.split('#');
                root = JSON.parse(rootInfo.value);
                root.score = varArr[0];
            }
        }
        return root;
    }

    /**
     * 拖拽后数据保存
     * @param {object} setParentInfo {*rootId,*parentId,*childId,brotherId,insertPosition}
     */
    async setParentDate(setParentInfo) {
        let {
            rootId,
            parentId,
            childId,
            brotherId,
            insertPosition,
        } = setParentInfo;
        if (!rootId) {
            return null;
        }
        let key = this.MIND_KEY + rootId;
        let parent = await this.getNodeByID(key, parentId);
        let child = await this.getNodeByID(key, childId);
        if (!parent || !child) {
            return null;
        }
        let oldParent = null;
        if (parentId === child.fatherid) {
            oldParent = parent;
        } else {

            oldParent = await this.getNodeByID(key, child.fatherid);
        }

        //删除旧父节点中对应的childId;
        if (oldParent.childrenids) {
            oldParent.childrenids = oldParent.childrenids.filter(id => {
                return id !== childId;
            })

            await this.setNode(key, child.fatherid, oldParent);
            console.log('setParentDate--->', parent, child, oldParent, insertPosition);
        }


        //修改子节点中的父id
        child.fatherid = parentId;
        await this.setNode(key, childId, child);

        //新父节点添加子节点id
        await this._addInFatherNode(parent, childId, brotherId, insertPosition);
    }

    /**
     * 将节点id加入父节点中
     * @param {*} node 父节点
     * @param {*} id 
     * @param {*} broid 
     * @param {num} position 兄弟节点上下位置
     */
    async _addInFatherNode(node, id, broid, position) {
        if (!node.childrenids) {
            node.childrenids = [];
        }
        //获得id要加入childrenids的位置
        let index = node.childrenids.length;
        //如果兄节点存在，放在其后面
        if (broid) {
            let broIndex = node.childrenids.indexOf(broid);
            if (broIndex > -1) {
                if (position === -1) {
                    index = broIndex;
                } else {
                    index = broIndex + 1;
                }
            }
        }
        node.childrenids.splice(index, 0, id);
        let key = this.MIND_KEY + (node.rootid || node.id);
        let field = node.id;
        let nodeInfo = JSON.stringify(node);
        this.ldb.doOne(this.ldb.hset(key, field, nodeInfo));
    }

    /**
     * 修改节点标题
     * @param {*} nodeInfo {nodeId,rootId,title}
     */
    async setNodeTitle(nodeInfo) {
        const mindKey = this.MIND_KEY + nodeInfo.rootId;
        const mindField = nodeInfo.nodeId;
        let node = await this.getNodeByID(mindKey, mindField);
        node.title = nodeInfo.title;
        await this.setNode(mindKey, mindField, node);

        //如果是根节点，还需要修改根节点列表
        if (nodeInfo.rootId === nodeInfo.nodeId) {
            const rootKey = this.ROOT_LIST_KEY + node.creator;
            let root = await this.getRootByID(rootKey, nodeInfo.rootId);
            root.title = nodeInfo.title;
            const rootField = root.score + '#' + root.id;
            await this.setNode(rootKey, rootField, root);
        }

    }

    /**
     * 删除节点
     * @param {*} nodeInfo {nodeId,rootId,fatherId,userId}
     */
    async deleteNode(nodeInfo) {

        const mindKey = this.MIND_KEY + nodeInfo.rootId;
        const mindField = nodeInfo.nodeId;

        //如果存在父节点，将父节点childrenids中相应的nodeid剔除
        if (nodeInfo.nodeId !== nodeInfo.fatherId) {
            let father = await this.getNodeByID(mindKey, nodeInfo.fatherId);
            if (father.childrenids) {
                father.childrenids = father.childrenids.filter(id => {
                    return id !== nodeInfo.nodeId;
                })
                await this.setNode(mindKey, nodeInfo.fatherId, father);
            }
        }

        await this.ldb.doOne(this.ldb.hdel(mindKey, mindField));

        //如果是根节点删除整棵树及根节点列表中的节点
        if (nodeInfo.rootId === nodeInfo.nodeId) {
            const rootKey = this.ROOT_LIST_KEY + nodeInfo.userId;
            await this.ldb.doOne(this.ldb.hmclear(mindKey));
            let root = await this.getRootByID(rootKey, nodeInfo.rootId);
            const rootField = root.score + '#' + nodeInfo.rootId;
            await this.ldb.doOne(this.ldb.hdel(rootKey, rootField));
        }
    }


    /**
     * 获取系统时间
     * @return {promise} Date对象
     */
    _getSysTime() {
        return new Promise((res, rej) => {
            G.api.getvar('', 'now', time => {
                res(time);
            }, (name, err) => {
                console.error(name, err);
                rej(err);
            });
        })
    }

    /**
     * 获取新节点的id
     * @param {string} regString {userid}#{timestamp} 
     * @return {promise} string 27位

     */
    _getNewNodeId(regString) {
        return new Promise((res, rej) => {
            G.api.register(regString, id => {
                res(id);
            }, (name, err) => {
                console.error(name, err);
                rej(err);
            })
        })
    }
}



MindService.$inject = ['DB'];

export default MindService;