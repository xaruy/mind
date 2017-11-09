import LDB from '@leither/ldb';
class SidebarDBService {
    constructor(DB) {
        Object.assign(this, DB);
        this.ldb = LDB.getLDB(G);
    }

    /**
     * 获取根节点列表
     * @param {*} userid 
     */
    async getRootList(userid) {
        let rootList = [];
        if (userid) {
            const key = this.ROOT_LIST_KEY + userid;
            let listInfo = await this.ldb.doOne(this.ldb.hgetall(key));
            if (listInfo.length) {
                listInfo.reverse();
                listInfo.forEach(info => {
                    let rootObj = {};
                    const field = info.field;
                    const varArr = field.split('#');
                    rootObj = JSON.parse(info.value);
                    rootObj.score = varArr[0];
                    rootList.push(rootObj);
                })
            }
        }
        return rootList;
    }

    /**
     * 创建根节点
     * @param {obj} rootObj {title,creator}
     */
    async createRoot(rootObj) {
        if (rootObj && rootObj.title) {
            const sysTime = await this._getSysTime(),
                sysTimestamp = sysTime.getTime(),
                regString = rootObj.creator + '#' + sysTimestamp,
                newRoot = Object.assign({}, rootObj);

            const id = await this._getNewRootId(regString);
            newRoot.id = id;
            newRoot.createdTime = sysTimestamp;

            const rootListKey = this.ROOT_LIST_KEY + rootObj.creator,
                mindKey = this.MIND_KEY + id,
                rootField = sysTimestamp + '#' + id,
                mindField = id,
                value = JSON.stringify(newRoot);

            //保存进根节点列表
            await this.ldb.doOne(this.ldb.hset(rootListKey, rootField, value));
            //保存进树列表
            await this.ldb.doOne(this.ldb.hset(mindKey, mindField, value));
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
     * 获取新的根节点id
     * @param {string} regString {userid}#{timestamp} 
     * @return {promise} string 27位

     */
    _getNewRootId(regString) {
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

SidebarDBService.$inject = ['DB'];

export default SidebarDBService;