/**
 * 键盘监听事件
 */
class KeyboardEvent {
    constructor(options) {
        this.titleInputBox = options.titleInputBox;
        this.viewportHandle = options.viewportHandle;
    }

    setKeyDown(graph, e) {
        if (!graph.selected) {
            return null;
        }
        let kc = e.keyCode;
        console.log(kc);
        //回车键创建兄弟节点
        if (kc === 13) {
            graph.ctrl.addBroNode();
        }

        //Tab键创建子节点
        if (kc === 9 || kc === 45) {
            graph.ctrl.addSubNode();
        }

        //Delete键删除节点
        if (kc === 46) {
            graph.ctrl.delectNode();
        }
    }
}

export default KeyboardEvent;