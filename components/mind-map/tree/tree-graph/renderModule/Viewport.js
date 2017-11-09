/**
 * 画布设置
 */
class Viewport {
    constructor(canvasDom, paper) {
        Object.assign(this, {
            canvasDom,
            paper
        });
        this.canvasWidth = this.canvasDom.clientWidth || 400;
        this.canvasHeight = this.canvasDom.clientHeight || 400;
        this.viewBox = {
            x: 0,
            y: 0,
            width: this.canvasWidth,
            height: this.canvasHeight,
        }
        this.dragging = false;
        this.lastX = 0;
        this.lastY = 0;
        this.scale = 1.0; //画布比例
        this.dX, this.dY, this.realScale;
    }

    isDragging() {
        return this.dragging;
    }

    /**
     * 画布拖拽移动事件
     */
    setViewportDrag() {
        this.canvasDom.focus(); //画布获得焦点
        this.canvasDom.addEventListener('mousedown', (event) => {
            if (event.target.nodeName !== 'svg') {
                return
            };
            this.mousedownHandle(event);
        });

        this.canvasDom.addEventListener('mousemove', (event) => {
            if (event.target.nodeName !== 'svg') {
                return
            };
            this.mousemoveHandle(event);
        });

        this.canvasDom.addEventListener('mouseup', (event) => {
            if (event.target.nodeName !== 'svg') {
                return
            };
            this.mouseupHandle(event);
        });
    }

    /**
     * 画布获得焦点
     */
    setFocus() {
        this.canvasDom.focus();
    }

    /**
     * 设置画布大小及坐标
     * @param {Num} x 
     * @param {Num} y 
     */
    _setViewport(x, y) {
        this.realScale = 1.0 / this.scale;
        //画布缩放比例的最大最小值
        if (this.realScale > 5) {
            this.realScale = 5;
        }
        if (this.realScale < 0.2) {
            this.realScale = 0.2;
        }
        this.viewBox.x = x;
        this.viewBox.y = y;
        this.viewBox.width = this.canvasWidth * this.realScale;
        this.viewBox.height = this.canvasHeight * this.realScale;

        this.paper.setViewBox(this.viewBox.x, this.viewBox.y, this.viewBox.width, this.viewBox.height);
    }

    mousedownHandle(event) {
        this.realScale = 1.0 / this.scale;

        this.lastX = event.layerX;
        this.lastY = event.layerY;
        this.dragging = true;
    }

    mousemoveHandle(event) {
        if (this.dragging) {
            this.dX = -(event.layerX - this.lastX) * this.realScale;
            this.dY = -(event.layerY - this.lastY) * this.realScale;

            this.viewBox.x += this.dX;
            this.viewBox.y += this.dY;

            this._setViewport(this.viewBox.x, this.viewBox.y);

            this.lastX = event.layerX;
            this.lastY = event.layerY;
        }
    }

    mouseupHandle(event) {
        if (this.dragging) {
            this.dragging = false;
        }
    }


}

export default Viewport;