// React
import React, { Component } from 'react';
import RandomMC from 'random-material-color';
import Contrast from 'contrast';

// Material UI
import MUIAvatar from '@material-ui/core/Avatar';

class Avatar extends Component {
    render() {
        if (this.props.src) {
            return <MUIAvatar src={this.props.src} className={this.props.className} />;
        } else {
            let { letters, text } = this.props;

            if (!letters) {
                if (text) {
                    letters = text
                        .split(' ')
                        .map((w) => w[0])
                        .join('');
                } else {
                    letters = '';
                }
            }
            if (letters.length > 2) letters = letters.substr(0, 2);
            letters = letters.toUpperCase();

            let bgColor = RandomMC.getColor({ shades: ['200', '300', '500'], text: letters });
            const textColor = Contrast(bgColor) === 'light' ? '#000' : '#fff';
            if (letters.trim().length <= 0) bgColor = '#ccc';

            return (
                <MUIAvatar
                    className={this.props.className}
                    style={{ backgroundColor: bgColor, color: textColor }}>
                    {letters}
                </MUIAvatar>
            );
        }
    }
}

export default Avatar;
