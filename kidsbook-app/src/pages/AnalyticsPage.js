// React
import React, { Component } from 'react';
import withSizes from 'react-sizes';

// Material UI
import {
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip as ChartTooltip,
    Legend
} from 'recharts';
import {
    MenuItem,
    Paper,
    Select,
    Typography
} from '@material-ui/core';

// Project
import MainAppLayout from '../components/MainAppLayout';
import { users } from '../apis/dummy';

class AnalyticsPage extends Component {
    state = {
        selectedInterval: '',
        selectedUser: '',
        intervals: [],
        users: Object.keys(users).map((id) => users[id].fullName),
        data: {}
    };

    componentDidMount() {
        // Generate datas
        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const intervals = [
            '15 Oct - 21 Oct 2018',
            '8 Oct - 14 Oct 2018',
            '1 Oct - 7 Oct 2018',
            '24 Sep - 30 Sep 2018',
            '17 Sep - 23 Sep 2018'
        ];
        const users = this.state.users;

        let data = {};
        users.forEach((u) => {
            data[u] = {};
            intervals.forEach((i) => {
                let arr = [];
                days.forEach((d) => {
                    arr.push({
                        name: d,
                        Minutes: Math.round(Math.random() * 100) / 2
                    });
                });
                data[u][i] = arr;
            });
        });

        this.setState({
            selectedInterval: intervals[0],
            selectedUser: this.state.users[4],
            intervals: intervals,
            data: data
        });
    }

    handleIntervalChange = (ev) => {
        this.setState({
            selectedInterval: ev.target.value
        });
    };

    handleUserChange = (ev) => {
        this.setState({
            selectedUser: ev.target.value
        });
    };

    render() {
        const { isMobile } = this.props;
        const { data, selectedUser, selectedInterval } = this.state;

        let barData = [];
        if (data && data[selectedUser] && data[selectedUser][selectedInterval]) {
            barData = data[selectedUser][selectedInterval];
        }

        return (
            <MainAppLayout title="Analytics" showGroupSelector allowSwitchGroup errorMessage="This page is under development">
                <div className="page-analytics">
                    <Paper className="mb-3 analytics-main">
                        <div className="flex-display mb-2 analytics-selects">
                            <Select
                                className="analytics-select"
                                value={selectedInterval}
                                onChange={this.handleIntervalChange}
                                renderValue={(value) => <div className="pl-1 no-wrap">{value}</div>}
                                inputProps={{ name: 'interval' }}>
                                {this.state.intervals.map((i) => (
                                    <MenuItem key={i} value={i}>
                                        {i}
                                    </MenuItem>
                                ))}
                            </Select>
                            <div className="flex-grow" />
                            <Select
                                className="analytics-select"
                                value={selectedUser}
                                onChange={this.handleUserChange}
                                renderValue={(value) => <div className="pl-1 no-wrap">{value}</div>}
                                inputProps={{ name: 'user' }}>
                                {this.state.users.map((u) => (
                                    <MenuItem key={u} value={u}>
                                        {u}
                                    </MenuItem>
                                ))}
                            </Select>
                        </div>
                        <Typography variant="h5" align="center">
                            Screen time of{' '}
                            <Typography color="primary" variant="h5" component="span" className="inline-display">
                                <b>{selectedUser}</b>
                            </Typography>
                        </Typography>
                        <Typography align="center" className="mb-2 trans-3">
                            {selectedInterval}
                        </Typography>
                        <div className="pos-relative analytics-chart">
                            <div className="pos-absolute absolute-fit">
                                <ResponsiveContainer>
                                    <BarChart data={barData}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="name" />
                                        <YAxis width={30} hide={isMobile} />
                                        <ChartTooltip />
                                        <Legend />
                                        <Bar dataKey="Minutes" fill="#c60000" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    </Paper>
                </div>
            </MainAppLayout>
        );
    }
}

const mapSizesToProps = ({ width }) => ({ isMobile: width < 480 });

export default withSizes(mapSizesToProps)(AnalyticsPage);
