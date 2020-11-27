// React
import React, { Component } from 'react';
import { Provider } from 'react-redux';
import { Route } from 'react-router';
import { ConnectedRouter } from 'connected-react-router';
import { PersistGate } from 'redux-persist/integration/react';

// Material UI
import CssBaseline from '@material-ui/core/CssBaseline'; // Reset the CSS (Such as box-sizing, margin, padding etc)
import { MuiThemeProvider, createMuiTheme } from '@material-ui/core/styles';
import { SnackbarProvider } from 'notistack';

// Project
import DialogProvider from './components/DialogProvider';
import QuickfixDialogTNCProvider from './components/QuickfixDialogTNCProvider';
import LoadingProvider from './components/LoadingProvider';
import LightBoxProvider from './components/LightBoxProvider';
import MockupPage from './pages/MockupPage';
import { store, persistor } from './store';
import history from './history';
import withTracker from './utils/withTracker';
import 'react-image-lightbox/style.css'; // This only needs to be imported once in your app

// Customized theme
const theme = createMuiTheme({
    palette: {
        primary: {
            // main: '#039be5' // Light Blue 600
            // main: '#ffb300' // Amber 600
            main: '#c60000'
        },
        secondary: {
            // main: '#ffab00' // Amber A700
            // main: '#0091ea' // Light Blue A700
            main: '#0091ea'
        }
        // contrastThreshold: 1
    },
    typography: {
        useNextVariants: true
    },
    overrides: {
        MuiButton: {
            root: {
                borderRadius: '999px'
            }
        }
    }
});

class App extends Component {
    render() {
        return (
            <Provider store={store}>
                <PersistGate loading={null} persistor={persistor}>
                    <ConnectedRouter history={history}>
                        <CssBaseline>
                            <MuiThemeProvider theme={theme}>
                                <SnackbarProvider maxSnack={2} transitionDuration={{ exit: 150, enter: 150 }}>
                                    <Route component={withTracker(MockupPage, { debug: true })} />
                                </SnackbarProvider>
                                <DialogProvider />
                                <LoadingProvider />
                                <LightBoxProvider />
                                <QuickfixDialogTNCProvider />
                            </MuiThemeProvider>
                        </CssBaseline>
                    </ConnectedRouter>
                </PersistGate>
            </Provider>
        );
    }
}

export default App;
