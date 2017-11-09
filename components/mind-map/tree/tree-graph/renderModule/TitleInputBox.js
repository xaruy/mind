/**
 * 标题输入框的显示控制
 */
class TitleInputBox {
    constructor(inputBox, headerTop = 0) {
        Object.assign(this, {
            inputBox,
            headerTop
        });

        //修改的节点
        this.modifyNode = null;

        //根节点的样式
        this.rootFontSize = '25px';
        this.rootDeviationX = 20;
        this.rootDeviationY = 15;

        //第一层的样式
        this.firstFontSize = '16px';
        this.firstDeviationX = 20;
        this.firstDeviationY = 12;

        //其他层的样式
        this.moreFontSize = '15px';
        this.moreDeviationX = 5;
        this.moreDeviationY = 7;

        //用于双击后输入内容清空原内容
        this.firstInput = true;
        //判断输入框是否显示
        this.showInput = false;

    }

    /**
     * 页面头部高度，用于修正输入框高度
     * @param {*} top 
     */
    setHeaderTop(top) {
        this.headerTop = top;
    }

    /**
     * 键盘触发激活
     * @param {*} node 
     * @param {*} viewBox 
     */
    keyBoardActive(node, viewBox) {
        this.inputBox.innerHTML = '';
        this.firstInput = false;
        this.setActive();
    }

    /**
     * 双击鼠标触发激活，需要显示原标题内容
     * @param {*} node 
     * @param {*} viewBox 
     */
    dblclickActive(node, viewBox) {
        //换行符替换成html格式
        let title = node.title.replace(/\n/, '<br>')
        this.inputBox.innerHTML = title;
        let range = document.createRange();

        //全选输入框内容
        range.selectNodeContents(this.inputBox);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        this.setActive();
        this.setPosition(node, viewBox);
    }

    /**
     * 激活inputBox的位置和样式
     * @param {Node} node 
     * @param {Viewport.viewBox} viewBox
     */
    setPosition(node, viewBox) {
        
        this.modifyNode = node;
        this.inputBox.focus();
        let top = node.y + this.headerTop - viewBox.y;
        let left = node.x - viewBox.x;
        if (node.isRootNode()) {
            top += this.rootDeviationY;
            left += this.rootDeviationX;
            this.inputBox.style.fontSize = this.rootFontSize;
        }
        if (node.isFirstLevelNode()) {
            top += this.firstDeviationY;
            left += this.firstDeviationX;
            this.inputBox.style.fontSize = this.firstFontSize;
        }
        if (node.isSecondMoreNode()) {
            top += this.moreDeviationY;
            left += this.moreDeviationX;
            this.inputBox.style.fontSize = this.moreFontSize;
        }
        this.inputBox.style.top = top + 'px';
        this.inputBox.style.left = left + 'px';
        this.inputBox.style.minWidth = node.shape[0].getBBox().width + 'px';
    }

    //显示输入框
    setActive(){
        this.inputBox.classList.add('input-active');
        this.showInput = true;
    }

    /**
     * 失去焦点后的样式
     */
    setUnactive() {
        this.firstInput = true;
        this.inputBox.innerHTML = '';
        this.inputBox.blur();
        this.inputBox.classList.remove('input-active');
        this.showInput = false;
    }

    setInputText(key) {

        //如果是第一次输入清空原内容
        if (this.firstInput) {
            this.firstInput = false;
            this.inputBox.innerHTML = '';
        }

        this.inputBox.innerHTML += key;

        //光标始终在文字后面
        let range = document.createRange();
        range.selectNodeContents(this.inputBox);
        range.collapse(false);
        let sel = window.getSelection();
        sel.removeAllRanges();
        sel.addRange(range);
    }
}

export default TitleInputBox;