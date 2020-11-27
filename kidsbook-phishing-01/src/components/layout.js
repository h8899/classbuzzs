import React from 'react';
import PropTypes from 'prop-types';

import './layout.css';
import 'bootstrap/dist/css/bootstrap.min.css'; // Bootstrap 4.2.1

const Layout = ({ children }) => (
    <>
      <main>{children}</main>
    </>
);

Layout.propTypes = {
  children: PropTypes.node.isRequired,
};

export default Layout;
