// React
import React, { Component } from 'react';
import { connect } from 'react-redux';

// Chart
import { PieChart, Pie, Legend, Tooltip, Cell, ResponsiveContainer } from 'recharts';
import ColorConvert from 'color-convert';

// Material UI
import {
    AppBar,
    Avatar,
    Button,
    CircularProgress,
    Dialog,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemSecondaryAction,
    ListItemText,
    Slide,
    TextField,
    Toolbar,
    Typography
} from '@material-ui/core';
import {
    Add as AddIcon,
    Chat as ChatIcon,
    Close as CloseIcon,
    Delete as DeleteIcon,
    PieChart as PieChartIcon,
    RemoveRedEye as PreviewIcon
} from '@material-ui/icons';

// Project
import { GET_ALL_GAMES } from '../actions/';
import MainAppLayout from '../components/MainAppLayout';
import {
    uploadGame,
    getAllGames,
    getGameNextScene,
    updateGameAnswer,
    getGame,
    getGameAnswer,
    deleteGame
} from '../actions/gameActions';
import LoadingHelper from '../utils/LoadingHelper';
import { GroupFormatter, GameFormatter, UserFormatter } from '../utils/formatter';
import { timeoutDelay, getRandomID } from '../utils/utils';
import Navigation from '../navigation';
import SnackBarHelper from '../utils/SnackBarHelper';
import DialogConfirm from '../utils/DialogConfirm';

class PieStats extends Component {
    generateColors = () => {
        const { data } = this.props;
        const n = data.length;
        const baseHex = 'C60000';
        const baseHSL = ColorConvert.hex.hsl(baseHex);
        const baseHue = baseHSL[0];
        const colors = [];

        colors.push(`#${baseHex}`);
        const step = 240 / n;

        for (let i = 1; i < n; ++i) {
            const nextColor = baseHSL.slice(0);
            nextColor[0] = (baseHue + step * i) % 240;
            colors.push(`#${ColorConvert.hsl.hex(nextColor)}`);
        }

        return colors;
    };

    renderLabel = (row) => {
        if (row.value <= 0) return null;
        return row.name;
    };

    render() {
        const colors = this.generateColors();
        const { data } = this.props;

        return (
            <ResponsiveContainer>
                <PieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        outerRadius={80}
                        innerRadius={50}
                        animationBegin={0}
                        animationDuration={500}
                        fill="#C60000"
                        label={this.renderLabel}>
                        {this.props.data.map((row, index) => (
                            <Cell key={row.id} fill={colors[index]} />
                        ))}
                    </Pie>
                    <Legend />
                    <Tooltip />
                </PieChart>
            </ResponsiveContainer>
        );
    }
}

class GamesPage extends Component {
    state = {
        activeGroup: null,
        selectedGame: null,
        enableStats: false,
        showTyping: false,
        stats: {},
        totalResponses: 0,
        started: false,
        messages: [],
        choices: [],
        ending: null,
        asyncId: null,
        gameFile: null,
        gameTitle: '',
        gamePreface: '',
        gameThreshold: 1,
        showCreateDialog: false,
        isLoadingOne: false
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        const nextGroup = nextProps.app.groupId;
        const newState = {};

        const getNext = () => {
            nextProps.getAllGames(nextGroup);
        };

        if (nextGroup !== prevState.activeGroup) {
            newState.activeGroup = nextGroup;
            newState.selectedGame = null;
            newState.enableStats = false;
            newState.stats = {};
            newState.totalResponses = 0;
            newState.started = false;
            newState.messages = [];
            newState.choices = [];
            newState.ending = null;
            newState.asyncId = null;
            newState.isLoadingOne = false;
            getNext();
        }

        return {
            ...prevState,
            ...newState
        };
    }

    constructor(props) {
        super(props);
        this.uploadRef = React.createRef();
    }

    componentWillUnmount() {
        this.setState({
            asyncId: null
        });
    }

    replacePlaceholder = (raw) => {
        const { auth, user } = this.props;
        const { username } = UserFormatter.show(user[auth.effectiveUser]);
        return String(raw)
            .split('<player>')
            .join(username);
    };

    showMessageHistory = async (gameId) => {
        const { game } = this.props;
        const currentGame = GameFormatter.show(game[gameId]);
        const { answers, currentScene, scenes, scenesOrder } = currentGame;
        const messages = [];

        const currentSceneIndex = scenesOrder.indexOf(currentScene);
        if (currentSceneIndex < 0) return;

        let partOfAnswers = answers.slice(answers.length - currentSceneIndex, answers.length);
        if (partOfAnswers.length < currentSceneIndex) {
            partOfAnswers = new Array(currentSceneIndex - partOfAnswers.length).fill(-1).concat(partOfAnswers);
        }

        scenesOrder
            .slice(0, currentSceneIndex)
            .map((sceneId) => scenes[sceneId])
            .filter((s) => s)
            .forEach((scene, index) => {
                scene.dialogue.forEach((dialog) => {
                    messages.push({
                        name: dialog.name,
                        message: this.replacePlaceholder(dialog.speech),
                        direction: 'left'
                    });
                });
                const answer = partOfAnswers[index];
                if (answer < 0) return;
                // TODO: Can also use pathway!
                scene.choices.forEach((choice, index) => {
                    if (index !== answer) return;
                    messages.push({
                        name: '',
                        message: this.replacePlaceholder(choice.text),
                        direction: 'right',
                        tag: choice.tag
                    });
                });
            });

        await this.setStateAsync({
            messages: messages
        });
    };

    showNewMessage = async (gameId, asyncId) => {
        const { auth, game, updateGameAnswer } = this.props;
        const currentGame = GameFormatter.show(game[gameId]);
        const { currentScene, scenes } = currentGame;

        const scene = scenes[currentScene];
        if (!scene) return;
        const { dialogue, choices } = scene;

        if (scene.isEnd) {
            let ending = currentGame.ending;
            if (!ending) {
                const newResult = await updateGameAnswer(gameId, auth.effectiveUser, currentGame.answers);
                if (newResult && newResult.ending) ending = newResult.ending;
            }
            for (let i = 0; i < dialogue.length; i++) {
                const { tag, speech } = dialogue[i];
                if (tag !== ending || this.state.asyncId !== asyncId) continue;
                await this.setStateAsync({ ending: speech });
                await this.scrollToBottom(asyncId);
            }
            return;
        }

        for (let i = 0; i < dialogue.length; i++) {
            const { name, speech } = dialogue[i];
            const typingTime = Math.max(1000, speech.length * 50) + (i > 0 ? 2000 : 0);
            const newMessage = {
                name: name,
                message: this.replacePlaceholder(speech),
                direction: 'left'
            };
            await timeoutDelay(typingTime);
            if (this.state.asyncId !== asyncId) return;
            await this.setStateAsync((state) => {
                const { messages } = state;
                const newMessages = [...messages, newMessage];
                return { messages: newMessages };
            });
            this.scrollToBottom(asyncId);
        }

        await timeoutDelay(3000);
        if (this.state.asyncId !== asyncId) return;
        await this.setStateAsync(() => {
            return { choices: choices };
        });
        this.scrollToBottom(asyncId);
    };

    loadOnce = async (gameId) => {
        const { auth } = this.props;
        const asyncId = getRandomID();
        await this.setStateAsync({ showTyping: true, asyncId: asyncId });
        await this.showMessageHistory(gameId);
        this.scrollToBottom(asyncId);

        if (this.state.asyncId !== asyncId) return;
        await this.props.getGameAnswer(gameId, auth.effectiveUser);

        if (this.state.asyncId !== asyncId) return;
        await this.showMessageHistory(gameId);
        this.scrollToBottom(asyncId);

        await this.loadNext(gameId);
    };

    loadNext = async (gameId) => {
        const asyncId = getRandomID();
        await this.setStateAsync({ showTyping: true, asyncId: asyncId });
        await this.props.getGameNextScene(gameId);

        if (this.state.asyncId !== asyncId) return;
        await this.showMessageHistory(gameId);
        this.scrollToBottom(asyncId);

        if (this.state.asyncId !== asyncId) return;
        await this.showNewMessage(gameId, asyncId);

        if (this.state.asyncId !== asyncId) return;
        await this.setStateAsync({ showTyping: false });
    };

    loadStats = (gameId) => {
        const { game } = this.props;
        const currentGame = GameFormatter.show(game[gameId]);
        const stats = [];
        let totalResponses = 0;
        if (currentGame) {
            const { endStats } = currentGame;
            Object.keys(endStats).forEach((key) => {
                const value = endStats[key];
                totalResponses += value;
                if (key === '<equal>') key = 'No category';
                stats.push({
                    id: key,
                    name: key,
                    value: value
                });
            });
        }

        this.setState({
            stats: stats,
            totalResponses: totalResponses
        });
    };

    handleCSVUpload = () => {
        this.uploadRef.current.click();
    };

    handleUpload = ({ target }) => {
        if (target && target.files && target.files[0]) {
            this.setState({
                gameFile: target.files[0],
                gameTitle: '',
                gamePreface: '',
                gameThreshold: 1,
                showCreateDialog: true
            });
            target.value = ''; // Reset so user can reupload the same filename
        }
    };

    handleToggleStats = (gameId) => async () => {
        const { selectedGame, enableStats } = this.state;
        const { app, getAllGames } = this.props;
        const { groupId } = app;

        if (enableStats && selectedGame === gameId) {
            this.handleOpenGame(gameId)();
        } else {
            const asyncId = getRandomID();
            this.loadStats(gameId);
            this.setState({
                enableStats: true,
                selectedGame: gameId,
                asyncId: asyncId,
                isLoadingOne: false
            });
            await getAllGames(groupId);

            if (this.state.asyncId !== asyncId) return;
            this.loadStats(gameId);
        }
    };

    handleOpenGame = (gameId) => async () => {
        if (gameId === this.state.selectedGame && !this.state.enableStats) return;

        const asyncId = getRandomID();
        this.setState({
            selectedGame: gameId,
            showTyping: false,
            enableStats: false,
            stats: {},
            totalResponses: 0,
            started: false,
            messages: [],
            choices: [],
            ending: null,
            asyncId: asyncId,
            isLoadingOne: true
        });
        await this.props.getGameAnswer(gameId, this.props.auth.effectiveUser);

        if (this.state.asyncId !== asyncId) return;
        const currentGame = GameFormatter.show(this.props.game[gameId]);
        const started = currentGame.answers.length > 0;
        this.setState({ isLoadingOne: false });
        if (started) this.handleStartGame(gameId, true)();
    };

    handleCloseGame = () => {
        this.setState({
            selectedGame: null,
            enableStats: false,
            asyncId: null,
            isLoadingOne: false
        });
    };

    handleStartGame = (gameId, forced) => () => {
        if (!forced && this.state.started) return;
        this.setState({ started: true });
        this.loadOnce(gameId);
    };

    handleDeleteGame = () => {
        const { selectedGame } = this.state;
        const { deleteGame } = this.props;

        DialogConfirm.show(
            'Delete game',
            'Are you sure you want to delete this game? This action is irreversible.',
            async (confirm) => {
                if (!confirm) return;

                LoadingHelper.show('Deleting the game...');
                const isSuccess = await deleteGame(selectedGame);
                LoadingHelper.hide();

                if (!isSuccess) return;
                this.setState({
                    selectedGame: null,
                    enableStats: false,
                    asyncId: null
                });
                SnackBarHelper.enqueueSnackbar('Game deleted successfully');
            }
        );
    };

    handleAnswer = (index) => async () => {
        const { selectedGame } = this.state;
        const { auth, game, updateGameAnswer } = this.props;
        const currentGame = GameFormatter.show(game[selectedGame]);
        const { answers, currentScene, scenes } = currentGame;

        const scene = scenes[currentScene];
        if (!scene) return;

        const choice = scene.choices[index];
        const newMessage = {
            name: '',
            message: this.replacePlaceholder(choice.text),
            direction: 'right',
            tag: choice.tag
        };
        this.setState((state) => {
            const { messages } = state;
            const newMessages = [...messages, newMessage];

            return {
                showTyping: true,
                messages: newMessages
            };
        });

        const asyncId = getRandomID();
        this.setState({ asyncId: asyncId, choices: [] });

        const newAnswers = answers.concat([index]);
        await updateGameAnswer(selectedGame, auth.effectiveUser, newAnswers);
        if (this.state.asyncId !== asyncId) return;

        this.loadNext(selectedGame);
    };

    setStateAsync = (fn) => {
        return new Promise((resolve) => {
            this.setState(fn, resolve);
        });
    };

    scrollToBottom = (asyncId) => {
        if (asyncId && this.state.asyncId !== asyncId) return;
        window.scrollTo(0, 1e10);
    };

    handleCloseCreateDialog = () => {
        this.setState({
            showCreateDialog: false
        });
    };

    handleCreateFieldChange = ({ target }) => {
        this.setState({
            [target.name]: target.value
        });
    };

    handleCreateGame = async () => {
        const { gameFile, gameTitle, gamePreface, gameThreshold } = this.state;
        LoadingHelper.show('Uploading CSV file, this may take a while');
        await this.props.uploadGame(this.state.activeGroup, gameFile, gameTitle, gamePreface, gameThreshold);
        LoadingHelper.hide();
        this.setState({ showCreateDialog: false });
    };

    handleViewAllResponses = (gameId) => () => {
        Navigation.pushAsync(`/games/${gameId}/responses`);
    };

    render() {
        const { auth, game, group, loading, user } = this.props;
        const {
            activeGroup,
            selectedGame,
            enableStats,
            showTyping,
            stats,
            totalResponses,
            started,
            messages,
            choices,
            ending,
            showCreateDialog,
            gameTitle,
            gamePreface,
            gameThreshold,
            isLoadingOne
        } = this.state;

        const isSuperuser = UserFormatter.show(user[auth.realUser]).isSuperuser;
        const isLoadingAll = loading[GET_ALL_GAMES];
        const isShowTag = Boolean(ending);

        const games = GroupFormatter.show(group[activeGroup]).games.map((gameId) => GameFormatter.show(game[gameId]));
        const currentGame = games.filter((game) => game.id === selectedGame)[0];

        return (
            <MainAppLayout
                title="Games"
                showGroupSelector
                allowSwitchGroup
                showLoading={isLoadingAll}
                disableScroll={!selectedGame}>
                <div
                    className={`page-games anim-slower ${selectedGame ? 'is-game-selected' : 'overflow-hidden'} ${
                        enableStats ? 'is-enable-stats' : ''
                    }`}>
                    <div className="pt-app-bar games-top-bar anim-slower">
                        <div className="games-sub-bar">
                            <div className="games-sub-title pl-2">{currentGame ? currentGame.title : ''}</div>
                            {isSuperuser && enableStats && (
                                <>
                                    <IconButton
                                        aria-label="View all responses"
                                        onClick={this.handleViewAllResponses(selectedGame)}>
                                        <PreviewIcon color="action" />
                                    </IconButton>
                                    <IconButton aria-label="Delete game" onClick={this.handleDeleteGame}>
                                        <DeleteIcon color="action" />
                                    </IconButton>
                                </>
                            )}
                            <IconButton aria-label="Close" onClick={this.handleCloseGame}>
                                <CloseIcon color="action" />
                            </IconButton>
                        </div>
                    </div>
                    {!isLoadingOne && (
                        <div className={`games-conversation ${selectedGame && !enableStats ? '' : 'none-display'}`}>
                            {currentGame && currentGame.preface && (
                                <div className="games-system font-small">
                                    {this.replacePlaceholder(currentGame.preface)
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
                            {!started && (
                                <div className="text-center pt-2 pb-2">
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={this.handleStartGame(selectedGame)}>
                                        Start Game
                                    </Button>
                                </div>
                            )}
                            {messages.map((message, index) => (
                                <div
                                    key={index}
                                    className={`message-wrapper${message.direction === 'right' ? '-right' : ''}`}>
                                    <div className="message-box">
                                        {message.name && (
                                            <div className="message-name font-small">
                                                <b>{message.name}</b>
                                            </div>
                                        )}
                                        <div className="message-contents font-small">{message.message}</div>
                                        {isShowTag && message.direction === 'right' && (
                                            <div className="message-tag font-small">
                                                <b>{message.tag}</b>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                            {!ending && (
                                <div className={`message-wrapper ${showTyping ? 'pb-5' : 'invisible'}`}>
                                    <div className="message-box">
                                        <div className="message-contents font-small">
                                            <div className="message-typing">
                                                <div className="message-typing-dot" />
                                                <div className="message-typing-dot" />
                                                <div className="message-typing-dot" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            <div className={`games-input ${choices.length <= 0 ? 'none-display' : ''}`}>
                                {choices.map((choice, index) => (
                                    <Button
                                        key={index}
                                        variant="outlined"
                                        color="primary"
                                        className="games-input-choice"
                                        onClick={this.handleAnswer(index)}>
                                        {choice.text}
                                    </Button>
                                ))}
                            </div>
                            {ending && (
                                <div className="games-system font-small">
                                    {this.replacePlaceholder(ending)
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
                    )}
                    <div className="games-list pt-app-bar anim-slower overflow-y-auto">
                        <List>
                            {games.map((game) => (
                                <ListItem
                                    button
                                    onClick={this.handleOpenGame(game.id)}
                                    selected={selectedGame === game.id}
                                    key={game.id}>
                                    <ListItemAvatar>
                                        <Avatar>
                                            <ChatIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography className="line-compact" noWrap>
                                                <b>{game.title}</b>
                                            </Typography>
                                        }
                                    />
                                    {isSuperuser && (
                                        <ListItemSecondaryAction>
                                            <IconButton
                                                aria-label="View stats"
                                                onClick={this.handleToggleStats(game.id)}>
                                                <PieChartIcon
                                                    color={
                                                        selectedGame === game.id && enableStats ? 'primary' : 'action'
                                                    }
                                                />
                                            </IconButton>
                                        </ListItemSecondaryAction>
                                    )}
                                </ListItem>
                            ))}
                            {isSuperuser && (
                                <ListItem button onClick={this.handleCSVUpload} selected={false}>
                                    <ListItemAvatar>
                                        <Avatar>
                                            <AddIcon />
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Typography className="line-compact" noWrap>
                                                <b>Upload new game</b>
                                            </Typography>
                                        }
                                    />
                                </ListItem>
                            )}
                            <label htmlFor="games-upload" ref={this.uploadRef} className="none-display" />
                            <input
                                accept=".csv"
                                id="games-upload"
                                multiple
                                type="file"
                                className="none-display"
                                onChange={this.handleUpload}
                            />
                        </List>
                    </div>
                    {isLoadingOne && (
                        <div className="games-stats pt-app-bar">
                            <CircularProgress />
                        </div>
                    )}
                    {selectedGame && enableStats && (
                        <div className="games-stats pt-app-bar">
                            <div className="games-stats-inner size-full pos-relative">
                                <div className="pos-absolute games-responses-count">
                                    Total number of responses: {totalResponses}
                                </div>
                                <PieStats data={stats} />
                            </div>
                        </div>
                    )}
                    <div className="games-empty pt-app-bar trans-3">Please select a game from your left</div>
                </div>
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
                                New game
                            </Typography>
                            <div className="flex-grow" />
                            <Button color="inherit" onClick={this.handleCreateGame} disabled={gameTitle.length <= 0}>
                                Create
                            </Button>
                        </Toolbar>
                    </AppBar>
                    <div className="pt-app-bar size-full pos-absolute absolute-top">
                        <div className="size-full overflow-y-auto users-create">
                            <div className="users-create-box">
                                <TextField
                                    name="gameTitle"
                                    label="Title"
                                    value={gameTitle}
                                    onChange={this.handleCreateFieldChange}
                                    type="text"
                                    className="mb-3"
                                    fullWidth
                                />
                                <TextField
                                    name="gamePreface"
                                    label="Preface"
                                    value={gamePreface}
                                    onChange={this.handleCreateFieldChange}
                                    type="text"
                                    className="mb-3"
                                    fullWidth
                                    multiline
                                />
                                <TextField
                                    name="gameThreshold"
                                    label="Tag threshold"
                                    value={gameThreshold}
                                    onChange={this.handleCreateFieldChange}
                                    type="number"
                                    className="mb-3"
                                    fullWidth
                                />
                            </div>
                        </div>
                    </div>
                </Dialog>
            </MainAppLayout>
        );
    }
}

const mapStateToProps = (state) => ({
    app: state.app,
    auth: state.auth,
    game: state.game,
    group: state.group,
    loading: state.loading,
    user: state.user
});

export default connect(
    mapStateToProps,
    { uploadGame, getAllGames, getGameNextScene, updateGameAnswer, getGame, getGameAnswer, deleteGame }
)(GamesPage);
