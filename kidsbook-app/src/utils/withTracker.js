import React, { Component } from 'react';
import GoogleAnalytics from 'react-ga';
import Config from '../config';

GoogleAnalytics.initialize(Config.gaTrackingID);

const withTracker = (WrappedComponent, options = {}) => {
    const trackPage = (page) => {
        GoogleAnalytics.set({
            page,
            ...options
        });
        GoogleAnalytics.pageview(page);
    };

    class HOC extends Component {
        componentDidMount() {
            const page = this.props.location.pathname + this.props.location.search;
            trackPage(page);
        }

        componentDidUpdate(prevProps) {
            const currentPage = prevProps.location.pathname + prevProps.location.search;
            const nextPage = this.props.location.pathname + this.props.location.search;

            if (currentPage !== nextPage) {
                trackPage(nextPage);
            }
        }

        render() {
            return <WrappedComponent {...this.props} />;
        }
    }

    return HOC;
};

export default withTracker;
