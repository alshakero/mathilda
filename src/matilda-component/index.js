import React, { Component } from 'react';
import Paths from './paths';

class Matlida extends Component {
  componentDidMount()
  {    
      let comp = this;
      window.addEventListener('mousemove', function()
      {
          let xAmount = 0.5 - window.event.clientX / window.innerWidth;
          let yAmount = 0.5 - window.event.clientY / window.innerHeight;

          comp.setState({eyeXOffset: -xAmount * 7, eyeYOffset: -yAmount * 3, headRotateAngle: yAmount * 10});
      });
  }
  constructor()
  {
      super();
      this.state = {eyeXOffset: 0, eyeYOffset: 0};
  }
  render() {
    return (
        <div> <Paths eyeXOffset={this.state.eyeXOffset} headRotateAngle={this.state.headRotateAngle} eyeYOffset={this.state.eyeYOffset} /> </div>
    );
  }
}

export default Matlida;
