// React
import React, { Component } from 'react';

// Material UI
import {
    Button,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    InputLabel,
    MenuItem,
    Select
} from '@material-ui/core';
import { ArrowDropDown as ArrowDropDownIcon } from '@material-ui/icons';

// Project
import DialogHelper from './DialogHelper';
import { allTemplates } from './SurveyTemplates';

class FormSelectSurveyTemplateComponent extends Component {
    state = {
        index: -1
    };

    handleSelectChange = ({ target }) => {
        this.setState({ index: target.value });
    };

    onExit = (cancel) => () => {
        DialogHelper.dismiss();
        if (cancel) {
            this.props.onExit(null);
        } else {
            const template = allTemplates[this.state.index];
            this.props.onExit(template);
        }
    };

    render() {
        const { index } = this.state;

        return (
            <>
                <DialogTitle id="dialog-title">Select a template</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth>
                        <InputLabel htmlFor="survey-template">Template</InputLabel>
                        <Select
                            value={index}
                            onChange={this.handleSelectChange}
                            IconComponent={ArrowDropDownIcon}
                            inputProps={{
                                name: 'survey-template',
                                id: 'survey-template'
                            }}>
                            {allTemplates.map((t, i) => (
                                <MenuItem key={i} value={i}>
                                    {t.templateTitle}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </DialogContent>
                <DialogActions>
                    <Button onClick={this.onExit(true)}>Cancel</Button>
                    <Button onClick={this.onExit(false)} color="primary" disabled={index < 0}>
                        Load
                    </Button>
                </DialogActions>
            </>
        );
    }
}

class FormSelectSurveyTemplate {
    static show(onExit) {
        if (!onExit) onExit = () => {};

        DialogHelper.showDialog({
            children: <FormSelectSurveyTemplateComponent onExit={onExit} />,
            props: {
                disableBackdropClick: true,
                disableEscapeKeyDown: true
            }
        });
    }
}

export default FormSelectSurveyTemplate;
