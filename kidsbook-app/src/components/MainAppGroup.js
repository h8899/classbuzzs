// React
import React, { Component } from 'react';
import { connect } from 'react-redux';

// Material UI
import { List, ListItem, ListItemText, Popover, Typography } from '@material-ui/core';
import { switchGroup } from '../actions/authActions';

class MainAppGroup extends Component {
    handleSwitchGroup = (groupId) => () => {
        this.props.switchGroup(groupId);
        this.props.onClose();
    };

    render() {
        const { app, auth, group, user } = this.props;
        const selected = app.groupId;
        let groups = user[auth.realUser].groups || [];
        groups = groups.map((g) => group[g]);

        return (
            <Popover
                anchorEl={this.props.anchorEl}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
                transformOrigin={{ vertical: 'top', horizontal: 'left' }}
                open={this.props.open}
                onClose={this.props.onClose}
                transitionDuration={200}
                className="app-group">
                <List className="app-group-list">
                    {groups.map((g) => (
                        <ListItem key={g.id} button onClick={this.handleSwitchGroup(g.id)} selected={g.id === selected}>
                            <ListItemText
                                primary={
                                    <Typography className="line-compact" noWrap>
                                        <b>{g.name}</b>
                                    </Typography>
                                }
                            />
                        </ListItem>
                    ))}
                </List>
            </Popover>
        );
    }
}

const mapStateToProps = (state) => ({
    app: state.app,
    auth: state.auth,
    group: state.group,
    user: state.user
});

export default connect(mapStateToProps, { switchGroup })(MainAppGroup);
