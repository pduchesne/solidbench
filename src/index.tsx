//import './wdyr';

import 'react-toastify/dist/ReactToastify.css';

import * as React from 'react';
import {memo, useCallback} from 'react';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import './solidbench.scss';
import {SessionProvider} from '@inrupt/solid-ui-react';

import {ErrorBoundary, DEFAULTS} from '@hilats/react-utils';
import {createRoot} from "react-dom/client";
import {AppNavBar} from "./navbar";
import {AppContextProvider} from "./appContext";
import {useNavigate} from "react-router";
import {DashboardRoutes} from "./tools/personal-dashboard";
import classNames from "classnames";
import {AppThemeProvider} from "./theme";
import {useFixedSolidSession} from "./ui/hooks";

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

export const App = memo(() => {
    const navigate = useNavigate();

    const sessionRestoreCb = useCallback((url: string) => {
        const host = new URL(url).host;
        const path = url.substring(url.indexOf(host) + host.length);
        navigate(path);
        // See this issue for navigate : https://github.com/remix-run/react-router/issues/7634
    }, [ /* navigate TODO WARN this means the navigate function will never get updated, and therefore cannot be used for relative navigation*/ ]);

    return (
        <MemoSessionProvider restorePreviousSession={true}
                             sessionId="solidbench-app"
                             onSessionRestore={sessionRestoreCb}
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
