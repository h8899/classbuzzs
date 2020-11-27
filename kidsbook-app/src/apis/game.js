import Axios from './axios';

class GameAPI {
    // Upload game to the system
    static async upload(group_id, file, title, preface, threshold) {
        const payload = new FormData();
        payload.append('group_id', group_id);
        payload.append('file', file);
        if (title) payload.append('title', title);
        if (preface) payload.append('preface', preface);
        if (threshold) payload.append('threshold', threshold);

        const response = await Axios.getInstance().post(`/game/`, payload, {
            timeout: 0,
            headers: { Authorization: 'real' }
        });
        return {
            game: response.data.data
        };
    }

    // TODO: Wrong file but nevermind
    // Get all games in group
    static async getAll(group_id) {
        const response = await Axios.getInstance().get(`/group/${group_id}/games/`, {
            headers: { Authorization: 'real' }
        });

        // TODO: Fix in backend?
        const games = response.data.data.filter((game) => game.first_scene);
        return {
            games: games
        };
    }

    // Get next scene in this game
    static async getNextScene(game_id) {
        const response = await Axios.getInstance().get(`/scene/?game_id=${game_id}`, {
            headers: { Authorization: 'effective' }
        });

        return {
            scene: response.data.data.scene,
            answers: response.data.data.answers
        };
    }

    // Update the answers for a game
    static async updateAnswer(game_id, user_id, answers) {
        const payload = {
            answers: answers
        };
        const response = await Axios.getInstance().post(`/game/${game_id}/user/${user_id}/`, payload, {
            headers: { Authorization: 'real' }
        });

        return {
            answers: response.data.data.answers,
            ending: response.data.data.ending
        };
    }

    // Get all info of a game
    static async get(game_id) {
        const response = await Axios.getInstance().get(`/game/${game_id}/`, {
            headers: { Authorization: 'real' }
        });

        return {
            game: response.data.data
        };
    }

    // Get answer of a game
    static async getAnswer(game_id, user_id) {
        const response = await Axios.getInstance().get(`/game/${game_id}/user/${user_id}/`, {
            headers: { Authorization: 'real' }
        });

        return {
            answers: response.data.data.answer.answers,
            scenes: response.data.data.scenes
        };
    }

    // Delete a game
    static async deleteGame(game_id) {
        await Axios.getInstance().delete(`/game/${game_id}/`, {
            headers: { Authorization: 'real' }
        });
        return true;
    }
}

export default GameAPI;
