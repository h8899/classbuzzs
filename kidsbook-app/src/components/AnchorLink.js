// React
import React, { Component } from 'react';

class AnchorLink extends Component {
    render() {
        return (
            <a href={this.props.href} className="anchor">
                {this.props.children}
            </a>
        );
    }
}

export default AnchorLink;
