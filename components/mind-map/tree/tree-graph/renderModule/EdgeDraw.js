import Raphael from 'raphael'

class EdgeDraw {
    constructor(edge) {
        this.edge = edge;
        this.source = edge.source;
        this.target = edge.target;
        this.paper = this.source.shape[0].paper;

        this.shape;
        this.sourceBox = this.source.shape.getBBox();
        this.targetBox = this.target.shape[1].getBBox(); //TODO 如果title为空时 target.shape.getBBox(),无法获得正确的值
    }

    drawEdge() {
        if (this.source.isRootNode()) {
            this.drawCurve();
        } else {
            this.drawThreePath();
        }
    }

    /**
     * 画根结点到第一层节点的曲线
     */
    drawCurve() {
        let x1 = (this.sourceBox.x + this.sourceBox.x2) / 2,
            y1 = (this.sourceBox.y + this.sourceBox.y2) / 2,
            x2 = (this.targetBox.x + this.targetBox.x2) / 2 - this.target.direction * this.targetBox.width / 2,
            y2 = (this.targetBox.y + this.targetBox.y2) / 2,
            k1 = 0.8,
            k2 = 0.2;
        let pathPoints = {
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            x3: x2 - k1 * (x2 - x1),
            y3: y2 - k2 * (y2 - y1),
        }
        let edgePath = this.paper.path(Raphael.fullfill("M{x1},{y1}Q{x3},{y3},{x2},{y2}", pathPoints));

        edgePath.attr({
            'stroke': '#999',
            'stroke-width': 2,
        })
        edgePath.toBack();
        this.shape = this.paper.set().push(edgePath);
        //如果target存在connectFather,重画这条边
        if (this.edge.shape) {
            this.edge.shape[0].remove();
            this.edge.shape = this.shape;
        } {
            this.edge.shape = this.shape;
        }
    }

    /**
     * 画其他边--三层边
     */
    drawThreePath() {
        let xs, ys, xt1, xt2;
        if (this.target.direction == 1) {
            xs = this.sourceBox.x2;
            xt1 = this.targetBox.x;
            xt2 = this.targetBox.x2;
        } else if (this.target.direction == -1) {
            xs = this.sourceBox.x;
            xt1 = this.targetBox.x2;
            xt2 = this.targetBox.x
        }

        let yt1 = this.targetBox.y2 - 3;
        let yt2 = yt1;

        //当为第二层节点时，短边出发点稍下

        if (this.source.isSecondMoreNode()) {
            ys = this.sourceBox.y2 - 3;
        } else {
            ys = (this.sourceBox.y + this.sourceBox.y2) / 2;
        }

        let xc = (xs + xt1) / 2;
        let yc = ys;

        let shortPath = this.paper.path(Raphael.fullfill("M{x1},{y1}L{x2},{y2}", {
            x1: xs,
            y1: ys,
            x2: xc,
            y2: yc,
        }));
        let connectPath = this.paper.path(Raphael.fullfill("M{x1},{y1}L{x2},{y2}", {
            x1: xc,
            y1: yc,
            x2: xt1,
            y2: yt1,
        })).attr({
            'stroke': '#999',
            'stroke-width': 2,
        });
        let targetUnderPath = this.paper.path(Raphael.fullfill("M{x1},{y1}L{x2},{y2}", {
            x1: xt1,
            y1: yt1,
            x2: xt2,
            y2: yt2,
        }));

        this.shape = this.paper.set().push(shortPath).push(connectPath).push(targetUnderPath);

        //如果target存在connectFather,重画这条边
        if (this.edge.shape) {
            this.edge.shape[0].remove();
            this.edge.shape[1].remove();
            this.edge.shape[2].remove();
            this.edge.shape = this.shape;
        } {
            this.edge.shape = this.shape;
        }
    }
}

export default EdgeDraw;