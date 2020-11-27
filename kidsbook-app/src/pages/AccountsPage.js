// React
import React, { Component } from 'react';
import { connect } from 'react-redux';

// Material UI
import {
    Card,
    CardActionArea,
    CardContent,
    CardMedia,
    Grid,
    Typography
} from '@material-ui/core';

// Project
import MainAppLayout from '../components/MainAppLayout';
import Navigation from '../navigation';
import { accounts } from '../apis/dummy';
import { getAllVirtual } from '../actions/userActions';

class AccountsPage extends Component {
    componentDidMount() {
        this.props.getAllVirtual();
    }

    render() {
        return (
            <MainAppLayout title="Switch account" showGroupSelector allowSwitchGroup>
                <div className="page-accounts pb-3">
                    <Grid container spacing={16} justify="center">
                        <Grid item xs={12} sm={4} md={3}>
                            <Card>
                                <CardActionArea className="width-full account-item">
                                    <div className="account-photo" />
                                    <CardContent className="flex-grow">
                                        <Typography className="font-normal" variant="h5" noWrap>
                                            <b>New virtual account</b>
                                        </Typography>
                                        <Typography className="trans-all font-smaller" noWrap>
                                            .
                                        </Typography>
                                    </CardContent>
                                </CardActionArea>
                            </Card>
                        </Grid>
                        {accounts.map((a) => {
                            return (
                                <Grid key={a.id} item xs={12} sm={4} md={3}>
                                    <Card>
                                        <CardActionArea
                                            className="width-full account-item"
                                            onClick={() => Navigation.push('/profile')}>
                                            {a.photo ? (
                                                <CardMedia className="account-photo" image={a.photo} />
                                            ) : (
                                                <div className="account-photo" />
                                            )}
                                            <CardContent className="flex-grow">
                                                <Typography className="font-normal" variant="h5" color="primary" noWrap>
                                                    <b>{a.name}</b>
                                                </Typography>
                                                <Typography className="trans-2 font-smaller" noWrap>
                                                    Last used: {a.lastUsed}
                                                </Typography>
                                            </CardContent>
                                        </CardActionArea>
                                    </Card>
                                </Grid>
                            );
                        })}
                    </Grid>
                </div>
            </MainAppLayout>
        );
    }
}

export default connect(
    null,
    { getAllVirtual }
)(AccountsPage);
