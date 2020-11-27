import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import * as serviceWorker from './serviceWorker';
import DialogConfirm from './utils/DialogConfirm';

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.register({
    onUpdate: () => {
        DialogConfirm.show('New version', 'A new version of ClassBuzz is available, do you want to load it now?', (confirm) => {
            if (confirm) {
                window.location.reload();
            }
        });
    }
});
