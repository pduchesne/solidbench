import * as React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import './solidbench.scss';
import { SessionProvider} from '@inrupt/solid-ui-react';

import {ErrorBoundary} from '@hilats/react-utils';
import {PodBrowserPanel} from "./browser/pod-browser";
import {createRoot} from "react-dom/client";
import {AppNavBar} from "./navbar";
import {AppContextProvider} from "./appContext";
import {SpotifyPanel} from "./tools/spotify";
import { ColruytDbPanel } from './tools/retail/colruytdb';
import {RetailDashboard} from "./tools/retail";
import {useCallback} from "react";
import {useNavigate} from "react-router";


const routes = [
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
        component: SpotifyPanel,
        path: '/tools/spotify'
    }

];

export const AppRouter = () => {

    // Using the BrowserRouter within GH Pages is tricky and requires a redefinition of the default 404 page
    // (cf https://github.com/orgs/community/discussions/36010)

    return (
        <BrowserRouter>
           <App />
        </BrowserRouter>
    );
};

export const App = () => {
    const navigate = useNavigate();

    const sessionRestoreCb = useCallback((url: string) => {
        const host = new URL(url).host;
        const path = url.substring(url.indexOf(host) + host.length);
        navigate(path);
    }, [history])

    return (
            <SessionProvider restorePreviousSession={true} sessionId="solidbench-app" onSessionRestore={sessionRestoreCb} onError={console.log}>
                <AppContextProvider>
                    {ctx => (
                        <div className="mainApp vFlow">
                            <AppNavBar/>
                            <div className='contentPane vFlow'>
                                <ErrorBoundary>
                                    <Routes>
                                        <Route
                                            path="/"
                                            //component={...}

                                            element={<div>Main page</div>}
                                        />

                                        {routes.map((route, i) => (
                                            <Route path={route.path} key={i} element={<route.component/>}/>
                                        ))}
                                    </Routes>
                                </ErrorBoundary>
                            </div>
                        </div>
                    )}
                </AppContextProvider>
            </SessionProvider>
    );
};

const container = document.getElementById('index');
const root = createRoot(container!);
root.render(<AppRouter/>);
