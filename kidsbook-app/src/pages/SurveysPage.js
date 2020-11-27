// React
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { saveAs } from 'file-saver';

// Material UI
import {
    AppBar,
    Button,
    Card,
    CardActions,
    CardContent,
    Checkbox,
    Dialog,
    FormControlLabel,
    FormGroup,
    IconButton,
    Paper,
    Radio,
    Slide,
    Switch,
    TextField,
    Toolbar,
    Tooltip,
    Typography
} from '@material-ui/core';
import { SpeedDial, SpeedDialAction } from '@material-ui/lab';
import {
    Add as AddIcon,
    CheckBox as CheckBoxIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    RadioButtonChecked as RadioButtonIcon,
    ShortText as ShortTextIcon
} from '@material-ui/icons';

// Project
import MainAppLayout from '../components/MainAppLayout';
import MaterialTable from '../components/MaterialTable';
import { UserFormatter, GroupFormatter, SurveyFormatter } from '../utils/formatter';
import isObject from 'is-object';
import { getRandomID } from '../utils/utils';
import LoadingHelper from '../utils/LoadingHelper';
import SnackBarHelper from '../utils/SnackBarHelper';
import DialogConfirm from '../utils/DialogConfirm';
import DialogHelper from '../utils/DialogHelper';
import Navigation from '../navigation';
import FormSelectSurveyTemplate from '../utils/FormSelectSurveyTemplate';
import { getAllMembers } from '../actions/groupActions';
import { CLEAR_ALL_SURVEY_ANSWER } from '../actions/';
import { stringify } from '../utils/CSVConverter';
import {
    createSurvey,
    getAllSurveys,
    clearAllAnswers,
    updateSurvey,
    getAllAnswers,
    getSurvey,
    deleteSurvey
} from '../actions/surveyActions';

// TODO: Laggy update on option input
class SurveysPage extends Component {
    state = {
        activeGroup: null,
        showCreateDialog: false,
        newSurveyEditId: null,
        newSurveyInfo: {
            title: '',
            preface: '',
            postface: ''
        },
        newSurveyOrder: [],
        newSurveyQuestions: {},
        newSurveyTemplate: null,
        newSurveyOptionHovering: null,
        newQuestionFabOpen: false,
        clearProcessing: false,
        clearError: null
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const nextGroup = nextProps.app.groupId;
        const clearProcessing = Boolean(nextProps.loading[CLEAR_ALL_SURVEY_ANSWER]);
        const clearError = Boolean(nextProps.error[CLEAR_ALL_SURVEY_ANSWER]);
        const newState = {};

        const getNext = () => {
            nextProps.getAllSurveys(nextGroup);
        };

        if (clearError !== prevState.clearError) {
            newState.clearError = clearError;
        }

        // Transition from processing to not processing
        if (clearProcessing !== prevState.clearProcessing) {
            newState.clearProcessing = clearProcessing;

            if (!clearProcessing && prevState.clearProcessing) {
                LoadingHelper.hide();
                if (!clearError) {
                    SnackBarHelper.enqueueSnackbar('Survey responses cleared successfully');
                    getNext();
                }
            }
        }

        if (nextGroup !== prevState.activeGroup) {
            newState.activeGroup = nextGroup;
            getNext();
        }

        return {
            ...prevState,
            ...newState
        };
    }

    handleOpenCreateDialog = async (isEdit, surveyId) => {
        let newState = {
            showCreateDialog: true,
            newSurveyEditId: null,
            newSurveyInfo: {
                title: '',
                preface: '',
                postface: ''
            },
            newSurveyOrder: [],
            newSurveyQuestions: {},
            newSurveyTemplate: null,
            newSurveyOptionHovering: null,
            newQuestionFabOpen: false
        };

        if (isEdit) {
            LoadingHelper.show('Loading the survey...');
            newState.newSurveyEditId = surveyId;

            await getSurvey(surveyId);
            const survey = SurveyFormatter.show(this.props.survey[surveyId]);
            const state = this.convertTemplateToForm(survey);
            newState = {
                ...newState,
                ...state
            };
            LoadingHelper.hide();
        }

        this.setState(newState);
    };

    handleCloseCreateDialog = () => {
        this.setState({
            showCreateDialog: false
        });
    };

    handleCreateSurvey = async () => {
        const { createSurvey, getAllSurveys, updateSurvey } = this.props;
        const {
            activeGroup,
            newSurveyEditId,
            newSurveyInfo,
            newSurveyOrder,
            newSurveyQuestions,
            newSurveyTemplate
        } = this.state;
        const { title, preface, postface } = newSurveyInfo;

        if (!activeGroup) return;
        const rawQuestions = newSurveyOrder.map((questionId) => newSurveyQuestions[questionId]);
        const questions = rawQuestions.map((question) => {
            const newQuestion = {
                question: question.question,
                type: question.type,
                required: String(question.required)
            };

            if (question.type !== 'text') {
                newQuestion.options = question.optionOrder.map((optionId) => question.optionText[optionId]);
            }

            return newQuestion;
        });

        // TODO: Important - example of async await on redux instead of over-engineering
        LoadingHelper.show(`${newSurveyEditId ? 'Editing' : 'Creating'} the survey`);

        let surveyId;
        if (newSurveyEditId) {
            surveyId = await updateSurvey(newSurveyEditId, title, preface, postface, questions);
        } else {
            surveyId = await createSurvey(activeGroup, title, preface, postface, questions);
        }

        LoadingHelper.hide();
        this.setState({
            showCreateDialog: false
        });
        if (!surveyId) return;

        SnackBarHelper.enqueueSnackbar(`Survey ${newSurveyEditId ? 'edited' : 'created'} successfully`);
        getAllSurveys(activeGroup);

        if (!newSurveyTemplate || !newSurveyTemplate.customUrl || newSurveyEditId) return;
        const url = newSurveyTemplate.customUrl(surveyId);
        DialogHelper.showDialog({
            title: 'Survey created',
            body: `The custom URL for this survey is: ${url}`
        });
    };

    handleSurveyInfoUpdate = ({ target }) => {
        const { newSurveyInfo } = this.state;

        this.setState({
            newSurveyInfo: {
                ...newSurveyInfo,
                [target.name]: target.value
            }
        });
    };

    handleSurveyUpdate = (id, field) => ({ target }) => {
        const { newSurveyQuestions } = this.state;
        const question = newSurveyQuestions[id];
        if (!isObject(question)) return;

        this.setState({
            newSurveyQuestions: {
                ...newSurveyQuestions,
                [id]: {
                    ...question,
                    [field]: target.checked || target.value
                }
            }
        });
    };

    handleAddNewQuestion = (type) => () => {
        if (type !== 'text' && type !== 'checkbox' && type !== 'radio') return;
        let { newSurveyOrder, newSurveyQuestions } = this.state;

        const newQuestionID = getRandomID();
        newSurveyOrder = newSurveyOrder.slice();
        newSurveyOrder.push(newQuestionID);

        const newQuestion = {
            id: newQuestionID,
            question: '',
            optionOrder: [],
            optionText: {},
            type: type,
            required: false
        };

        if (type !== 'text') {
            const newOptionID = getRandomID();
            newQuestion.optionOrder.push(newOptionID);
            newQuestion.optionText[newOptionID] = 'Option';
        }

        newSurveyQuestions = {
            ...newSurveyQuestions,
            [newQuestionID]: newQuestion
        };

        this.setState({
            newSurveyOrder,
            newSurveyQuestions
        });
    };

    handleRemoveQuestion = (id) => () => {
        let { newSurveyOrder, newSurveyQuestions } = this.state;
        const question = newSurveyQuestions[id];
        if (!isObject(question)) return;

        newSurveyOrder = newSurveyOrder.filter((question) => question !== id);
        delete newSurveyQuestions[id];

        this.setState({
            newSurveyOrder,
            newSurveyQuestions
        });
    };

    handleDragReorder = (result) => {
        // Outside of draggable
        if (!result.destination) return;

        const sourceIndex = result.source.index;
        const destIndex = result.destination.index;
        let { newSurveyOrder, newSurveyQuestions } = this.state;
        newSurveyOrder = newSurveyOrder.slice();

        // Reordering of questions
        if (result.type === 'DEFAULT') {
            const [removed] = newSurveyOrder.splice(sourceIndex, 1);
            newSurveyOrder.splice(destIndex, 0, removed);

            this.setState({
                newSurveyOrder
            });
            return;
        }

        // Reordering of options
        const questionId = result.type;
        const question = newSurveyQuestions[questionId];
        if (!question) return;

        let { optionOrder } = question;
        optionOrder = optionOrder.slice();

        const [removed] = optionOrder.splice(sourceIndex, 1);
        optionOrder.splice(destIndex, 0, removed);

        this.setState({
            newSurveyQuestions: {
                ...newSurveyQuestions,
                [questionId]: {
                    ...question,
                    optionOrder
                }
            }
        });
    };

    handleSurveyOptionUpdate = (qid, id) => ({ target }) => {
        const { newSurveyQuestions: questions } = this.state;
        const question = questions[qid];
        if (!isObject(question) || !question.optionText[id] === undefined) return;

        this.setState({
            newSurveyQuestions: {
                ...questions,
                [qid]: {
                    ...question,
                    optionText: {
                        ...question.optionText,
                        [id]: target.value
                    }
                }
            }
        });
    };

    handleAddNewOption = (id) => () => {
        const { newSurveyQuestions: questions } = this.state;
        const question = questions[id];
        if (!isObject(question)) return;

        const newOptionID = getRandomID();
        const optionOrder = question.optionOrder.slice();
        optionOrder.push(newOptionID);

        this.setState({
            newSurveyQuestions: {
                ...questions,
                [id]: {
                    ...question,
                    optionOrder,
                    optionText: {
                        ...question.optionText,
                        [newOptionID]: ''
                    }
                }
            }
        });
    };

    handleRemoveOption = (qid, id) => () => {
        const { newSurveyQuestions: questions } = this.state;
        const question = questions[qid];
        if (!isObject(question)) return;

        const optionOrder = question.optionOrder.filter((option) => option !== id);

        this.setState({
            newSurveyQuestions: {
                ...questions,
                [qid]: {
                    ...question,
                    optionOrder
                }
            }
        });
    };

    handleOptionMouseEnter = (id) => () => {
        this.setState({
            newSurveyOptionHovering: id
        });
    };

    handleOptionMouseExit = () => {
        this.setState({
            newSurveyOptionHovering: null
        });
    };

    handleOpenNewQuestionFab = () => {
        this.setState({
            newQuestionFabOpen: true
        });
    };

    handleCloseNewQuestionFab = () => {
        this.setState({
            newQuestionFabOpen: false
        });
    };

    handleClearAllAnswers = (surveyId) => {
        DialogConfirm.show(
            'Clear all responses',
            'Are you sure you want to clear all the responses? This action is irreversible.',
            (confirm) => {
                if (confirm) {
                    LoadingHelper.show('Clearing all responses...');
                    this.props.clearAllAnswers(surveyId);
                }
            }
        );
    };

    convertTemplateToForm = (template) => {
        let { title, preface, postface, questions } = template;

        title = title || '';
        preface = preface || '';
        postface = postface || '';
        if (!Array.isArray(questions)) questions = [];

        const newSurveyOrder = [];
        const newSurveyQuestions = {};

        questions.forEach((question) => {
            let { options } = question;
            if (!Array.isArray(options)) options = [];

            const questionId = getRandomID();
            newSurveyOrder.push(questionId);

            const optionOrder = [];
            const optionText = {};
            options.forEach((option) => {
                const optionId = getRandomID();
                optionOrder.push(optionId);
                optionText[optionId] = option;
            });

            const questionObject = {
                id: questionId,
                question: question.question || '',
                optionOrder: optionOrder,
                optionText: optionText,
                type: question.type,
                required: Boolean(question.required)
            };

            newSurveyQuestions[questionId] = questionObject;
        });

        return {
            newSurveyInfo: {
                title,
                preface,
                postface
            },
            newSurveyOrder,
            newSurveyQuestions
        };
    };

    handleShowTemplateDialog = () => {
        FormSelectSurveyTemplate.show((template) => {
            if (!template) return;
            const state = this.convertTemplateToForm(template);
            state.newSurveyTemplate = template;
            this.setState(state);
        });
    };

    handleTogglePinSurvey = async (surveyId) => {
        const { activeGroup } = this.state;
        const { group, survey, updateSurvey } = this.props;

        const currentGroup = GroupFormatter.show(group[activeGroup]);
        const pinnedSurveyIds = new Set(
            currentGroup.surveys
                .map((surveyId) => {
                    return SurveyFormatter.show(survey[surveyId]);
                })
                .filter((survey) => survey.isPinned)
                .map((survey) => survey.id)
        );

        let surveyPinned = pinnedSurveyIds.has(surveyId);
        if ((pinnedSurveyIds.size === 1 && !surveyPinned) || pinnedSurveyIds.size > 1) {
            SnackBarHelper.enqueueSnackbar('You can only have 1 survey pinned');
            return;
        }

        // TODO: Important - another example of async await on redux instead of over-engineering
        LoadingHelper.show(`${surveyPinned ? 'Unpinning' : 'Pinning'} the survey...`);
        await updateSurvey(surveyId, null, null, null, null, !surveyPinned);
        LoadingHelper.hide();
    };

    handleDownloadAllAnswers = async (surveyId) => {
        const { getAllMembers, getSurvey, getAllAnswers } = this.props;
        const groupId = SurveyFormatter.show(this.props.survey[surveyId]).groupId;

        LoadingHelper.show('Generating CSV file for all responses...');
        if (!(await getAllMembers(groupId)) || !(await getSurvey(surveyId)) || !(await getAllAnswers(surveyId))) {
            LoadingHelper.hide();
            return;
        }

        const { survey: surveys, user: users } = this.props;
        const currentSurvey = SurveyFormatter.show(surveys[surveyId]);
        const answers = currentSurvey.answers;
        const questions = currentSurvey.questions;

        const columns = ['Username', 'Real name'].concat(questions.map((q) => q.question));
        const processed = Object.keys(answers).map((userId) => {
            const user = UserFormatter.show(users[userId]);
            const cells = [user.email, user.realname];
            answers[userId].answers.forEach((answer, index) => {
                const question = questions[index];
                if (question.type === 'radio') {
                    answer = question.options[answer];
                } else if (question.type === 'checkbox') {
                    answer = answer.map((a) => question.options[a]).join(', ');
                }
                cells.push(String(answer));
            });
            return cells;
        });

        const raw = [columns].concat(processed);
        const csv = await stringify(raw);
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        saveAs(blob, 'answers.csv');
        LoadingHelper.hide();
    };

    handleDeleteSurvey = (surveyId) => {
        const { app, deleteSurvey, getAllSurveys } = this.props;
        DialogConfirm.show(
            'Delete survey',
            'Are you sure you want to delete this survey? This action is irreversible.',
            async (confirm) => {
                if (!confirm) return;

                LoadingHelper.show('Deleting the survey...');
                const isSuccess = await deleteSurvey(surveyId);
                LoadingHelper.hide();

                if (!isSuccess) return;
                getAllSurveys(app.groupId);
                SnackBarHelper.enqueueSnackbar('Survey deleted successfully');
            }
        );
    };

    handleTableAction = (action) => {
        switch (action.action) {
            case 'new':
                this.handleOpenCreateDialog(false);
                break;
            case 'edit':
                this.handleOpenCreateDialog(true, action.payload);
                break;
            case 'preview':
                Navigation.pushAsync(`/survey/${action.payload}/responses`);
                break;
            case 'open':
                Navigation.openAsync(`/survey/${action.payload}`);
                break;
            case 'clear':
                this.handleClearAllAnswers(action.payload);
                break;
            case 'pin':
                this.handleTogglePinSurvey(action.payload);
                break;
            case 'download':
                this.handleDownloadAllAnswers(action.payload);
                break;
            case 'deleteSingle':
                this.handleDeleteSurvey(action.payload);
                break;
            default:
                return;
        }
    };

    renderQuestions = () => {
        const { newSurveyOrder, newSurveyQuestions, newSurveyOptionHovering } = this.state;
        const questions = [];

        newSurveyOrder.forEach((questionId, questionIndex) => {
            const question = newSurveyQuestions[questionId];
            if (!isObject(question)) return;

            const getOption = (optionId) => {
                const optionText = question.optionText[optionId];

                return (
                    <FormControlLabel
                        key={optionId}
                        control={
                            question.type === 'checkbox' ? (
                                <Checkbox value={optionId} disabled={true} />
                            ) : (
                                <Radio value={optionId} disabled={true} />
                            )
                        }
                        className="survey-option width-full"
                        onMouseEnter={this.handleOptionMouseEnter(optionId)}
                        onMouseLeave={this.handleOptionMouseExit}
                        label={
                            <div className="flex-display flex-align-center">
                                <TextField
                                    name={`option-${optionId}`}
                                    placeholder="Option"
                                    type="text"
                                    InputProps={{
                                        disableUnderline: newSurveyOptionHovering !== optionId
                                    }}
                                    value={optionText}
                                    fullWidth
                                    onChange={this.handleSurveyOptionUpdate(questionId, optionId)}
                                />
                                <IconButton
                                    aria-label="Delete"
                                    onClick={this.handleRemoveOption(questionId, optionId)}
                                    disabled={question.optionOrder.length <= 1}>
                                    <CloseIcon color="action" />
                                </IconButton>
                            </div>
                        }
                    />
                );
            };

            let answerSection;
            switch (question.type) {
                case 'text':
                    answerSection = (
                        <div className="pl-1">
                            <TextField name="question" placeholder="Text" type="text" disabled={true} />
                        </div>
                    );
                    break;
                case 'checkbox':
                case 'radio':
                    answerSection = (
                        <>
                            <div className="pl-1">
                                <FormGroup>
                                    {question.optionOrder.map((optionId, optionIndex) => {
                                        return (
                                            <Draggable
                                                key={optionId}
                                                draggableId={optionId}
                                                type={questionId}
                                                index={optionIndex}>
                                                {(provided) => (
                                                    <div
                                                        ref={provided.innerRef}
                                                        {...provided.draggableProps}
                                                        {...provided.dragHandleProps}>
                                                        {getOption(optionId)}
                                                    </div>
                                                )}
                                            </Draggable>
                                        );
                                    })}
                                </FormGroup>
                            </div>
                            <div className="mt-1">
                                <Button size="small" color="primary" onClick={this.handleAddNewOption(questionId)}>
                                    Add option
                                </Button>
                            </div>
                        </>
                    );
                    break;
                default:
                    return;
            }

            questions.push(
                <Draggable key={questionId} draggableId={questionId} index={questionIndex}>
                    {(provided, snapshot) => {
                        const raised = snapshot.isDragging && !snapshot.isDropAnimating;
                        return (
                            <div
                                className={`mb-2 ${raised ? 'outline-none' : ''}`}
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}>
                                <Card raised={raised}>
                                    <CardContent className="survey-question">
                                        <div className="mb-2">
                                            <TextField
                                                name="question"
                                                placeholder="Question"
                                                value={question.question}
                                                onChange={this.handleSurveyUpdate(questionId, 'question')}
                                                type="text"
                                                fullWidth
                                            />
                                        </div>
                                        <Droppable
                                            droppableId={`survey-options-droppable-${questionId}`}
                                            type={questionId}>
                                            {(provided) => (
                                                <div ref={provided.innerRef}>
                                                    {answerSection}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </CardContent>
                                    <CardActions className="flex-display">
                                        <FormControlLabel
                                            control={
                                                <Switch
                                                    checked={question.required}
                                                    onChange={this.handleSurveyUpdate(questionId, 'required')}
                                                    color="primary"
                                                />
                                            }
                                            label="Required"
                                            className="ml-0-5"
                                        />
                                        <div className="flex-grow" />
                                        <Tooltip title="Delete">
                                            <IconButton
                                                aria-label="Delete"
                                                onClick={this.handleRemoveQuestion(questionId)}>
                                                <DeleteIcon color="action" />
                                            </IconButton>
                                        </Tooltip>
                                    </CardActions>
                                </Card>
                            </div>
                        );
                    }}
                </Draggable>
            );
        });

        return questions;
    };

    render() {
        const {
            activeGroup,
            showCreateDialog,
            newSurveyEditId,
            newQuestionFabOpen,
            newSurveyInfo,
            newSurveyOrder
        } = this.state;
        const { auth, group, survey, user } = this.props;

        const currentGroup = GroupFormatter.show(group[activeGroup]);
        const currentUser = UserFormatter.show(user[auth.realUser]);
        const isCreateValid = newSurveyOrder.length > 0;
        const allSurveys = currentGroup.surveys.map((surveyId) => {
            const newSurvey = SurveyFormatter.show(survey[surveyId]);
            newSurvey.immutable = newSurvey.responseCount > 0;
            newSurvey.pinned = newSurvey.isPinned;
            return newSurvey;
        });

        let errorMessage = null;
        if (!activeGroup) errorMessage = 'Something went wrong';
        if (!currentUser || !currentUser.isSuperuser) errorMessage = 'Access denied';

        const fields = [
            { id: 'id', numeric: false, disablePadding: true, label: 'ID' },
            { id: 'title', numeric: false, disablePadding: false, label: 'Title' },
            { id: 'responseCount', numeric: false, disablePadding: false, label: 'Response Count' }
        ];

        return (
            <MainAppLayout title="Group surveys" showGroupSelector allowSwitchGroup errorMessage={errorMessage}>
                <div className="page-surveys pb-3">
                    <Paper>
                        <MaterialTable
                            title="Surveys"
                            type="survey"
                            fields={fields}
                            data={allSurveys}
                            sort={{
                                field: 'id',
                                order: 'asc'
                            }}
                            onAction={this.handleTableAction}
                        />
                    </Paper>
                    <Dialog
                        fullScreen
                        open={showCreateDialog}
                        onClose={this.handleCloseCreateDialog}
                        TransitionComponent={Slide}
                        TransitionProps={{ direction: 'up' }}>
                        <AppBar>
                            <Toolbar>
                                <IconButton
                                    color="inherit"
                                    onClick={this.handleCloseCreateDialog}
                                    aria-label="Close"
                                    className="app-bar-action">
                                    <CloseIcon />
                                </IconButton>
                                <Typography variant="h6" color="inherit" align="left" noWrap>
                                    {newSurveyEditId ? 'Edit' : 'New'} survey
                                </Typography>
                                <div className="flex-grow" />
                                {!newSurveyEditId && (
                                    <Button color="inherit" onClick={this.handleShowTemplateDialog}>
                                        Template
                                    </Button>
                                )}
                                <Button color="inherit" onClick={this.handleCreateSurvey} disabled={!isCreateValid}>
                                    {newSurveyEditId ? 'Edit' : 'Create'}
                                </Button>
                            </Toolbar>
                        </AppBar>
                        <div className="pt-app-bar size-full pos-absolute absolute-top">
                            <div className="size-full overflow-y-auto surveys-create">
                                <div className="surveys-create-box">
                                    <Paper className="survey-section mb-2">
                                        <TextField
                                            name="title"
                                            placeholder="Title"
                                            type="text"
                                            value={newSurveyInfo.title}
                                            onChange={this.handleSurveyInfoUpdate}
                                            fullWidth
                                            className="mb-2"
                                        />
                                        <TextField
                                            name="preface"
                                            placeholder="Preface"
                                            type="text"
                                            value={newSurveyInfo.preface}
                                            onChange={this.handleSurveyInfoUpdate}
                                            fullWidth
                                            multiline
                                            rows={3}
                                            rowsMax={999}
                                            InputProps={{
                                                disableUnderline: true
                                            }}
                                        />
                                    </Paper>
                                    <DragDropContext onDragEnd={this.handleDragReorder}>
                                        <Droppable droppableId="survey-new-droppable">
                                            {(provided) => (
                                                <div ref={provided.innerRef}>
                                                    {this.renderQuestions()}
                                                    {provided.placeholder}
                                                </div>
                                            )}
                                        </Droppable>
                                    </DragDropContext>
                                    <Paper className="survey-section">
                                        <TextField
                                            name="postface"
                                            placeholder="Postface"
                                            type="text"
                                            value={newSurveyInfo.postface}
                                            onChange={this.handleSurveyInfoUpdate}
                                            fullWidth
                                            multiline
                                            rows={3}
                                            rowsMax={999}
                                            InputProps={{
                                                disableUnderline: true
                                            }}
                                        />
                                    </Paper>
                                </div>
                            </div>
                        </div>
                        <SpeedDial
                            ariaLabel="surveySpeedDial"
                            className="app-fab"
                            icon={<AddIcon />}
                            onBlur={this.handleCloseNewQuestionFab}
                            onClick={this.handleOpenNewQuestionFab}
                            onClose={this.handleCloseNewQuestionFab}
                            onFocus={this.handleOpenNewQuestionFab}
                            onMouseEnter={this.handleOpenNewQuestionFab}
                            onMouseLeave={this.handleCloseNewQuestionFab}
                            open={newQuestionFabOpen}
                            direction="up">
                            <SpeedDialAction
                                icon={<RadioButtonIcon />}
                                tooltipTitle="Radio"
                                tooltipOpen={newQuestionFabOpen}
                                onClick={this.handleAddNewQuestion('radio')}
                            />
                            <SpeedDialAction
                                icon={<CheckBoxIcon />}
                                tooltipTitle="Checkbox"
                                tooltipOpen={newQuestionFabOpen}
                                onClick={this.handleAddNewQuestion('checkbox')}
                            />
                            <SpeedDialAction
                                icon={<ShortTextIcon />}
                                tooltipTitle="Text"
                                tooltipOpen={newQuestionFabOpen}
                                onClick={this.handleAddNewQuestion('text')}
                            />
                        </SpeedDial>
                    </Dialog>
                </div>
            </MainAppLayout>
        );
    }
}

const mapStateToProps = (state) => ({
    app: state.app,
    auth: state.auth,
    error: state.error,
    group: state.group,
    loading: state.loading,
    survey: state.survey,
    user: state.user
});

export default connect(
    mapStateToProps,
    {
        createSurvey,
        getAllSurveys,
        clearAllAnswers,
        updateSurvey,
        getAllMembers,
        getAllAnswers,
        getSurvey,
        deleteSurvey
    }
)(SurveysPage);
