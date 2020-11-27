import axios from 'axios';
import Config from '../config';

class Axios {
    static axiosInstance = null;

    static getInstance() {
        if (Axios.axiosInstance) {
            return Axios.axiosInstance;
        }

        const instance = axios.create({
            baseURL: Config.apiUrl,
            timeout: Config.apiTimeout,
        });

        Axios.axiosInstance = instance;
        return instance;
    }
}

export default Axios;
