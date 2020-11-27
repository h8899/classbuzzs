// TODO: This is NOT a good practice, refer to `DesignDecision.md` for more info

class LightBoxHelper {
    static lightBoxHandler = {
        show: () => {},
        hide: () => {}
    };

    static init(handler) {
        LightBoxHelper.lightBoxHandler = handler;
    }

    static show(src) {
        LightBoxHelper.lightBoxHandler.show(src);
    }

    static hide() {
        LightBoxHelper.lightBoxHandler.hide();
    }
}

export default LightBoxHelper;
