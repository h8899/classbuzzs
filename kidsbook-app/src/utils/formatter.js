import isObject from 'is-object';
import { mergeObject, mergeArray, parsePhoto, parseMedia, parseSurveyAnswer } from './utils';

// TODO: Check the correctness of mergeArray, it is NOT accurate
export class NotificationFormatter {
    static parse(notification, prev, extra) {
        if (!isObject(notification)) notification = {};
        if (!isObject(prev)) prev = {};
        if (!isObject(extra)) extra = {};
        prev = { ...prev };

        if (!isObject(notification.action_user)) notification.action_user = {};

        const merged = mergeObject(prev, {
            id: notification.id, // String
            content: notification.content, // String
            group: notification.group, // String
            post: notification.post, // String
            user: notification.action_user.id, // String
            createdAt: prev.createdAt || Date.parse(notification.created_at) || 0, // Date time
            _lastUpdated: Date.now() // Date time
        });

        return merged;
    }

    static show(notification) {
        notification = { ...notification };
        if (!isObject(notification)) notification = {};
        if (isNaN(notification.createdAt)) notification.createdAt = 0;
        if (isNaN(notification._lastUpdated)) notification._lastUpdated = 0;

        return notification;
    }
}

export class FlagFormatter {
    static parse(flag, prev, extra) {
        if (!isObject(flag)) flag = {};
        if (!isObject(prev)) prev = {};
        if (!isObject(extra)) extra = {};
        prev = { ...prev };

        if (!isObject(flag.post)) flag.post = {};
        if (!isObject(flag.comment)) flag.comment = {};

        const merged = mergeObject(prev, {
            id: flag.id, // String
            status: flag.status, // String
            type: flag.comment.id ? 'comment' : 'post', // String
            user: flag.user_id, // String
            post: flag.post.id, // String
            comment: flag.comment.id, // String
            createdAt: prev.createdAt || Date.parse(flag.created_at) || 0, // Date time
            _lastUpdated: Date.now() // Date time
        });

        return merged;
    }

    static show(flag) {
        flag = { ...flag };
        if (!isObject(flag)) flag = {};
        if (isNaN(flag.createdAt)) flag.createdAt = 0;
        if (isNaN(flag._lastUpdated)) flag._lastUpdated = 0;

        return flag;
    }
}

export class GroupFormatter {
    static parse(group, prev, extra) {
        if (!isObject(group)) group = {};
        if (!isObject(prev)) prev = {};
        if (!isObject(extra)) extra = {};
        prev = { ...prev };
        if (!isObject(group.posts)) group.posts = {};

        if (!Array.isArray(prev.posts)) prev.posts = [];
        let posts = prev.posts;
        if (Array.isArray(group.posts)) {
            const processed = group.posts.filter((p) => isObject(p) && p.id).map((p) => p.id);
            posts = extra.postsReplace ? processed : mergeArray(posts, processed);
        } else if (extra.postAdd) {
            posts = mergeArray([extra.postAdd], posts);
        } else if (extra.postDelete) {
            posts = posts.filter((p) => p !== extra.postDelete);
        }

        if (!Array.isArray(prev.members)) prev.members = [];
        let members = prev.members;
        if (Array.isArray(group.users)) {
            if (extra.userFiltered) {
                members = group.users;
            } else {
                members = group.users.filter((u) => isObject(u) && u.id).map((u) => u.id);
            }
        }

        if (!Array.isArray(prev.flagged)) prev.flagged = [];
        let flagged = prev.flagged;
        if (Array.isArray(group.flagged)) {
            flagged = group.flagged
                .filter((f) => isObject(f) && f.id)
                .sort((a, b) => Date.parse(a.created_at) - Date.parse(b.created_at))
                .map((f) => f.id);
        }

        if (!Array.isArray(prev.surveys)) prev.surveys = [];
        let surveys = prev.surveys;
        if (Array.isArray(group.surveys)) {
            surveys = group.surveys.filter((f) => isObject(f) && f.id).map((f) => f.id);
        } else if (extra.surveyAdd) {
            surveys = mergeArray([extra.surveyAdd], surveys);
        } else if (extra.surveyDelete) {
            surveys = surveys.filter((s) => s !== extra.surveyDelete);
        }

        if (!Array.isArray(prev.games)) prev.games = [];
        let games = prev.games;
        if (Array.isArray(group.games)) {
            games = group.games.filter((f) => isObject(f) && f.id).map((f) => f.id);
        } else if (extra.gameAdd) {
            games = mergeArray([extra.gameAdd], games);
        } else if (extra.gameDelete) {
            games = games.filter((g) => g !== extra.gameDelete);
        }

        const merged = mergeObject(prev, {
            id: group.id, // String
            name: group.name, // String
            description: group.description, // String
            photo: parsePhoto(group.picture), // String
            posts: posts, // Array
            owner: group.creator, // String
            members: members, // Array
            flagged: flagged, // Array
            surveys: surveys, // Array
            games: games, // Array
            createdAt: prev.createdAt || Date.parse(group.created_at) || 0, // Date time
            _lastUpdated: Date.now() // Date time
        });

        return merged;
    }

    static show(group) {
        group = { ...group };
        if (!isObject(group)) group = {};
        if (!Array.isArray(group.posts)) group.posts = [];
        if (!Array.isArray(group.members)) group.members = [];
        if (!Array.isArray(group.flagged)) group.flagged = [];
        if (!Array.isArray(group.surveys)) group.surveys = [];
        if (!Array.isArray(group.games)) group.games = [];
        if (isNaN(group.createdAt)) group.createdAt = 0;
        if (isNaN(group._lastUpdated)) group._lastUpdated = 0;

        return group;
    }
}

export class CommentFormatter {
    static parse(comment, prev, extra) {
        if (!isObject(comment)) comment = {};
        if (!isObject(prev)) prev = {};
        if (!isObject(extra)) extra = {};
        prev = { ...prev };

        if (!isObject(comment.creator)) comment.creator = {};

        if (!Array.isArray(prev.likes)) prev.likes = [];
        let likes = prev.likes;
        if (Array.isArray(comment.likers)) {
            likes = comment.likers;
        }

        if (!Array.isArray(prev.flags)) prev.flags = [];
        const flags = prev.flags;

        let original = null;
        if (comment.filtered_content) {
            if (comment.filtered_content !== comment.content) {
                original = comment.content;
                comment.content = comment.filtered_content;
            }
        }

        const merged = mergeObject(prev, {
            id: comment.id, // String
            postId: comment.post, // String
            author: comment.creator.id, // String
            body: comment.content, // String
            original: original, // String / null
            likes: likes, // Array
            flags: flags, // Array
            isDeleted: comment.is_deleted, // Boolean (Don't need to do type conversion)
            createdAt: prev.createdAt || Date.parse(comment.created_at) || 0, // Date time
            _lastUpdated: Date.now() // Date time
        });

        // TODO: Make sure flags work well
        return merged;
    }

    static show(comment) {
        comment = { ...comment };
        if (!isObject(comment)) comment = {};
        if (!Array.isArray(comment.likes)) comment.likes = [];
        if (!Array.isArray(comment.flags)) comment.flags = [];
        if (isNaN(comment.createdAt)) comment.createdAt = 0;
        if (isNaN(comment._lastUpdated)) comment._lastUpdated = 0;

        return comment;
    }
}

export class PostFormatter {
    static parse(post, prev, extra) {
        if (!isObject(post)) post = {};
        if (!isObject(prev)) prev = {};
        if (!isObject(extra)) extra = {};
        prev = { ...prev };

        if (!isObject(post.creator)) post.creator = {};

        if (!Array.isArray(prev.likes)) prev.likes = [];
        let likes = prev.likes;
        if (Array.isArray(post.likes_list)) {
            if (!extra.likeFiltered) {
                likes = post.likes_list
                    .filter((l) => isObject(l) && l.like_or_dislike && isObject(l.user))
                    .map((l) => l.user.id)
                    .filter((u) => Boolean(u));
            } else {
                likes = post.likes_list;
            }
        }

        if (!Array.isArray(prev.comments)) prev.comments = [];
        let comments = prev.comments;
        let commentsPreview;
        if (Array.isArray(post.comments)) {
            const processed = post.comments.filter((c) => isObject(c) && c.id).map((c) => c.id);
            if (extra.commentsPreview) {
                commentsPreview = processed;
            } else {
                comments = extra.commentsReplace ? processed : mergeArray(comments, processed);
            }
        }

        if (!Array.isArray(prev.flags)) prev.flags = [];
        const flags = prev.flags;

        let original = null;
        if (post.filtered_content) {
            if (post.filtered_content !== post.content) {
                original = post.content;
                post.content = post.filtered_content;
            }
        }

        const media = parseMedia(post.picture, post.link, post.ogp);
        const merged = mergeObject(prev, {
            id: post.id, // String
            groupId: post.group, // String
            author: post.creator.id, // String
            body: post.content, // String
            original: original, // String / null
            media: media.media, // String
            payload: media.payload, // String
            likes: likes, // Don't use mergeArray, Array
            comments: comments, // Array
            commentsPreview: commentsPreview,
            flags: flags, // Array
            isRandom: post.is_random, // Boolean (Don't need to do type conversion)
            isDeleted: post.is_deleted, // Boolean (Don't need to do type conversion)
            isSystem: post.is_sponsored, // Boolean (Don't need to do type conversion)
            isAnnouncement: post.is_announcement, // Boolean (Don't need to do type conversion)
            createdAt: prev.createdAt || Date.parse(post.created_at) || 0, // Date time
            _lastUpdated: Date.now() // Date time
        });

        // TODO: Make sure link have correct OGP, and flags work well
        return merged;
    }

    static show(post) {
        post = { ...post };
        if (!isObject(post)) post = {};
        if (!Array.isArray(post.likes)) post.likes = [];
        if (!Array.isArray(post.comments)) post.comments = [];
        if (!Array.isArray(post.commentsPreview)) post.commentsPreview = [];
        if (!Array.isArray(post.flags)) post.flags = [];
        if (isNaN(post.createdAt)) post.createdAt = 0;
        if (isNaN(post._lastUpdated)) post._lastUpdated = 0;

        return post;
    }
}

export class UserFormatter {
    static _parseStats(user, prev) {
        if (!isObject(user)) user = {};
        if (!isObject(prev)) prev = {};
        if (!isObject(user.stats)) user.stats = {};
        if (!Array.isArray(user.user_posts)) user.user_posts = [];

        const prevStats = prev.stats;
        const curStats = {};
        const postStats = {};

        user.user_posts
            .filter((p) => isObject(p) && p.group)
            .map((p) => p.group)
            .forEach((g) => {
                if (isNaN(postStats[g])) postStats[g] = 0;
                postStats[g]++;
            });

        Object.keys(user.stats).forEach((group) => {
            const stats = user.stats[group];
            curStats[group] = {
                post: postStats[group],
                comment: stats.num_comments,
                likeGiven: stats.num_likes_given,
                likeReceived: stats.num_likes_received
            };
        });

        const merged = mergeObject(prevStats, curStats);

        Object.keys(merged).forEach((group) => {
            if (!isObject(merged[group])) merged[group] = {}; // Shouldn't happen but just in case
            if (group === 'comment' || group === 'likeGiven' || group === 'likeReceived') return delete merged[group]; // Remove old structure
            const stats = merged[group];
            if (isNaN(stats.post)) stats.post = 0;
            if (isNaN(stats.comment)) stats.comment = 0;
            if (isNaN(stats.likeGiven)) stats.likeGiven = 0;
            if (isNaN(stats.likeReceived)) stats.likeReceived = 0;
        });

        return merged;
    }

    static parse(user, prev, extra) {
        if (!isObject(user)) user = {};
        if (!isObject(prev)) prev = {};
        if (!isObject(extra)) extra = {};
        prev = { ...prev };

        const prevGroups = prev.groups || [];
        const curGroups = (user.user_groups || [])
            .filter((g) => isObject(g))
            .map((g) => g.id)
            .filter((g) => Boolean(g));

        let role;
        if (!isNaN(user.role)) role = user.role;
        if (isObject(user.role) && !isNaN(user.role.id)) role = user.role.id;

        const merged = mergeObject(prev, {
            id: user.id, // String
            username: user.username, // String
            realname: user.realname, // String
            email: user.email_address, // String
            description: user.description, // String
            photo: parsePhoto(user.profile_photo), // String
            isActive: user.is_active, // Boolean
            isSuperuser: user.is_superuser, // Boolean
            groups: mergeArray(prevGroups, curGroups), // Array
            stats: UserFormatter._parseStats(user, prev), // Object
            role: role, // Number
            _lastUpdated: Date.now(), // Date time
            _children: extra.children || prev._children || [] // Array
        });

        return merged;
    }

    static show(user) {
        user = { ...user };
        if (!isObject(user)) user = {};
        if (!Array.isArray(user.groups)) user.groups = [];
        if (!user._children) user._children = [];

        if (!isObject(user.stats)) user.stats = {};
        Object.keys(user.stats).forEach((group) => {
            if (!isObject(user.stats[group])) user.stats[group] = {}; // Shouldn't happen but just in case
            if (group === 'comment' || group === 'likeGiven' || group === 'likeReceived')
                return delete user.stats[group]; // Remove old structure
            const stats = user.stats[group];
            if (isNaN(stats.post)) stats.post = 0;
            if (isNaN(stats.comment)) stats.comment = 0;
            if (isNaN(stats.likeGiven)) stats.likeGiven = 0;
            if (isNaN(stats.likeReceived)) stats.likeReceived = 0;
        });

        if (isNaN(user.role)) user.role = -1;
        if (isNaN(user._lastUpdated)) user._lastUpdated = 0;

        return user;
    }
}

export class SurveyFormatter {
    static parse(survey, prev, extra) {
        if (!isObject(survey)) survey = {};
        if (!isObject(prev)) prev = {};
        if (!isObject(extra)) extra = {};
        prev = { ...prev };

        if (!isObject(survey.stats)) survey.stats = {};
        let responseCount = parseInt(survey.stats.num_of_responses, 10);
        if (isNaN(responseCount)) responseCount = prev.responseCount || 0;

        if (!Array.isArray(prev.questions)) prev.questions = [];
        let questions = prev.questions;
        if (Array.isArray(survey.questions_answers)) {
            questions = survey.questions_answers.filter((q) => isObject(q));
            questions.forEach((question) => {
                question.required = String(question.required).toLocaleLowerCase() === 'true';
                if (question.type === 'checkbox' || question.type === 'radio') {
                    if (!Array.isArray(question.options)) question.options = [];
                }
                if (!question.type) {
                    question.type = 'text';
                }
            });
        }

        if (!isObject(prev.answers)) prev.answers = {};
        let answers = prev.answers;
        if (Array.isArray(survey.answers) || isObject(extra.answerAdd)) {
            if (extra.answerAdd) {
                survey.answers = [extra.answerAdd];
            } else {
                answers = {};
            }
            survey.answers
                .filter(
                    (answer) =>
                        isObject(answer) && answer.id && answer.survey && answer.user && Array.isArray(answer.answers)
                )
                .forEach((answer) => {
                    answers[answer.user] = {
                        id: answer.id,
                        answers: parseSurveyAnswer(questions, answer.answers)
                    };
                });
        }
        if (extra.answerClear) {
            answers = {};
        }

        const merged = mergeObject(prev, {
            id: survey.id, // String
            groupId: survey.group, // String
            title: survey.title, // String
            preface: survey.preface, // String
            postface: survey.postface, // String
            questions: questions, // Array of objects [{ type: String, required: Bool, question: String, options: [String] }]
            answers: answers, // Objects { [userId]: { id: String, answers: [String] } }
            isPinned: survey.is_pinned, // Boolean
            responseCount: responseCount, // Number
            _popup: extra.incomplete, // Boolean
            _lastUpdated: Date.now() // Date time
        });

        return merged;
    }

    static show(survey) {
        survey = { ...survey };
        if (!isObject(survey)) survey = {};

        if (!Array.isArray(survey.questions)) survey.questions = [];
        survey.questions.forEach((question) => {
            if (question.type === 'checkbox' || question.type === 'radio') {
                if (!Array.isArray(question.options)) question.options = [];
            }
            if (!question.type) {
                question.type = 'text';
            }
        });

        if (!isObject(survey.answers)) survey.answers = {};
        Object.keys(survey.answers).forEach((userId) => {
            const answer = survey.answers[userId];
            if (!Array.isArray(answer.answers)) {
                answer.answers = parseSurveyAnswer(survey.questions, answer.answers);
            }
        });

        if (isNaN(survey.responseCount)) survey.responseCount = 0;
        if (isNaN(survey._lastUpdated)) survey._lastUpdated = 0;

        return survey;
    }
}

export class GameFormatter {
    static parseScene(scene) {
        const parsed = {};
        parsed.id = scene.id;
        parsed.isEnd = scene.is_end;
        parsed.choices = Array.isArray(scene.choices) ? scene.choices : [];
        parsed.dialogue = Array.isArray(scene.dialogue) ? scene.dialogue : [];

        parsed.choices = parsed.choices.filter((choice) => isObject(choice) && choice.text && choice.pathway);
        parsed.dialogue = parsed.dialogue.filter((dialog) => isObject(dialog) && dialog.speech);
        return parsed;
    }

    static parseEndStats(game, prev) {
        const gameStats = isObject(game.stats) && isObject(game.stats.answers) ? { ...game.stats.answers } : {};
        let endStats = isObject(prev.endStats) ? { ...prev.endStats } : {};

        Object.keys(gameStats).forEach((key) => {
            const newStats = gameStats[key];
            if (!isObject(newStats) || Array.isArray(newStats)) return;
            endStats = newStats;
        });

        return endStats;
    }

    static parseAllAnswers(answers) {
        if (!isObject(answers)) answers = {};

        const parsed = {};
        Object.keys(answers).forEach((answerId) => {
            const answer = answers[answerId];
            if (!answer.user || !Array.isArray(answer.answers)) return;
            parsed[answer.user] = {
                answers: answer.answers,
                ending: answer.ending
            };
        });

        return parsed;
    }

    static parse(game, prev, extra) {
        if (!isObject(game)) game = {};
        if (!isObject(prev)) prev = {};
        if (!isObject(extra)) extra = {};
        prev = { ...prev };

        if (!isObject(prev.scenes)) prev.scenes = {};
        if (!isObject(game.scenes)) game.scenes = {};

        let answers = [];
        if (Array.isArray(prev.answers)) answers = prev.answers;
        if (Array.isArray(game.answers)) answers = game.answers;

        const prevScenesOrder = Array.isArray(prev.scenesOrder) ? prev.scenesOrder : [];
        const curScenesOrder = game.first_scene ? [game.first_scene] : [];

        const gameScenes = {};
        Object.keys(game.scenes).forEach((sceneId) => {
            const scene = game.scenes[sceneId];
            gameScenes[sceneId] = GameFormatter.parseScene(scene);
        });

        const newScene = extra.sceneAdd;
        if (isObject(newScene) && newScene.id) {
            curScenesOrder.push(newScene.id);
            gameScenes[newScene.id] = GameFormatter.parseScene(newScene);
        }
        const mergedScenes = mergeObject(prev.scenes, gameScenes);
        let mergedScenesOrder = Array.from(new Set(prevScenesOrder.concat(curScenesOrder)));

        if (extra.sceneReorder) {
            let current = prev.firstScene || game.first_scene;

            mergedScenesOrder = [];
            for (let i = 0; i < answers.length + 1; i++) {
                mergedScenesOrder.push(current);

                const currentScene = mergedScenes[current];
                const answer = answers[i];
                if (!currentScene || !Array.isArray(currentScene.choices) || !currentScene.choices[answer]) break;
                const selectedChoice = currentScene.choices[answer];
                if (!isObject(selectedChoice)) break;
                
                current = selectedChoice.pathway;
            }
        }

        let currentScene = prev.currentScene;
        let isEnd = false;
        if (mergedScenesOrder.length > 0) {
            const lastScene = mergedScenesOrder[mergedScenesOrder.length - 1];
            currentScene = lastScene;
            const scene = mergedScenes[lastScene];
            if (isObject(scene)) {
                isEnd = Boolean(scene.isEnd);
            }
        }
        const endStats = GameFormatter.parseEndStats(game, prev);

        if (!isObject(prev.allAnswers)) prev.allAnswers = {};
        const curAllAnswers = GameFormatter.parseAllAnswers(game.allAnswers);
        const allAnswers = mergeObject(prev.allAnswers, curAllAnswers);

        const merged = mergeObject(prev, {
            id: game.id, // String
            creator: game.creator, // String
            group: game.group, // String
            title: game.title, // String
            preface: game.preface, // String
            firstScene: game.first_scene, // String
            currentScene: currentScene, // String
            scenesOrder: mergedScenesOrder, // Array of string
            scenes: mergedScenes, // Object of objects
            answers: answers, // Array of integer
            allAnswers: allAnswers, // Object of objects that stores the answers and ending
            threshold: game.threshold, // Integer
            ending: game.ending, // Ending scenario
            isEnd: isEnd, // Boolean
            endStats: endStats, // Object of tags with integer
            _lastUpdated: Date.now() // Date time
        });

        return merged;
    }

    static show(game) {
        game = { ...game };
        if (!isObject(game)) game = {};
        if (!Array.isArray(game.scenesOrder)) game.scenesOrder = [];
        if (!Array.isArray(game.answers)) game.answers = [];
        if (!isObject(game.scenes)) game.scenes = {};
        if (!isObject(game.endStats)) game.endStats = {};
        if (!isObject(game.allAnswers)) game.allAnswers = {};
        if (isNaN(game._lastUpdated)) game._lastUpdated = 0;

        Object.keys(game.scenes).forEach((sceneId) => {
            const scene = game.scenes[sceneId];
            if (!isObject(scene)) delete game.scenes[sceneId];
            if (!Array.isArray(scene.choices)) scene.choices = [];
            if (!Array.isArray(scene.dialogue)) scene.dialogue = [];

            scene.choices = scene.choices.filter((choice) => isObject(choice));
            scene.dialogue = scene.dialogue.filter((dialog) => isObject(dialog));
        });

        Object.keys(game.allAnswers).forEach((userId) => {
            const answer = game.allAnswers[userId];
            if (!isObject(answer) || !Array.isArray(answer.answers)) {
                delete game.allAnswers[userId];
            }
        });

        return game;
    }
}
