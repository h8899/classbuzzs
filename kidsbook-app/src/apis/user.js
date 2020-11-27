import Axios from './axios';
import GroupAPI from './group';
import Storage from '../storage';
import jwt from 'jsonwebtoken';
import { usersConvert } from '../utils/CSVConverter';

class UserAPI {
    // Login a user
    static async login(username, password) {
        const payload = {
            email_address: username,
            password: password
        };
        const response = await Axios.getInstance().post('/user/login/', payload, { headers: { Authorization: null } });
        const { name, token } = response.data.data;
        const userId = jwt.decode(token).user_id;

        if (!userId) {
            throw new Error('Failed to decode user id from token');
        }
        Storage.set('realToken', token);
        Storage.set('effectiveToken', token);

        return { name, token, userId };
    }

    // Logout a user (Invalidate token)
    static async logout() {
        try {
            await Axios.getInstance().post('/user/logout/');
        } catch (e) {
            // Ignore
        } finally {
            Storage.remove('realToken');
            Storage.remove('effectiveToken');
        }
        return true;
    }

    // Login as a virtual user
    static async loginAs(email) {
        const payload = {
            email_address: email
        };
        const response = await Axios.getInstance().post('/user/login_as_virtual/', payload, {
            headers: { Authorization: 'real' }
        });
        const { name, token } = response.data.data;
        const userId = jwt.decode(token).user_id;

        if (!userId) {
            throw new Error('Failed to decode user id from token');
        }
        Storage.set('effectiveToken', token);

        return { name, token, userId };
    }

    static async loginAsReal() {
        Storage.set('effectiveToken', Storage.get('realToken'));
    }

    static async update(user_id, state, isUpdatePassword, isUpdatePhoto) {
        let payload = {
            username: state.newDisplayName,
            description: state.newDescription
        };

        if (isUpdatePassword) {
            payload.email = state.email;
            payload.password = state.newPassword;
            if (state.oldPassword) {
                payload.oldPassword = state.oldPassword;
            }
        }

        if (isUpdatePhoto) {
            const photo = state.newPhoto;
            payload = new FormData();

            const parts = String(photo.name).split('.');
            const fileExt = parts[parts.length - 1].toLowerCase();
            if (fileExt !== 'png' && fileExt !== 'jpg' && fileExt !== 'jpeg' && fileExt !== 'gif') {
                throw new Error('Only photos with the following extensions are allowed: png, jpg, jpeg, gif');
            }

            const fileName = `${Date.now()}_${Math.round(Math.random() * 1000000)}.${fileExt}`;
            payload.append('profile_photo', photo, fileName);
        }

        const response = await Axios.getInstance().post(`/user/update/${user_id}/`, payload, {
            headers: { Authorization: 'real' }
        });
        return {
            user: response.data.data
        };
    }

    // Create a user
    // teacherId is required for user and virtual user
    // type can be ADMIN, SUPERUSER, USER, VIRTUAL_USER
    static async create(type, username, password, realname, email, teacherId) {
        const payload = { type, username, password, realname, email_address: email };
        if (teacherId) {
            payload.teacher = teacherId;
        }
        const response = await Axios.getInstance().post('/user/register/', payload, {
            headers: { Authorization: 'real' }
        });
        return {
            user: response.data.data
        };
    }

    // Import users to the system (Without joining any group)
    static async import(rawCSV) {
        const converted = await usersConvert(rawCSV);
        const fileName = `${Math.round(Math.random() * 1000000)}.csv`;

        const payload = new FormData();
        payload.append('file', new File([new Blob([converted])], fileName));

        const response = await Axios.getInstance().post(`/batch/create/user/${fileName}/`, payload, {
            timeout: 0,
            headers: { Authorization: 'real' }
        });
        // TODO: Seriously? Can't the backend return an array instead?
        return {
            success: response.data.data.created_users || []
        };
    }

    // Get a specific user
    static async get(user_id) {
        const response = await Axios.getInstance().get(`/user/${user_id}/`, { headers: { Authorization: 'real' } });
        return {
            user: {
                user_groups: [],
                ...response.data.data
            }
        };
    }

    // Get all users in a group
    static async getAll(group_id) {
        const response = await Axios.getInstance().get(`/group/${group_id}/users/`, {
            headers: { Authorization: 'real' }
        });
        return {
            users: response.data.data.map((u) => {
                return {
                    ...u,
                    user_groups: u.user_groups || []
                };
            })
        };
    }

    // Get all virtual users
    static async getAllVirtual() {
        const response = await Axios.getInstance().get('/user/virtual_users/', { headers: { Authorization: 'real' } });
        return {
            users: response.data.data.map((u) => {
                return {
                    ...u,
                    user_groups: u.user_groups || []
                };
            })
        };
    }

    // Get all users the superuser should be allowed to see
    static async getAllValid() {
        const response = await Axios.getInstance().get('/users/', { headers: { Authorization: 'real' } });
        return {
            users: response.data.data
        };
    }

    // Get all users in the same group with superuser or created by the superuser
    static async getAllInAny(group_ids) {
        let result = [];
        const groups = {};

        // Get all from groups
        for (let i = 0; i < group_ids.length; i++) {
            const groupId = group_ids[i];
            const res = await UserAPI.getAll(groupId);
            result = result.concat(res.users);
            groups[groupId] = res.users;
        }

        // Get all from non groups
        const response = await Axios.getInstance().get('/users/non_group/');
        const users = response.data.data.map((u) => {
            return {
                ...u,
                user_groups: u.user_groups || []
            };
        });

        return {
            users: result.concat(users),
            groups: groups
        };
    }

    // Get all notifications
    static async getAllNotifications() {
        const response = await Axios.getInstance().get('/notifications/');
        return {
            notifications: response.data.data,
            unseen: response.data.unseen
        };
    }

    static async resetNotifications() {
        await Axios.getInstance().post('/notifications/');
        return true;
    }

    static async getSettings() {
        const response = await Axios.getInstance().get('/user/setting/');
        const { data } = response.data;

        return {
            settings: {
                receiveNotifications: data.receive_notifications
            }
        };
    }

    static async updateSettings(receiveNotifications) {
        const payload = {};
        payload.receive_notifications = receiveNotifications ? 'True' : 'False';

        await Axios.getInstance().post('/user/setting/', payload);
        return true;
    }

    // Join a group (Only the group owner can call this)
    static async joinGroup(user_id, group_id) {
        return GroupAPI.addUser(user_id, group_id);
    }

    // Leave a group (Only the group owner can call this)
    static async leaveGroup(user_id, group_id) {
        return GroupAPI.removeUser(user_id, group_id);
    }
}

export default UserAPI;
