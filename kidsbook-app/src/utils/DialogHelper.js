// TODO: This is NOT a good practice, refer to `DesignDecision.md` for more info

class DialogHelper {
    static dialogHandler = {
        show: () => {},
        dismiss: () => {}
    };

    static init(handler) {
        DialogHelper.dialogHandler = handler;
    }

    static showDialog(options) {
        DialogHelper.dialogHandler.show(options);
    }

    static dismiss() {
        DialogHelper.dialogHandler.dismiss();
    }
}

export default DialogHelper;
