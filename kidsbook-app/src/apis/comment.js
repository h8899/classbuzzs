import Axios from './axios';

class CommentAPI {
    // Get a specific comment
    static async get(comment_id) {
        const response = await Axios.getInstance().get(`/comment/${comment_id}/`, { headers: { Authorization: 'real' } });
        return {
            comment: response.data.data
        };
    }

    static async createLike(comment_id, like) {
        const payload = { like_or_dislike: like };
        const response = await Axios.getInstance().post(`/comment/${comment_id}/likes/`, payload);
        return {
            like: response.data.data.like_or_dislike,
            userId: response.data.data.user.id
        };
    }

    static async createReport(comment_id) {
        const payload = { status: 'IN_PROGRESS' };
        await Axios.getInstance().post(`/comment/${comment_id}/flags/`, payload);
        return true;
    }

    // Delete a post
    static async deleteComment(comment_id) {
        await Axios.getInstance().delete(`/comment/${comment_id}/`);
        return true;
    }
}

export default CommentAPI;
