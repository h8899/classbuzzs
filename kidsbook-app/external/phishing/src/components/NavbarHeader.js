import React, { PureComponent } from 'react';
import {
    Collapse,
    Navbar,
    NavbarToggler,
    NavbarBrand,
    Nav,
    NavItem,
} from 'reactstrap';
import PropTypes from 'prop-types';
import './NavbarHeader.css';
import disneyLogo from '../compressed_images/disney-logo.png';

const headers = [
    {
        name: 'Places to stay',
        pathname: 'https://www.hongkongdisneyland.com/hotels/',
    },
    {
        name: 'Things to Do',
        pathname: 'https://www.hongkongdisneyland.com/activities/',
    },
    {
        name: 'Help',
        pathname: 'https://www.hongkongdisneyland.com/help/',
    },
];

const NavItemLink = ({ children, to }) => (
    <a
        href={to}
        target="_blank"
        rel="noopener noreferrer"
        className="nav-link"
        style={{ textDecoration: 'none' }}
    >
        {children}
    </a>
);

NavItemLink.propTypes = {
    children: PropTypes.node.isRequired,
    to: PropTypes.string.isRequired,
};

class NavbarHeader extends PureComponent {
    constructor(props) {
        super(props);
        this.toggle = this.toggle.bind(this);
        this.state = {
            isOpen: false,
        };
    }

    toggle() {
        this.setState(prevState => ({
            isOpen: !prevState.isOpen,
        }));
    }

    render() {
        const { isOpen } = this.state;
        return (
            <div className="shadow p-1 bg-white">
                <Navbar color="light" light expand="sm">
                    <NavbarBrand href="/" style={{ width: '150px', marginTop: '30px' }}>
                        <img src={disneyLogo} alt="Disney Hong Kong" />
                    </NavbarBrand>
                    <NavbarToggler onClick={this.toggle} />
                    <Collapse className="text-center" isOpen={isOpen} navbar>
                        <Nav className="ml-auto" navbar>
                            {headers.map(header => (
                                <NavItem
                                    key={header.name}
                                >
                                    <NavItemLink to={header.pathname}>
                                        {header.name}
                                    </NavItemLink>
                                </NavItem>
                            ))}
                        </Nav>
                    </Collapse>
                </Navbar>
            </div>
        );
    }
}

export default NavbarHeader;
