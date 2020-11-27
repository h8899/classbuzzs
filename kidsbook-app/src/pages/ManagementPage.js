// React
import React, { Component } from 'react';
import { connect } from 'react-redux';

// Material UI
import { Paper } from '@material-ui/core';

// Project
import UsersTable from '../components/UsersTable';
import MainAppLayout from '../components/MainAppLayout';

class ManagementPage extends Component {
    render() {
        const { auth, user } = this.props;
        const currentUser = user[auth.realUser];

        return (
            <MainAppLayout
                title="Users management"
                errorMessage={!currentUser || !currentUser.isSuperuser ? 'Access denied' : null}>
                <div className="page-management pb-3">
                    <Paper className="width-full overflow-hidden">
                        <UsersTable title="Users list" type="user" />
                    </Paper>
                </div>
            </MainAppLayout>
        );
    }
}

const mapStateToProps = (state) => ({
    auth: state.auth,
    user: state.user
});

export default connect(mapStateToProps)(ManagementPage);
