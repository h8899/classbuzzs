import axios from 'axios';
import Config from '../config';
import Storage from '../storage';
import isObject from 'is-object';
import Navigation from '../navigation';
import DialogHelper from '../utils/DialogHelper';
import LoadingHelper from '../utils/LoadingHelper';

const isString = (str) => {
    return str === String(str);
};

// TODO: Quickhack - Recursively get the error message
const getError = (obj) => {
    if (isObject(obj)) {
        if (isString(obj.error)) return obj.error.trim();
        const keys = Object.keys(obj);
        for (let i = 0, o; i < keys.length; i++) {
            o = obj[keys];
            if (isString(o)) {
                return o.trim();
            } else if (isObject(o)) {
                const res = getError(o);
                if (isString(res)) {
                    return res.trim();
                }
            }
        }
    }
    return null;
};

class Axios {
    static axiosInstance = {};

    // Type can be default / extension
    static getInstance(type = 'default') {
        if (Axios.axiosInstance[type]) {
            return Axios.axiosInstance[type];
        }

        const instance = axios.create({
            baseURL: type === 'extension' ? Config.extensionUrl : Config.apiUrl,
            timeout: Config.apiTimeout
        });

        instance.interceptors.request.use(
            (config) => {
                if (!isObject(config.headers)) config.headers = {};

                if (
                    config.headers.Authorization !== null &&
                    !String(config.headers.Authorization).startsWith('Bearer')
                ) {
                    if (config.headers.Authorization === 'real') {
                        config.headers.Authorization = `Bearer ${Storage.get('realToken')}`;
                    } else {
                        config.headers.Authorization = `Bearer ${Storage.get('effectiveToken')}`;
                    }
                }

                // Fail proof quick transformation (Use form-data instead of other methods)
                if (
                    String(config.method).toLowerCase() === 'post' &&
                    !String(config.headers['Content-Type'])
                        .toLowerCase()
                        .startsWith('application/json')
                ) {
                    try {
                        if (config.data instanceof FormData) throw new Error('It is already a FormData');
                        let json = isObject(config.data) ? config.data : JSON.parse(config.data);
                        let data = new FormData();
                        Object.keys(json).forEach((k) => {
                            let v = json[k];
                            if (Array.isArray(v)) {
                                v.forEach((vv) => {
                                    data.append(k, vv);
                                });
                            } else {
                                data.set(k, v);
                            }
                        });
                        config.data = data;
                        config.headers['Content-Type'] = `multipart/form-data; boundary=${data._boundary}`;
                    } catch (e) {
                        // Ignored
                    }
                }

                return config;
            },
            (err) => {
                return Promise.reject(err);
            }
        );

        instance.interceptors.response.use(
            (res) => {
                if (isObject(res) && isObject(res.data) && res.data.error) {
                    return Promise.reject(new Error(res.data.error));
                }
                return res;
            },
            (err) => {
                let errorMessage = err.message || 'Unknown error occured';
                if (isObject(err.response)) {
                    errorMessage = getError(err.response.data) || err.response.statusText || errorMessage;
                    if (err.response.status === 401) {
                        Navigation.replace('/');
                        DialogHelper.dismiss();
                        LoadingHelper.hide();
                        errorMessage = '';
                    }
                }
                return Promise.reject(new Error(errorMessage));
            }
        );

        Axios.axiosInstance[type] = instance;
        return instance;
    }
}

export default Axios;
