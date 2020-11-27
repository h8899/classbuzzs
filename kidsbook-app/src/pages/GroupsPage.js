// React
import React, { Component } from 'react';
import { connect } from 'react-redux';
import isObject from 'is-object';

// Material UI
import { Button, Card, CardActionArea, CardContent, CardMedia, Grid, Typography } from '@material-ui/core';
import { Add as AddIcon } from '@material-ui/icons';

// Project
import MainAppLayout from '../components/MainAppLayout';
import { GET_USER } from '../actions';
import { switchGroup } from '../actions/authActions';
import { getUser } from '../actions/userActions';
import FormGroup from '../utils/FormGroup';

class GroupsPage extends Component {
    handleSwitchGroup = (groupId) => () => {
        this.props.switchGroup(groupId, true);
    };

    handleOpenDialog = () => {
        FormGroup.show();
    };

    componentDidMount() {
        this.props.getUser(this.props.auth.realUser);
    }

    render() {
        const { auth, group, loading, user } = this.props;

        const currentUser = user[auth.realUser];
        let groups = (isObject(currentUser) ? currentUser.groups : []) || [];
        groups = groups.map((g) => group[g]);

        const isLoading = loading[GET_USER][auth.realUser];
        const isSuperuser = currentUser && currentUser.isSuperuser;

        return (
            <MainAppLayout title="My Groups" showLoading={isLoading}>
                <div className="page-groups pb-3">
                    <Grid container spacing={16}>
                        {groups.map((g) => (
                            <Grid key={g.id} item xs={12} sm={6}>
                                <Card>
                                    <CardActionArea className="width-full" onClick={this.handleSwitchGroup(g.id)}>
                                        {g.photo ? (
                                            <CardMedia className="group-photo" image={g.photo} />
                                        ) : (
                                            <div className="group-photo" />
                                        )}
                                        <CardContent>
                                            <Typography variant="h5" color="primary" noWrap>
                                                <b>{g.name}</b>
                                            </Typography>
                                            <Typography className="mb-2 trans-2">{g.members.length} members</Typography>
                                            <Typography className="trans-3 group-desc" component="p">
                                                {g.description}
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>
                </div>
                {isSuperuser && (
                    <Button
                        variant="fab"
                        color="secondary"
                        aria-label="New group"
                        className="app-fab"
                        onClick={this.handleOpenDialog}>
                        <AddIcon />
                    </Button>
                )}
            </MainAppLayout>
        );
    }
}

const mapStateToProps = (state) => ({
    app: state.app,
    auth: state.auth,
    group: state.group,
    loading: state.loading,
    user: state.user
});

export default connect(
    mapStateToProps,
    { switchGroup, getUser }
)(GroupsPage);
