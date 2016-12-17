import React, { Component } from 'react';
import './style.css';

class Overlay extends Component {
    render ()
    {
        return <div id="overlay">{this.props.children}</div>
    }
}
export default Overlay;