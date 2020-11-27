// React
import React from 'react';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import isObject from 'is-object';

// Material UI
import { withStyles } from '@material-ui/core/styles';
import { lighten } from '@material-ui/core/styles/colorManipulator';
import {
    Checkbox,
    IconButton,
    LinearProgress,
    Table,
    TableBody,
    TableCell,
    TableHead,
    TablePagination,
    TableRow,
    TableSortLabel,
    Toolbar,
    Tooltip,
    Typography
} from '@material-ui/core';
import {
    Add as AddIcon,
    ClearAll as ClearAllIcon,
    CloudDownload as CloudDownloadIcon,
    CloudUpload as CloudUploadIcon,
    Delete as DeleteIcon,
    Edit as EditIcon,
    GroupAdd as GroupAddIcon,
    OpenInNew as OpenInNewIcon,
    RemoveCircle as RemoveCircleIcon,
    RemoveRedEye as PreviewIcon,
    Search as SearchIcon,
    VerticalAlignTop as PinTopIcon
} from '@material-ui/icons';

// TODO: Refactor PropTypes

function desc(a, b, orderBy, isNumeric) {
    let x = a[orderBy];
    let y = b[orderBy];

    if (!isNumeric) {
        x = String(x).toLowerCase();
        y = String(y).toLowerCase();
    }

    if (y < x) return -1;
    if (y > x) return 1;
    return 0;
}

function stableSort(array, cmp) {
    const stabilizedThis = array.map((el, index) => [el, index]);
    stabilizedThis.sort((a, b) => {
        const order = cmp(a[0], b[0]);
        if (order !== 0) return order;
        return a[1] - b[1];
    });
    return stabilizedThis.map((el) => el[0]);
}

function getSorting(order, orderBy, isNumeric) {
    return order === 'desc' ? (a, b) => desc(a, b, orderBy, isNumeric) : (a, b) => -desc(a, b, orderBy, isNumeric);
}

class EnhancedTableHead extends React.Component {
    createSortHandler = (property) => (event) => {
        this.props.onRequestSort(event, property);
    };

    render() {
        const { onSelectAllClick, order, orderBy, numSelected, rowCount, fields, showId } = this.props;

        return (
            <TableHead>
                <TableRow>
                    <TableCell padding="checkbox">
                        <Checkbox
                            color="primary"
                            indeterminate={numSelected > 0 && numSelected < rowCount}
                            checked={numSelected === rowCount}
                            onChange={onSelectAllClick}
                        />
                    </TableCell>
                    {fields.map((row) => {
                        if (!showId && row.id === 'id') return null;
                        return (
                            <TableCell
                                key={row.id}
                                numeric={row.numeric}
                                padding={row.disablePadding ? 'none' : 'default'}
                                sortDirection={orderBy === row.id ? order : false}>
                                <Tooltip
                                    title="Sort"
                                    placement={row.numeric ? 'bottom-end' : 'bottom-start'}
                                    enterDelay={300}>
                                    <TableSortLabel
                                        active={orderBy === row.id}
                                        direction={order}
                                        onClick={this.createSortHandler(row.id)}>
                                        {row.label}
                                    </TableSortLabel>
                                </Tooltip>
                            </TableCell>
                        );
                    }, this)}
                    <TableCell />
                </TableRow>
            </TableHead>
        );
    }
}

EnhancedTableHead.propTypes = {
    numSelected: PropTypes.number.isRequired,
    onRequestSort: PropTypes.func.isRequired,
    onSelectAllClick: PropTypes.func.isRequired,
    order: PropTypes.string.isRequired,
    orderBy: PropTypes.string.isRequired,
    rowCount: PropTypes.number.isRequired
};

const toolbarStyles = (theme) => {
    let highlight = {
        color: theme.palette.text.primary,
        backgroundColor: theme.palette.primary.dark
    };

    if (theme.palette.type === 'light') {
        highlight = {
            color: theme.palette.primary.main,
            backgroundColor: lighten(theme.palette.primary.light, 0.85)
        };
    }

    return {
        root: {
            paddingRight: theme.spacing.unit
        },
        highlight: highlight,
        spacer: {
            flex: '1 1 100%'
        },
        actions: {
            color: theme.palette.text.primary
        },
        title: {
            flex: '0 0 auto'
        }
    };
};

let EnhancedTableToolbar = (props) => {
    const { numSelected, classes, title, type, onAction } = props;

    // TODO: Better toolbar items
    return (
        <Toolbar
            className={classNames(classes.root, {
                [classes.highlight]: numSelected > 0
            })}>
            <div className={classes.title}>
                {numSelected > 0 ? (
                    <Typography color="inherit" variant="subtitle1">
                        {numSelected} selected
                    </Typography>
                ) : (
                    <Typography variant="h6" id="tableTitle">
                        {title}
                    </Typography>
                )}
            </div>
            <div className={classes.spacer} />
            <div className={classes.actions}>
                {/* FIXME: Enable table actions */}
                {numSelected > 0 ? (
                    type === 'group' ? (
                        <Tooltip title="Remove from group" className="none-display">
                            <IconButton aria-label="Remove from group" onClick={onAction('leaveGroup')}>
                                <RemoveCircleIcon />
                            </IconButton>
                        </Tooltip>
                    ) : type === 'user' ? (
                        <div style={{ display: 'flex' }}>
                            <Tooltip title="Add to group">
                                <IconButton aria-label="Add to group" onClick={onAction('joinGroup')}>
                                    <GroupAddIcon />
                                </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete" className="none-display">
                                <IconButton aria-label="Delete" onClick={onAction('delete')}>
                                    <DeleteIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                    ) : null // survey
                ) : type === 'survey' ? (
                    <Tooltip title="New survey">
                        <IconButton aria-label="New survey" onClick={onAction('new')}>
                            <AddIcon />
                        </IconButton>
                    </Tooltip>
                ) : (
                    // group / user
                    <div style={{ display: 'flex' }}>
                        <Tooltip title="New user">
                            <IconButton aria-label="New user" onClick={onAction('new')}>
                                <AddIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Download sample CSV">
                            <IconButton aria-label="Download sample CSV" onClick={onAction('sample')}>
                                <CloudDownloadIcon />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Upload CSV">
                            <IconButton aria-label="Upload CSV" onClick={onAction('import')}>
                                <CloudUploadIcon />
                            </IconButton>
                        </Tooltip>
                        {/* FIXME: Allow search */}
                        {/*<Tooltip title="Search">
                                <IconButton aria-label="Search" onClick={onAction('search')}>
                                    <SearchIcon />
                                </IconButton>
                            </Tooltip>*/}
                    </div>
                )}
            </div>
        </Toolbar>
    );
};

EnhancedTableToolbar.propTypes = {
    classes: PropTypes.object.isRequired,
    numSelected: PropTypes.number.isRequired
};

EnhancedTableToolbar = withStyles(toolbarStyles)(EnhancedTableToolbar);

const styles = (theme) => ({
    root: {
        width: '100%',
        marginTop: theme.spacing.unit * 3
    },
    table: {
        minWidth: '100%'
    },
    tableWrapper: {
        overflowX: 'auto'
    }
});

class EnhancedTable extends React.Component {
    state = {
        order: 'asc',
        orderBy: 'id',
        selected: [],
        data: [],
        page: 0,
        rowsPerPage: 5
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        return {
            ...prevState,
            data: nextProps.data
        };
    }

    componentDidMount() {
        const sort = isObject(this.props.sort) ? this.props.sort : {};
        const newState = {};

        if (sort.field) newState.orderBy = sort.field;
        if (sort.order) newState.order = sort.order;

        this.setState(newState);
    }

    handleRequestSort = (event, property) => {
        const orderBy = property;
        let order = 'desc';

        if (this.state.orderBy === property && this.state.order === 'desc') {
            order = 'asc';
        }

        this.setState({ order, orderBy });
    };

    handleSelectAllClick = (event) => {
        if (event.target.checked) {
            this.setState((state) => ({ selected: state.data.map((n) => n.id) }));
            return;
        }
        this.setState({ selected: [] });
    };

    handleClick = (event, id) => {
        const { selected } = this.state;
        const selectedIndex = selected.indexOf(id);
        let newSelected = [];

        if (selectedIndex === -1) {
            newSelected = newSelected.concat(selected, id);
        } else if (selectedIndex === 0) {
            newSelected = newSelected.concat(selected.slice(1));
        } else if (selectedIndex === selected.length - 1) {
            newSelected = newSelected.concat(selected.slice(0, -1));
        } else if (selectedIndex > 0) {
            newSelected = newSelected.concat(selected.slice(0, selectedIndex), selected.slice(selectedIndex + 1));
        }

        this.setState({ selected: newSelected });
    };

    handleChangePage = (event, page) => {
        this.setState({ page });
    };

    handleChangeRowsPerPage = (event) => {
        this.setState({ rowsPerPage: event.target.value });
    };

    isSelected = (id) => this.state.selected.indexOf(id) !== -1;

    handleAction = (action, data) => () => {
        let payload;

        switch (action) {
            case 'leaveGroup':
            case 'joinGroup':
            case 'delete':
                payload = this.state.selected;
                break;
            case 'edit':
            case 'preview':
            case 'open':
            case 'clear':
            case 'pin':
            case 'download':
            case 'deleteSingle':
                payload = data;
                break;
            case 'new':
            case 'sample':
            case 'import':
            case 'search':
                break;
            default:
                return;
        }

        if (!this.props.onAction) return;
        this.props.onAction({
            action: action,
            payload: payload
        });
    };

    render() {
        const { classes, title, type, fields, showId, showLoading } = this.props;
        const { order, orderBy, selected, rowsPerPage, page, data } = this.state;
        const emptyRows = rowsPerPage - Math.min(rowsPerPage, data.length - page * rowsPerPage);

        return (
            <div>
                <EnhancedTableToolbar
                    numSelected={selected.length}
                    title={title}
                    type={type}
                    onAction={this.handleAction}
                />
                <LinearProgress color="secondary" className={`width-full ${showLoading ? '' : 'invisible'}`} />
                <div className={classes.tableWrapper}>
                    <Table className={classes.table} aria-labelledby="tableTitle">
                        <EnhancedTableHead
                            numSelected={selected.length}
                            order={order}
                            orderBy={orderBy}
                            onSelectAllClick={this.handleSelectAllClick}
                            onRequestSort={this.handleRequestSort}
                            rowCount={data.length}
                            fields={fields}
                            showId={showId}
                        />
                        <TableBody>
                            {stableSort(data, getSorting(order, orderBy, fields[order] && fields[order].numeric))
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((n) => {
                                    const isSelected = this.isSelected(n.id);
                                    return (
                                        <TableRow hover tabIndex={-1} key={n.id}>
                                            <TableCell padding="checkbox">
                                                <Checkbox
                                                    color="primary"
                                                    onChange={(ev) => this.handleClick(ev, n.id)}
                                                    checked={isSelected}
                                                />
                                            </TableCell>
                                            {showId && (
                                                <TableCell component="th" scope="row" padding="none">
                                                    {n.id}
                                                </TableCell>
                                            )}
                                            {fields
                                                .filter((f) => f.id !== 'id')
                                                .map((f) => (
                                                    <TableCell key={f.id}>{f.render ? f.render(n) : n[f.id]}</TableCell>
                                                ))}
                                            <TableCell className="flex-display">
                                                <IconButton
                                                    disabled={n.immutable}
                                                    onClick={this.handleAction('edit', n.id)}>
                                                    <EditIcon />
                                                </IconButton>
                                                {type === 'survey' && (
                                                    <>
                                                        <Tooltip title="View all responses">
                                                            <IconButton onClick={this.handleAction('preview', n.id)}>
                                                                <PreviewIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Open survey">
                                                            <IconButton onClick={this.handleAction('open', n.id)}>
                                                                <OpenInNewIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Clear all responses">
                                                            <IconButton onClick={this.handleAction('clear', n.id)}>
                                                                <ClearAllIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Pin survey">
                                                            <IconButton onClick={this.handleAction('pin', n.id)}>
                                                                <PinTopIcon color={n.pinned ? 'primary' : 'action'} />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Download responses as CSV">
                                                            <IconButton
                                                                aria-label="Download responses as CSV"
                                                                onClick={this.handleAction('download', n.id)}>
                                                                <CloudDownloadIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                        <Tooltip title="Delete survey">
                                                            <IconButton
                                                                aria-label="Delete survey"
                                                                onClick={this.handleAction('deleteSingle', n.id)}>
                                                                <DeleteIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            {emptyRows > 0 && (
                                <TableRow style={{ height: 49 * emptyRows }}>
                                    <TableCell colSpan={fields.length + 1 + Number(Boolean(showId))} />
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                <TablePagination
                    component="div"
                    count={data.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    backIconButtonProps={{
                        'aria-label': 'Previous Page'
                    }}
                    nextIconButtonProps={{
                        'aria-label': 'Next Page'
                    }}
                    onChangePage={this.handleChangePage}
                    onChangeRowsPerPage={this.handleChangeRowsPerPage}
                    rowsPerPageOptions={[2, 5, 10, 25]}
                />
            </div>
        );
    }
}

EnhancedTable.propTypes = {
    classes: PropTypes.object.isRequired
};

export default withStyles(styles)(EnhancedTable);
