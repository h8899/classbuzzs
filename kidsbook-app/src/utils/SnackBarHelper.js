// TODO: This is NOT a good practice, refer to `DesignDecision.md` for more info

class SnackBarHelper {
    static snackBarHandler = () => {};

    static init(handler) {
        SnackBarHelper.snackBarHandler = handler;
    }

    static enqueueSnackbar(message, options) {
        if (message && String(message).trim().length > 0) {
            SnackBarHelper.snackBarHandler(message, options);
        }
    }
}

export default SnackBarHelper;
