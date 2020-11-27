// React
import React, { Component } from 'react';

// Project
import Lightbox from 'react-image-lightbox';
import LightBoxHelper from '../utils/LightBoxHelper';

class LightBoxProvider extends Component {
    state = {
        src: '',
        _open: false
    };

    componentDidMount() {
        LightBoxHelper.init({
            show: (src) => {
                this.setState({
                    src,
                    _open: true
                });
            },
            hide: () => {
                this.handleClose();
            }
        });
    }

    handleClose = () => {
        this.setState({
            _open: false
        });
    };

    render() {
        const { src, _open } = this.state;

        if (_open) {
            return (
                <Lightbox
                    animationDuration={150}
                    reactModalStyle={{ overlay: { zIndex: 2000 } }}
                    mainSrc={src}
                    onCloseRequest={this.handleClose}
                    closeLabel="Close preview"
                />
            );
        } else {
            return null;
        }
    }
}

export default LightBoxProvider;
