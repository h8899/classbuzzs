import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class RouterLink extends Component {
    render() {
        return (
            <Link to={this.props.to} style={{ textDecoration: 'none', color: 'inherit' }}>
                {this.props.children}
            </Link>
        );
    }
}

export default RouterLink;
