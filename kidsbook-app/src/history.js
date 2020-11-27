import { createBrowserHistory } from 'history';
import DialogHelper from './utils/DialogHelper';
import LightBoxHelper from './utils/LightBoxHelper';

const history = createBrowserHistory();

// TODO: Might not be reliable to rely on this to hide dialog
history.listen(() => {
    DialogHelper.dismiss();
    LightBoxHelper.hide();
});

export default history;
