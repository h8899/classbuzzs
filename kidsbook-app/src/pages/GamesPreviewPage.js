// React
import React, { Component } from 'react';
import { connect } from 'react-redux';

// Material UI
import {
    CircularProgress,
    IconButton,
    List,
    ListItem,
    ListItemText,
    Paper,
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
import { GameFormatter, UserFormatter } from '../utils/formatter';
import isObject from 'is-object';
import { getAllMembers } from '../actions/groupActions';
import { getGame } from '../actions/gameActions';
import { GET_GAME, GET_ALL_MEMBERS } from '../actions/';

class GamesPreviewPage extends Component {
    state = {
        gameId: null,
        activeAnswer: null,
        index: -1,
        showList: false,
        getProcessing: false,
        getError: null
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const gameId = nextProps.match.params.gameId;
        const getProcessing = Boolean(nextProps.loading[GET_GAME]);
        const getError = Boolean(nextProps.error[GET_GAME]);

        const game = GameFormatter.show(nextProps.game[gameId]);
        const answers = Object.keys(game.allAnswers).map((userId) => game.allAnswers[userId]);
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

        if (gameId !== prevState.gameId) {
            newState.gameId = gameId;
            if (gameId) {
                nextProps.getGame(gameId);
                updateActiveAnswer();
            }
        }

        if (getError !== prevState.getError) {
            newState.getError = getError;
        }

        // Transition from processing to not processing
        if (getProcessing !== prevState.getProcessing) {
            newState.getProcessing = getProcessing;

            if (!getProcessing && prevState.getProcessing && !getError) {
                updateActiveAnswer();
                if (game.group) nextProps.getAllMembers(game.group);
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

    getGameAnswers = () => {
        const { gameId } = this.state;
        const game = GameFormatter.show(this.props.game[gameId]);

        return Object.keys(game.allAnswers).map((userId) => ({
            user: UserFormatter.show(this.props.user[userId]),
            answers: game.allAnswers[userId]
        }));
    };

    switchAnswer = (index) => {
        const answers = this.getGameAnswers();
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

    replacePlaceholder = (text, mainUser) => {
        const { username } = mainUser;
        return String(text)
            .split('<player>')
            .join(username);
    };

    generateMessages = (mainGame, mainUser, userAnswers) => {
        const { scenes, firstScene } = mainGame;
        const { answers, ending } = userAnswers;
        const messages = [];
        let endingMessage = null;

        let currentScene = scenes[firstScene];
        let index = 0;

        while (currentScene) {
            const answer = answers[index++];
            const { dialogue } = currentScene;
            if (!Array.isArray(dialogue)) break;

            if (currentScene.isEnd) {
                if (!ending) break;
                for (let i = 0; i < dialogue.length; i++) {
                    const { tag, speech } = dialogue[i];
                    if (tag === ending) endingMessage = speech;
                }
            } else {
                currentScene.dialogue.forEach((dialog) => {
                    messages.push({
                        name: dialog.name,
                        message: this.replacePlaceholder(dialog.speech, mainUser),
                        direction: 'left'
                    });
                });
            }

            if (!Array.isArray(currentScene.choices) || !currentScene.choices[answer]) break;
            const selectedChoice = currentScene.choices[answer];
            if (!isObject(selectedChoice)) break;

            messages.push({
                name: '',
                message: this.replacePlaceholder(selectedChoice.text, mainUser),
                direction: 'right',
                tag: selectedChoice.tag
            });
            currentScene = scenes[selectedChoice.pathway];
        }

        return {
            messages: messages,
            endingMessage: endingMessage
        };
    };

    renderGame = (mainGame, mainUser, userAnswers) => {
        if (!mainGame) return;
        const { messages, endingMessage } = this.generateMessages(mainGame, mainUser, userAnswers);

        return (
            <div className="games-conversation">
                {mainGame.preface && (
                    <div className="games-system font-small">
                        {this.replacePlaceholder(mainGame.preface, mainUser)
                            .split('\n')
                            .map((line, i) => {
                                return (
                                    <span key={i}>
                                        {line}
                                        <br />
                                    </span>
                                );
                            })}
                    </div>
                )}
                {messages.map((message, index) => (
                    <div key={index} className={`message-wrapper${message.direction === 'right' ? '-right' : ''}`}>
                        <div className="message-box">
                            {message.name && (
                                <div className="message-name font-small">
                                    <b>{message.name}</b>
                                </div>
                            )}
                            <div className="message-contents font-small">{message.message}</div>
                            {message.direction === 'right' && (
                                <div className="message-tag font-small">
                                    <b>{message.tag}</b>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {endingMessage && (
                    <div className="games-system font-small">
                        {this.replacePlaceholder(endingMessage, mainUser)
                            .split('\n')
                            .map((line, i) => {
                                return (
                                    <span key={i}>
                                        {line}
                                        <br />
                                    </span>
                                );
                            })}
                    </div>
                )}
                <div className="height-spacer pb-2" />
            </div>
        );
    };

    render() {
        const { index, gameId, showList } = this.state;
        const { app, auth, game, loading, user } = this.props;
        const currentUser = user[auth.realUser];
        const { groupId } = app;

        const allAnswers = this.getGameAnswers();
        const mainAnswer = allAnswers[index];

        // TODO: The viewing group might not be the group of the game?
        const isLoading = loading[GET_GAME] || loading[GET_ALL_MEMBERS][groupId];
        const isValid = Boolean(game[gameId]) && isObject(mainAnswer) && isObject(mainAnswer.user);

        const mainGame = GameFormatter.show(game[gameId]);
        const gotAnswers = allAnswers.length > 0;

        const errorMessage =
            !currentUser || !currentUser.isSuperuser
                ? 'Access denied'
                : !isLoading && !gotAnswers
                    ? 'No responses available for this game'
                    : !isLoading && !isValid
                        ? "The game couldn't be loaded." // TODO: This state cannot be reached
                        : null;

        return (
            <MainAppLayout
                title={mainGame.title || 'Game'}
                errorMessage={errorMessage}
                showLoading={isLoading && isValid}>
                <div
                    className={`anim-slower page-game-preview pb-3 ${showList ? 'is-split-mode' : ''} ${
                        isLoading && !isValid ? 'none-display' : ''
                    }`}>
                    {isValid && this.renderGame(mainGame, mainAnswer.user, mainAnswer.answers)}
                    <Paper className="anim-slower game-bar" elevation={2}>
                        {isValid && (
                            <div className="game-bar-left">
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
                        <div className="game-bar-center">
                            <Tooltip title="Previous answer" onClick={this.handlePrevClick}>
                                <IconButton>
                                    <ChevronLeftIcon />
                                </IconButton>
                            </Tooltip>
                            <Typography className="flex-show">
                                {index + 1}
                                <span className="game-answer-count trans-2 font-smaller"> / {allAnswers.length}</span>
                            </Typography>
                            <Tooltip title="Next answer" onClick={this.handleNextClick}>
                                <IconButton>
                                    <ChevronRightIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                        <div className="game-bar-right">
                            <Tooltip title="Open list">
                                <IconButton onClick={this.handleListOpen}>
                                    <ViewListIcon />
                                </IconButton>
                            </Tooltip>
                        </div>
                    </Paper>
                    <Paper className="anim-slower pt-app-bar game-list" elevation={3}>
                        <div className="size-full overflow-y-auto">
                            <List>
                                {allAnswers.map(({ user, answers }, i) => (
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
                                            secondary={
                                                answers.ending
                                                    ? answers.ending === '<equal>'
                                                        ? 'No category'
                                                        : answers.ending
                                                    : 'Incomplete'
                                            }
                                            secondaryTypographyProps={{ className: 'line-compact', noWrap: true }}
                                        />
                                    </ListItem>
                                ))}
                            </List>
                        </div>
                        <div className="anim-slower game-list-action">
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
    game: state.game,
    loading: state.loading,
    user: state.user
});

export default connect(
    mapStateToProps,
    { getGame, getAllMembers }
)(GamesPreviewPage);
