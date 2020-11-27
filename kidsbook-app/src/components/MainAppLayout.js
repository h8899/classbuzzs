import React, { Component } from 'react';
import MainAppBar from '../components/MainAppBar';
import { Typography } from '@material-ui/core';

class MainAppLayout extends Component {
    render() {
        const { title, showGroupSelector, allowSwitchGroup, showLoading, errorMessage, disableScroll } = this.props;

        return (
            <div className="app-layout-wrapper">
                <MainAppBar
                    title={title}
                    showGroupSelector={showGroupSelector}
                    allowSwitchGroup={allowSwitchGroup}
                    showLoading={showLoading}
                />
                <main className={`app-layout ${disableScroll ? 'height-full overflow-hidden' : ''}`}>
                    {errorMessage ? (
                        <div className="size-full flex-display flex-align-center flex-justify-center flex-column mt-3 mb-3 pl-2 pr-2">
                            <Typography variant="h3" className="trans-4">Uh-oh</Typography>
                            <Typography className="trans-3" align="center">{errorMessage}</Typography>
                        </div>
                    ) : (
                        this.props.children
                    )}
                </main>
            </div>
        );
    }
}

export default MainAppLayout;
