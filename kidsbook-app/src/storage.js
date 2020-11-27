class Storage {
    static set(key, value) {
        localStorage.setItem(`test_${key}`, JSON.stringify(value));
    }

    static get(key) {
        const raw = localStorage.getItem(`test_${key}`);
        try {
            return JSON.parse(raw);
        } catch (e) {
            return raw;
        }
    }

    static remove(key) {
        localStorage.removeItem(`test_${key}`);
    }
}

export default Storage;
