import Axios from './axios';
import isObject from 'is-object';
import { getNotificationSettings } from '../serviceWorker';

class ExtensionAPI {
    static async checkNotificationSettings() {
        let data = { enabled: false };
        let subscription;

        try {
            subscription = await getNotificationSettings();
        } catch (e) {
            // Ignored
        }

        if (isObject(subscription)) {
            const response = await Axios.getInstance('extension').get(
                `/ext/notification/${encodeURIComponent(subscription.endpoint)}`
            );
            data = response.data.data;
        }

        return {
            enabled: data.enabled
        };
    }

    static async updateNotificationSettings(subscription) {
        const payload = {
            subscription: isObject(subscription) ? JSON.stringify(subscription) : null
        };

        await Axios.getInstance('extension').post('/ext/notification', payload);
        return true;
    }

    static async pushNewAction(groupId, payload) {
        const bodyPayload = {
            payload: JSON.stringify(payload)
        };

        await Axios.getInstance('extension').post(`/ext/pushAction/group/${groupId}`, bodyPayload);
        return true;
    }

    static async updateAction(actionId, extra, isProcessed) {
        const payload = {
            extra: JSON.stringify(extra),
            isProcessed: Boolean(isProcessed)
        };

        await Axios.getInstance('extension').post(`/ext/pushAction/${actionId}`, payload);
        return true;
    }

    static async getAllGroupActionResponses(groupId) {
        const responses = await Axios.getInstance('extension').get(`/ext/pushAction/group/${groupId}`);
        return responses.data;
    }
}

export default ExtensionAPI;
