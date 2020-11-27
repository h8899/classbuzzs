import React from 'react';
import PropTypes from 'prop-types';

const Container = ({ children }) => (
    <div
        style={{
            margin: '0 auto',
            maxWidth: 1080,
            padding: '0px 1.0875rem 1.45rem',
            paddingTop: '50px',
        }}
    >
        {children}
    </div>
);

Container.propTypes = {
    children: PropTypes.node.isRequired,
};

export default Container;
