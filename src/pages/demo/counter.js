import React from "react";

import * as styles from './../../css/counter.css';

class Counter extends React.Component {
  constructor() {
    super();
    this.state = { count: 0 };
  }

  render() {
    return (
      <div className="counter-wrapper">
        <h1>Counter</h1>
        <p>current count: {this.state.count}</p>
        <button onClick={() => this.setState({ count: this.state.count +
            1 })}>plus
          </button>
          <button onClick={() => this.setState({ count: this.state.count -
            1 })}>minus
          </button>
      </div>
    );
  }
}

export default Counter;
