import history from './history';

class Navigation {
    static push(url) {
        history.push(url);
    }

    static pushAsync(url) {
        setTimeout(function() {
            history.push(url);
        }, 1);
    }

    static openAsync(url) {
        setTimeout(function() {
            window.open(url);
        }, 1);
    }

    static replace(url) {
        history.replace(url);
    }
}

export default Navigation;
