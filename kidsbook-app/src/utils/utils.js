import isObject from 'is-object';
import Config from '../config';
import JSONic from 'jsonic';
import randomString from 'randomstring';

// Merge 2 object, if key exist in newObject but undefined or null, ignore them instead of merging
// Return shallow merged object regardless of the input
export const mergeObject = (oldObject, newObject) => {
    if (!isObject(oldObject)) oldObject = {};
    if (!isObject(newObject)) newObject = {};

    const merged = {
        ...oldObject,
        ...newObject
    };

    Object.keys(newObject).forEach((k) => {
        const v = newObject[k];
        if (v === undefined || v === null) {
            merged[k] = oldObject[k];
        }
    });

    return merged;
};

// Merge 2 array and remove duplicate (using set)
// Return shallow merged array regardless of the input
export const mergeArray = (array1, array2) => {
    if (!Array.isArray(array1)) array1 = [];
    if (!Array.isArray(array2)) array2 = [];

    return [...new Set([...array1, ...array2])];
};

export const parseYoutube = (url) => {
    // Modified from https://gist.github.com/yangshun/9892961
    // - Supported YouTube URL formats:
    //   - http://www.youtube.com/watch?v=My2FRPA3Gf8
    //   - http://youtu.be/My2FRPA3Gf8
    //   - https://youtube.googleapis.com/v/My2FRPA3Gf8

    url = String(url);
    const res = url.match(
        /(http:|https:|)\/\/(www.)?(youtu(be\.com|\.be|be\.googleapis\.com))\/(video\/|embed\/|watch\?v=|v\/)?([A-Za-z0-9._%-]*)(&\S+)?/
    );

    if (Array.isArray(res) && res.length >= 7 && res[3].indexOf('youtu') >= 0 && res[6]) {
        return String(res[6]);
    }

    return null;
};

export const apiDelay = () => {
    return new Promise((resolve) => {
        setTimeout(resolve, Config.apiDelay);
    });
};

export const timeoutDelay = (ms) => {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

export const parsePhoto = (photo) => {
    photo = String(photo);
    if (photo.indexOf('/media/') < 0) return null;

    const parts = photo.split('/media/');
    if (parts.length <= 1) return null;
    if (parts[1] === 'default.png') return null;

    return `${Config.rootUrl}/media/${parts[1]}`;
};

export const parseJSON = (raw) => {
    try {
        return JSONic(raw);
    } catch (e) {
        return null;
    }
};

export const parseMedia = (picture, link, ogp) => {
    const result = {};

    const youtubeId = parseYoutube(link);
    const photo = parsePhoto(picture);

    if (photo && link) {
        result.media = 'photo_link';
        result.payload = {
            photo: photo,
            link: link
        };
    } else if (photo) {
        result.media = 'photo';
        result.payload = photo;
    } else if (youtubeId) {
        result.media = 'youtube';
        result.payload = youtubeId;
    } else if (link) {
        const json = parseJSON(ogp) || {};
        result.media = 'link';
        result.payload = { ...json, url: link };
    }

    return result;
};

export const parseSurveyAnswer = (questions, answer) => {
    if (!Array.isArray(questions)) questions = [];
    if (!Array.isArray(answer)) answer = [];

    questions = questions.map((question) => {
        if (!isObject(question)) question = {};
        question = { ...question };

        if (!question.type) question.type = 'text';
        if (question.type === 'checkbox' || question.type === 'option') {
            if (!Array.isArray(question.options)) question.options = [];
        }
        return question;
    });

    const newAnswer = [];
    questions.forEach((question, index) => {
        const value = answer[index];
        if (question.type === 'checkbox') {
            try {
                let parsed;
                if (Array.isArray(value)) {
                    parsed = value;
                } else if (!isNaN(parsed)) {
                    parsed = value;
                } else {
                    parsed = JSON.parse(value);
                }

                if (Array.isArray(parsed)) {
                    parsed = parsed.map((p) => parseInt(p, 10));
                    newAnswer.push(parsed);
                } else if (!isNaN(parsed)) {
                    newAnswer.push([parsed]);
                } else {
                    throw new Error('Error');
                }
            } catch (e) {
                newAnswer.push([]);
            }
        } else if (question.type === 'radio') {
            const int = parseInt(value, 10);
            if (!isNaN(int)) {
                newAnswer.push(int);
            } else {
                newAnswer.push('');
            }
        } else {
            if (value) {
                newAnswer.push(String(value));
            } else {
                newAnswer.push('');
            }
        }
    });

    return newAnswer;
};

export const isDefined = (object, keys) => {
    if (!isObject(object) || !Array.isArray(keys)) return false;

    return keys.every((key) => {
        return object[key] !== undefined && object[key] !== null;
    });
};

export const getRandomID = () => {
    return randomString.generate({
        length: 16,
        charset: 'alphanumeric'
    });
};
