// React
import React, { Component } from 'react';
import { connect } from 'react-redux';

// Material UI
import {
    Card,
    CardContent,
    Checkbox,
    CircularProgress,
    FormControl,
    FormControlLabel,
    FormGroup,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
    Radio,
    RadioGroup,
    TextField,
    Tooltip,
    Typography
} from '@material-ui/core';
import {
    ChevronLeft as ChevronLeftIcon,
    ChevronRight as ChevronRightIcon,
    Close as CloseIcon,
    ViewList as ViewListIcon
} from '@material-ui/icons';

// Project
import Avatar from '../components/Avatar';
import MainAppLayout from '../components/MainAppLayout';
import { SurveyFormatter, UserFormatter } from '../utils/formatter';
import isObject from 'is-object';
import { getAllMembers } from '../actions/groupActions';
import { getSurvey, getAllAnswers } from '../actions/surveyActions';
import { GET_SURVEY, GET_ALL_SURVEY_ANSWER, GET_ALL_MEMBERS } from '../actions/';

class SurveyPreviewPage extends Component {
    state = {
        surveyId: null,
        activeAnswer: null,
        index: -1,
        showList: false,
        getAllProcessing: false,
        getAllError: null
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const surveyId = nextProps.match.params.surveyId;
        const getAllProcessing = Boolean(nextProps.loading[GET_ALL_SURVEY_ANSWER]);
        const getAllError = Boolean(nextProps.error[GET_ALL_SURVEY_ANSWER]);

        const survey = SurveyFormatter.show(nextProps.survey[surveyId]);
        const answers = Object.keys(survey.answers).map((userId) => survey.answers[userId].answers);
        const newState = {};

        const updateActiveAnswer = () => {
            if (answers.length <= 0) {
                newState.index = -1;
                newState.activeAnswer = null;
            } else {
                newState.index = 0;
                newState.activeAnswer = answers[0];
            }
        };

        if (surveyId !== prevState.surveyId) {
            newState.surveyId = surveyId;
            if (surveyId) {
                nextProps.getSurvey(surveyId);
                nextProps.getAllAnswers(surveyId);
                updateActiveAnswer();
            }
        }

        if (getAllError !== prevState.getAllError) {
            newState.getAllError = getAllError;
        }

        // Transition from processing to not processing
        if (getAllProcessing !== prevState.getAllProcessing) {
            newState.getAllProcessing = getAllProcessing;

            if (!getAllProcessing && prevState.getAllProcessing && !getAllError) {
                updateActiveAnswer();
                if (survey.groupId) nextProps.getAllMembers(survey.groupId);
            }
        }

        return {
            ...prevState,
            ...newState
        };
    }

    handleListOpen = () => {
        this.setState({ showList: true });
    };

    handleListClose = () => {
        this.setState({ showList: false });
    };

    handleAnswerSelect = (index) => () => {
        this.switchAnswer(index);
    };

    handleNextClick = () => {
        this.switchAnswer(this.state.index + 1);
    };

    handlePrevClick = () => {
        this.switchAnswer(this.state.index - 1);
    };

    getSurveyAnswers = () => {
        const { surveyId } = this.state;
        const survey = SurveyFormatter.show(this.props.survey[surveyId]);

        return Object.keys(survey.answers).map((userId) => ({
            user: UserFormatter.show(this.props.user[userId]),
            answers: survey.answers[userId].answers
        }));
    };

    switchAnswer = (index) => {
        const answers = this.getSurveyAnswers();
        const newIndex = Math.min(answers.length - 1, Math.max(0, index));
        const newAnswer = answers[newIndex].answers;

        this.setState((state) => {
            if (newIndex === state.index && newAnswer === state.activeAnswer) return;
            return {
                index: newIndex,
                activeAnswer: newAnswer
            };
        });
    };

    renderQuestions = (survey) => {
        const questions = [];
        const response = {};

        let { activeAnswer: answer } = this.state;
        if (!isObject(answer)) return null;

        answer.forEach((a, index) => {
            if (Array.isArray(a)) {
                const options = {};
                a.forEach((i) => (options[i] = true));
                response[index] = options;
            } else {
                response[index] = String(a);
            }
        });

        survey.questions.forEach((question, index) => {
            if (!isObject(question)) return;

            let answerSection;
            switch (question.type) {
                case 'text':
                    answerSection = (
                        <div className="pl-1">
                            <TextField name="question" placeholder="Text" type="text" value={response[index] || ''} />
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
                                            checked={response[index] ? response[index][optionIndex] || false : false}
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
                                    control={<Radio color="primary" />}
                                    className="survey-option"
                                    label={option}
                                    value={String(optionIndex)}
                                />
                            );
                        }
                    });

                    if (question.type === 'radio') {
                        main = <RadioGroup value={response[index] || ''}>{main}</RadioGroup>;
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
        const { index, surveyId, showList } = this.state;
        const { app, auth, loading, survey, user } = this.props;
        const currentUser = user[auth.realUser];
        const { groupId } = app;

        const allAnswers = this.getSurveyAnswers();
        const mainAnswer = allAnswers[index];

        const isLoading =
            loading[GET_SURVEY][surveyId] || loading[GET_ALL_SURVEY_ANSWER] || loading[GET_ALL_MEMBERS][groupId];
        const isValid = Boolean(survey[surveyId]) && isObject(mainAnswer) && isObject(mainAnswer.user);

        const mainSurvey = SurveyFormatter.show(survey[surveyId]);
        const gotAnswers = allAnswers.length > 0;

        const errorMessage =
            !currentUser || !currentUser.isSuperuser
                ? 'Access denied'
                : !isLoading && !gotAnswers
                    ? 'No responses available for this survey'
                    : !isLoading && !isValid
                        ? "The survey couldn't be loaded."
                        : null;

        let output = (
            <>
                <Paper className="survey-section mb-2">
                    <div className="font-larger mb-2">
                        <b>{mainSurvey.title}</b>
                    </div>
                    <div className="trans-2">{mainSurvey.preface}</div>
                </Paper>
                {this.renderQuestions(mainSurvey)}
            </>
        );

        return (
            <MainAppLayout
                title={mainSurvey.title || 'Survey'}
                errorMessage={errorMessage}
                showLoading={isLoading && isValid}>
                <div
                    className={`anim-slower page-survey-preview pb-3 ${showList ? 'is-split-mode' : ''} ${
                        isLoading && !isValid ? 'none-display' : ''
                    }`}>
                    {output}
                    <Paper className="anim-slower survey-bar" elevation={2}>
                        {isValid && (
                            <div className="survey-bar-left">
                                <Avatar src={mainAnswer.user.photo} text={mainAnswer.user.username} />
                                <div className="ml-1 overflow-hidden flex-display flex-align-end">
                                    <Typography className="line-compact inline-display font-smallest mr-0-5">
                                        Submitted by
                                    </Typography>
                                    <Typography noWrap color="primary" className="line-compact inline-display">
                                        <b>{mainAnswer.user.username}</b>
                                    </Typography>
                                </div>
                            </div>
                        )}
                        <div className="survey-bar-center">
                            <Tooltip title="Previous answer" onClick={this.handlePrevClick}>
                                <IconButton>
                                    <ChevronLeftIcon />
                                </IconButton>
                            </Tooltip>
                            <Typography className="flex-show">
                                {index + 1}
                                <span className="survey-answer-count trans-2 font-smaller"> / {allAnswers.length}</span>
                            </Typography>
                            <Tooltip title="Next answer" onClick={this.handleNextClick}>
                                <IconButton>
                                    <ChevronRightIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                        <div className="survey-bar-right">
                            <Tooltip title="Open list">
                                <IconButton onClick={this.handleListOpen}>
                                    <ViewListIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </Paper>
                    <Paper className="anim-slower pt-app-bar survey-list" elevation={3}>
                        <div className="size-full overflow-y-auto">
                            <List>
                                {allAnswers.map(({ user }, i) => (
                                    <ListItem
                                        button
                                        key={i}
                                        onClick={this.handleAnswerSelect(i)}
                                        selected={i === index}>
                                        <Typography className="mr-1">{i + 1}</Typography>
                                        <Avatar src={user.photo} text={user.username} />
                                        <ListItemText
                                            primary={user.username}
                                            primaryTypographyProps={{ className: 'line-pi', noWrap: true }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </div>
                        <div className="anim-slower survey-list-action">
                            <IconButton onClick={this.handleListClose}>
                                <CloseIcon />
                            </IconButton>
                        </div>
                    </Paper>
                </div>
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
    { getSurvey, getAllAnswers, getAllMembers }
)(SurveyPreviewPage);
