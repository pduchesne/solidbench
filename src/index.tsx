//import './wdyr';

import 'react-toastify/dist/ReactToastify.css';

import * as React from 'react';
import {memo, useCallback} from 'react';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import './solidbench.scss';

import {ErrorBoundary, DEFAULTS} from '@hilats/react-utils';
import {createRoot} from "react-dom/client";
import {AppNavBar} from "./navbar";
import {AppContextProvider} from "./appContext";
import {useNavigate} from "react-router";
import {DashboardRoutes} from "./tools/personal-dashboard";
import classNames from "classnames";
import {AppThemeProvider} from "./theme";
import {SessionProvider, useFixedSolidSession} from "./solid/SessionProvider";
import {SolidAuth} from "./solid/auth";
import {MODULE_REGISTRY} from "@hilats/data-modules";
import {DM_ANNOTATIONS} from "@hilats/annotations-core";

MODULE_REGISTRY.registerModule(DM_ANNOTATIONS);

const routes = [
    {
        component: DashboardRoutes,
        path: '/personal-dashboard/*'
    },
    /*
    {
        component: PodBrowserPanel,
        path: '/tools/pod-viewer'
    },

    {
        component: RetailDashboard,
        path: '/tools/retail'
    },
    {
        component: ColruytDbPanel,
        path: '/tools/retail/colruytdb'
    },
    {
        component: MusicDashboard,
        path: '/tools/spotify'
    }

     */

];

export const AppRouter = () => {

    // Using the BrowserRouter within GH Pages is tricky and requires a redefinition of the default 404 page
    // (cf https://github.com/orgs/community/discussions/36010)

    return (
        <BrowserRouter>
            <App/>
        </BrowserRouter>
    );
};


const MemoSessionProvider = memo(SessionProvider);

export const AppWithContext = memo(() => {

    const session = useFixedSolidSession();

    /*
    useEffect(() => {
        console.log("sessionRequestInProgress: " + session.sessionRequestInProgress)
    }, [session.sessionRequestInProgress]);

    useEffect(() => {
        console.log("fetch: " + session.fetch)
    }, [session.fetch]);

    useEffect(() => {
        console.log("isLoggedIn: " + session.session.info.isLoggedIn)
    }, [session.session.info.isLoggedIn]);

     */

    return <AppThemeProvider>
        <div className={classNames("mainApp", "vFlow")}>
            <AppNavBar/>
            {session.sessionRequestInProgress ?
                <DEFAULTS.Loader message={"Authenticating..."}/> :
                <div className='vFlow'>
                    <ErrorBoundary>
                        <Routes>
                            <Route path="/auth/solid" element={<SolidAuth />}/>
                            {routes.map((route, i) => (
                                <Route path={route.path} key={i} element={<ErrorBoundary>
                                    <route.component/>
                                </ErrorBoundary>}/>
                            ))}
                            <Route path="*" element={<Navigate to="/personal-dashboard"/>}/>
                        </Routes>
                    </ErrorBoundary>
                </div>
            }
        </div>
    </AppThemeProvider>
})

// try to restore session only if current url is not an auth endpoint
const shouldRestoreSession = (url: string) => url.indexOf('/auth') < 0 ;

export const App = memo(() => {
    const navigate = useNavigate();

    // callback for when a session has been restored
    // should redirect to the URL present before the auth restoration
    const sessionRestoreCb = useCallback((url_before_auth: string) => {
        // we want to navigate in react-router terms
        // --> extract the path and use react-router navigate
        const host = new URL(url_before_auth).host;
        const path = url_before_auth.substring(url_before_auth.indexOf(host) + host.length);
        navigate(path);
        // See this issue for navigate : https://github.com/remix-run/react-router/issues/7634
    }, [ /* navigate TODO WARN this means the navigate function will never get updated, and therefore cannot be used for relative navigation*/ ]);

    return (
        <MemoSessionProvider restorePreviousSession={shouldRestoreSession}
                             sessionId="solidbench-app"
                             sessionRequestInProgress={false}
                             onSessionRestore={sessionRestoreCb}
                             onSessionLogin={() => navigate('/personal/dashboard')}
                             // TODO loading the profile is useless as of now, but skipping it causes abug
                             // see https://github.com/inrupt/solid-ui-react/issues/970
                             //skipLoadingProfile={true}
                         onError={console.log}>
            <AppContextProvider>
                <AppWithContext />
            </AppContextProvider>
        </MemoSessionProvider>
    );
});


const container = document.getElementById('index');
const root = createRoot(container!);
root.render(<AppRouter/>);
