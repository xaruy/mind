import Graph from './tree-graph/Graph'
import Renderer from './tree-graph/Renderer'
import TreeController from './tree.controller'
import React from 'react'
import Circle from './test.jsx'
import ReactDOM from 'react-dom'

function TreeDirective() {
    return {
        restrict: 'AE',
        scope: {
            tree: '=',
        },
        template: require('./tree.html'),
        controller: TreeController,
        controllerAs: 'treeCtr',
        link,
    };

    function link(scope, element, attrs, ctr) {
        
        /* scope.$watch('tree',(newVal,oldVar)=>{
            ReactDOM.render(<Circle  />, element[0]);
            console.log('treeMap==>',element[0]);
        },true) */
        let renderer = new Renderer({
            dom: element.children()[0],
            input: element.children()[1]
        });
        let graph = new Graph(renderer, ctr);

        scope.$watch("tree", (newVal, oldVal) => {
            graph.load(scope.tree);
        })
        graph.load(scope.tree);

        scope.graph = graph;
    }

}

TreeDirective.$inject = [];
export default TreeDirective;