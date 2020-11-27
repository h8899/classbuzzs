import Axios from './axios';
import UserAPI from './user';

class GroupAPI {
    // Create a group
    static async create(name) {
        const payload = { name: name };
        const response = await Axios.getInstance().post('/group/', payload, { headers: { Authorization: 'real' } });

        return {
            created_id: response.data.data.created_group_id
        };
    }

    static async update(group_id, state, isUpdatePhoto) {
        let payload = {
            name: state.newName,
            description: state.newDescription
        };

        if (isUpdatePhoto) {
            const photo = state.newPhoto;
            payload = new FormData();

            const parts = String(photo.name).split('.');
            const fileExt = parts[parts.length - 1].toLowerCase();
            if (fileExt !== 'png' && fileExt !== 'jpg' && fileExt !== 'jpeg' && fileExt !== 'gif') {
                throw new Error('Only photos with the following extensions are allowed: png, jpg, jpeg, gif');
            }

            const fileName = `${Date.now()}_${Math.round(Math.random() * 1000000)}.${fileExt}`;
            payload.append('picture', photo, fileName);
        }

        const response = await Axios.getInstance().post(`/group/${group_id}/`, payload, {
            headers: { Authorization: 'real' }
        });
        return {
            group: response.data.data
        };
    }

    // Get a group
    static async get(group_id) {
        // TODO: Implement this
    }

    // Get all group in the system
    static async getAll() {
        const response = await Axios.getInstance().get('/group/');

        return {
            groups: response.data.data
        };
    }

    // Add user to group (Only the group owner can call this)
    static async addUser(user_id, group_id) {
        await Axios.getInstance().post(`/group/${group_id}/user/${user_id}/`, {}, { headers: { Authorization: 'real' } });
        return true;
    }

    // Remove user from group (Only the group owner can call this)
    static async removeUser(user_id, group_id) {
        await Axios.getInstance().delete(`/group/${group_id}/user/${user_id}/`, {}, { headers: { Authorization: 'real' } });
        return true;
    }

    // Get all users in a group
    static async getAllUsers(group_id) {
        return UserAPI.getAll(group_id);
    }

    // Create a post
    static async createPost(group_id, content, media, payload, is_sponsored, confirm_profanity) {
        const postData = new FormData();
        postData.set('content', content);
        postData.set('is_sponsored', Boolean(is_sponsored));
        postData.set('confirm_profanity', String(Boolean(confirm_profanity)));

        if (media === 'link' || media === 'youtube') {
            postData.set('link', payload);
        } else if (media === 'photo' || media === 'photo_link') {
            if (media === 'photo_link') {
                postData.set('link', payload.link);
                payload = payload.photo;
            }
            const parts = String(payload.name).split('.');
            const fileExt = parts[parts.length - 1].toLowerCase();
            if (fileExt !== 'png' && fileExt !== 'jpg' && fileExt !== 'jpeg' && fileExt !== 'gif') {
                throw new Error('Only photos with the following extensions are allowed: png, jpg, jpeg, gif');
            }
            const fileName = `${Date.now()}_${Math.round(Math.random() * 1000000)}.${fileExt}`;
            postData.append('picture', payload, fileName);
        }

        const response = await Axios.getInstance().post(`/group/${group_id}/posts/`, postData);
        return {
            post: response.data.data,
            hasProfanity: response.data.has_profanity
        };
    }

    // Get all posts in a group
    static async getAllPosts(group_id, includeDeleted) {
        const response = await Axios.getInstance().get(
            `/group/${group_id}/posts/${includeDeleted ? '?all=true' : ''}`,
            { headers: { Authorization: 'real' } }
        );
        return {
            posts: response.data.data
        };
    }

    // Get all flagged posts and comments
    static async getAllFlagged(group_id) {
        const response = await Axios.getInstance().get(`/group/${group_id}/flagged/`, {
            headers: { Authorization: 'real' }
        });
        return {
            posts: response.data.data.posts,
            comments: response.data.data.comments
        };
    }
}

export default GroupAPI;
