// React
import React, { Component } from 'react';
import { connect } from 'react-redux';
import YouTube from 'react-youtube';

// Material UI
import {
    Button,
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    FormControl,
    FormControlLabel,
    FormGroup,
    Paper,
    Radio,
    RadioGroup,
    TextField,
    Typography
} from '@material-ui/core';

// Project
import MainAppLayout from '../components/MainAppLayout';
import { SurveyFormatter } from '../utils/formatter';
import isObject from 'is-object';
import LoadingHelper from '../utils/LoadingHelper';
import SnackBarHelper from '../utils/SnackBarHelper';
import { getSurvey, submitAnswers, getAnswers } from '../actions/surveyActions';
import { GET_SURVEY, SUBMIT_SURVEY_ANSWER, GET_SURVEY_ANSWER } from '../actions/';
import { parseYoutube } from '../utils/utils';
import Navigation from '../navigation';

class SurveyResponsePage extends Component {
    state = {
        surveyId: null,
        surveyResponse: {},
        submitProcessing: false,
        submitError: false,
        getProcessing: false,
        getError: false,
        showPostface: false
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const surveyId = nextProps.match.params.surveyId;
        const submitProcessing = Boolean(nextProps.loading[SUBMIT_SURVEY_ANSWER]);
        const submitError = Boolean(nextProps.error[SUBMIT_SURVEY_ANSWER]);
        const getProcessing = Boolean(nextProps.loading[GET_SURVEY_ANSWER][surveyId]);
        const getError = Boolean(nextProps.error[GET_SURVEY_ANSWER]);
        const userId = nextProps.auth.effectiveUser;
        const newState = {};

        const loadResponse = () => {
            const survey = SurveyFormatter.show(nextProps.survey[surveyId]);
            const answer = survey.answers[userId];
            if (isObject(answer) && Array.isArray(answer.answers)) {
                const response = {};
                answer.answers.forEach((a, index) => {
                    if (Array.isArray(a)) {
                        const options = {};
                        a.forEach((i) => (options[i] = true));
                        response[index] = options;
                    } else {
                        response[index] = String(a);
                    }
                });
                newState.surveyResponse = response;
            }
        };

        if (surveyId !== prevState.surveyId) {
            newState.surveyId = surveyId;
            newState.surveyResponse = {};
            if (surveyId) {
                loadResponse();
                nextProps.getSurvey(surveyId);
                nextProps.getAnswers(surveyId, userId);
            }
        }

        if (submitError !== prevState.submitError) {
            newState.submitError = submitError;
        }
        if (getError !== prevState.getError) {
            newState.getError = getError;
        }

        // Transition from processing to not processing
        if (submitProcessing !== prevState.submitProcessing) {
            newState.submitProcessing = submitProcessing;

            if (!submitProcessing && prevState.submitProcessing) {
                LoadingHelper.hide();
                // Close dialog if success
                if (!submitError) {
                    SnackBarHelper.enqueueSnackbar('Survey submitted successfully');
                    newState.showPostface = true;
                }
            }
        }
        if (getProcessing !== prevState.getProcessing) {
            newState.getProcessing = getProcessing;

            if (!getProcessing && prevState.getProcessing) {
                loadResponse();
            }
        }

        return {
            ...prevState,
            ...newState
        };
    }

    handleSurveyResponse = (index) => ({ target }) => {
        const { surveyResponse } = this.state;

        this.setState({
            surveyResponse: {
                ...surveyResponse,
                [index]: target.value
            }
        });
    };

    handleSurveyCheckboxResponse = (index, optionIndex) => ({ target }) => {
        const { surveyResponse } = this.state;
        let response = surveyResponse[index];
        if (!isObject(response)) response = {};

        this.setState({
            surveyResponse: {
                ...surveyResponse,
                [index]: {
                    ...response,
                    [optionIndex]: target.checked
                }
            }
        });
    };

    handleSurveySubmit = () => {
        const { surveyId, surveyResponse } = this.state;
        const { auth, survey, submitAnswers } = this.props;

        const currentUserId = auth.effectiveUser;
        const isValid = Boolean(survey[surveyId]);
        const mainSurvey = SurveyFormatter.show(survey[surveyId]);

        if (!isValid) return;
        const answers = mainSurvey.questions.map((question, index) => {
            const response = surveyResponse[index];
            if (question.type === 'checkbox') {
                if (isObject(response)) {
                    return JSON.stringify(
                        Object.keys(response)
                            .filter((r) => response[r])
                            .map((r) => parseInt(r, 10))
                    );
                }
                return [];
            }
            return surveyResponse[index] || '';
        });

        LoadingHelper.show('Submitting the survey');
        submitAnswers(surveyId, currentUserId, answers);
    };

    renderQuestions = (survey, isDisabled = false) => {
        const questions = [];
        const { surveyResponse } = this.state;

        survey.questions.forEach((question, index) => {
            if (!isObject(question)) return;

            let answerSection;
            switch (question.type) {
                case 'text':
                    answerSection = (
                        <div className="pl-1">
                            <TextField
                                name="question"
                                placeholder="Text"
                                type="text"
                                value={surveyResponse[index] || ''}
                                onChange={this.handleSurveyResponse(index)}
                                disabled={isDisabled}
                            />
                        </div>
                    );
                    break;
                case 'checkbox':
                case 'radio': {
                    let main = question.options.map((option, optionIndex) => {
                        if (question.type === 'checkbox') {
                            return (
                                <FormControlLabel
                                    key={optionIndex}
                                    control={
                                        <Checkbox
                                            color="primary"
                                            value={String(optionIndex)}
                                            onChange={this.handleSurveyCheckboxResponse(index, optionIndex)}
                                            disabled={isDisabled}
                                            checked={
                                                surveyResponse[index]
                                                    ? surveyResponse[index][optionIndex] || false
                                                    : false
                                            }
                                        />
                                    }
                                    className="survey-option"
                                    label={option}
                                />
                            );
                        } else {
                            return (
                                <FormControlLabel
                                    key={optionIndex}
                                    control={<Radio color="primary" disabled={isDisabled} />}
                                    className="survey-option"
                                    label={option}
                                    value={String(optionIndex)}
                                />
                            );
                        }
                    });

                    if (question.type === 'radio') {
                        main = (
                            <RadioGroup value={surveyResponse[index] || ''} onChange={this.handleSurveyResponse(index)}>
                                {main}
                            </RadioGroup>
                        );
                    }

                    answerSection = (
                        <div className="pl-1">
                            <FormControl required component="fieldset">
                                <FormGroup>{main}</FormGroup>
                            </FormControl>
                        </div>
                    );
                    break;
                }
                default:
                    return;
            }

            questions.push(
                <Card key={index} className="mb-2">
                    <CardContent className="survey-question">
                        <div className="mb-2">
                            {question.question}
                            {question.required ? (
                                <Typography
                                    color="primary"
                                    component="span"
                                    variant="inherit"
                                    className="inline-display ml-0-5">
                                    *
                                </Typography>
                            ) : null}
                        </div>
                        {answerSection}
                    </CardContent>
                </Card>
            );
        });

        return questions;
    };

    render() {
        const { surveyId, surveyResponse, showPostface } = this.state;
        const { auth, loading, survey } = this.props;

        const isLoading = loading[GET_SURVEY][surveyId];
        const isValid = Boolean(survey[surveyId]);

        const effectiveUserId = auth.effectiveUser;
        const mainSurvey = SurveyFormatter.show(survey[surveyId]);
        const isValidInput = mainSurvey.questions.every((question, index) => {
            const response = surveyResponse[index];
            if (!question.required) return true;

            switch (question.type) {
                case 'text':
                    return response && response.trim().length > 0;
                case 'radio': {
                    const optionIndex = parseInt(response, 10);
                    const optionMax = question.options.length;
                    return !isNaN(optionIndex) && optionIndex >= 0 && optionIndex < optionMax;
                }
                case 'checkbox': {
                    const optionSelected = isObject(response) ? Object.keys(response).filter((i) => response[i]) : [];
                    const optionMax = question.options.length;
                    return (
                        Array.isArray(optionSelected) &&
                        optionSelected.length > 0 &&
                        optionSelected.length <= optionMax &&
                        optionSelected.map((r) => parseInt(r, 10)).every((r) => !isNaN(r) && r >= 0 && r < optionMax)
                    );
                }
            }
        });

        let mainAnswer = null;
        if (
            mainSurvey &&
            isObject(mainSurvey) &&
            isObject(mainSurvey.answers) &&
            isObject(mainSurvey.answers[effectiveUserId]) &&
            Array.isArray(mainSurvey.answers[effectiveUserId].answers)
        ) {
            mainAnswer = mainSurvey.answers[effectiveUserId].answers;
        }
        const isSubmitted = Boolean(mainAnswer);

        let output = (
            <>
                <Paper className="survey-section mb-2">
                    <div className="font-larger mb-2">
                        <b>{mainSurvey.title}</b>
                    </div>
                    <div className="trans-2">{mainSurvey.preface}</div>
                </Paper>
                {this.renderQuestions(mainSurvey, isSubmitted)}
                <div className="flex-display flex-justify-center">
                    <Button
                        variant="contained"
                        color="primary"
                        disabled={!isValidInput || isSubmitted}
                        onClick={this.handleSurveySubmit}>
                        {isSubmitted ? 'Submitted' : 'Submit'}
                    </Button>
                </div>
            </>
        );

        if (showPostface) {
            const youtubeId = parseYoutube(mainSurvey.postface);
            output = (
                <>
                    <Paper className={`${youtubeId ? '' : 'survey-section'} mb-2`}>
                        {youtubeId ? (
                            <div className="pos-relative post-media">
                                <YouTube className="pos-absolute absolute-fit" videoId={youtubeId} />
                            </div>
                        ) : (
                            <div className="trans-2">{mainSurvey.postface}</div>
                        )}
                    </Paper>
                    <div className="flex-display flex-justify-center">
                        <Button variant="contained" color="primary" onClick={() => Navigation.pushAsync('/app')}>
                            Back to Feed
                        </Button>
                    </div>
                </>
            );
        }

        return (
            <MainAppLayout
                title={mainSurvey.title || 'Survey'}
                errorMessage={!isValid && !isLoading ? "The survey couldn't be loaded." : null}
                showLoading={isLoading && isValid}>
                {isValid && <div className="page-survey-response pb-3">{output}</div>}
                {isLoading && !isValid ? (
                    <div className="size-full flex-display flex-align-center flex-justify-center">
                        <CircularProgress />
                    </div>
                ) : null}
            </MainAppLayout>
        );
    }
}

const mapStateToProps = (state) => ({
    app: state.app,
    auth: state.auth,
    error: state.error,
    loading: state.loading,
    survey: state.survey,
    user: state.user
});

export default connect(
    mapStateToProps,
    { getSurvey, submitAnswers, getAnswers }
)(SurveyResponsePage);
