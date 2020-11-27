import { users, tokens } from '../dummy';

class UserAPI {
    static async login(username, password) {
        let user;
        Object.keys(users).forEach((k) => {
            let u = users[k];
            if (u.email === username) user = u;
        });

        if (!user || password === 'incorrect')
            throw Error('Incorrect username / password');

        let token;
        Object.keys(tokens).forEach((k) => {
            let t = tokens[k];
            if (t === user) token = k;
        });
        if (!token) throw Error('Token not found');

        return {
            token: token
        };
    }

    static async loginAs(auth_token, user_id) {
        let auth_user;
        if (!(auth_user = tokens[auth_token]))
            throw Error('Invalid authentication token');
        
        if (!auth_user.superUser)
            throw Error('Permission denied');

        let token;
        Object.keys(tokens).forEach((k) => {
            let t = tokens[k];
            if (t.id === user_id) token = k;
        });
        if (!token) throw Error('Token not found');

        return {
            token: token
        };
    }

    static async get(auth_token, user_id) {
        let auth_user;
        if (!(auth_user = tokens[auth_token]))
            throw Error('Invalid authentication token');
        
        let user;
        if (!(user = users[user_id]))
            throw Error('User not found');
        
        if (auth_user.id === user_id) {
            return auth_user;
        } else if (auth_user.superUser) {
            return user;
        }
    }
}

export default UserAPI;
