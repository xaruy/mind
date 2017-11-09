import React from 'react';

export default class Circle extends React.Component {
  render() {
    
    let g = <circle cx={100} cy={100} r={10} stroke="black" stroke-width="2"  fill="red" />
    return (
    <svg> {g}
    </svg>)
  }
}