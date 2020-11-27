// TODO: This is NOT a good practice, refer to `DesignDecision.md` for more info

class LoadingHelper {
    static loadingHandler = {
        show: () => {},
        hide: () => {}
    };

    static init(handler) {
        LoadingHelper.loadingHandler = handler;
    }

    static show(message) {
        LoadingHelper.loadingHandler.show(message);
    }

    static hide() {
        LoadingHelper.loadingHandler.hide();
    }
}

export default LoadingHelper;
