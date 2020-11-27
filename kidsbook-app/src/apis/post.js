import Axios from './axios';

class PostAPI {
    // Get a specific post
    static async get(post_id) {
        const response = await Axios.getInstance().get(`/post/${post_id}/`, { headers: { Authorization: 'real' } });
        return {
            post: response.data.data
        };
    }

    // Update a specific post
    static async update(post_id, is_random, is_announcement) {
        const payload = {};
        const isDefined = (a) => (a !== null && a !== undefined);
        if (isDefined(is_random)) {
            is_random = String(Boolean(is_random));
            const chars = is_random.split('');
            chars[0] = chars[0].toUpperCase();
            payload.is_random = chars.join('');
        }
        if (isDefined(is_announcement)) {
            is_announcement = String(Boolean(is_announcement));
            const chars = is_announcement.split('');
            chars[0] = chars[0].toUpperCase();
            payload.is_announcement = chars.join('');
        }

        const response = await Axios.getInstance().post(`/post/${post_id}/`, payload, {
            headers: { Authorization: 'real' }
        });
        return {
            post: response.data.data
        };
    }

    // Get all comments for a post
    static async getAllComments(post_id, includeDeleted) {
        const response = await Axios.getInstance().get(
            `/post/${post_id}/comments/${includeDeleted ? '?all=true' : ''}`,
            { headers: { Authorization: 'real' } }
        );
        return {
            comments: response.data.data
        };
    }

    // TODO: Refactor to toggleLike
    static async createLike(post_id, like) {
        const payload = { like_or_dislike: like };
        const response = await Axios.getInstance().post(`/post/${post_id}/likes/`, payload);
        return {
            like: response.data.data.like_or_dislike,
            userId: response.data.data.user.id
        };
    }

    static async createReport(post_id) {
        const payload = { status: 'IN_PROGRESS' }; // TODO: update status to documentation
        await Axios.getInstance().post(`/post/${post_id}/flags/`, payload);
        return true;
    }

    static async createComment(post_id, content) {
        let payload = {
            content: content
        };
        const response = await Axios.getInstance().post(`/post/${post_id}/comments/`, payload);
        return {
            comment: response.data.data
        };
    }

    // Delete a post
    static async deletePost(post_id) {
        await Axios.getInstance().delete(`/post/${post_id}/`, { headers: { Authorization: 'real' } });
        return true;
    }
}

export default PostAPI;
