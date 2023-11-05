import * as React from 'react';
import {BrowserRouter, Route, Routes} from 'react-router-dom';
import './solidbench.scss';
import { SessionProvider} from '@inrupt/solid-ui-react';

import {ErrorBoundary} from '@hilats/react-utils';
import {PodBrowserPanel} from "./browser/pod-browser";
import {createRoot} from "react-dom/client";
import {AppNavBar} from "./navbar";
import {AppContextProvider} from "./appContext";
import {ColruytPanel} from "./tools/colruyt";
import {SpotifyPanel} from "./tools/spotify";


const routes = [
    {
        component: PodBrowserPanel,
        path: '/tools/pod-viewer'
    },
    {
        component: ColruytPanel,
        path: '/tools/colruyt'
    },
    {
        component: SpotifyPanel,
        path: '/tools/spotify'
    }

];

export const App = () => {
    return (
        <BrowserRouter>
            <SessionProvider restorePreviousSession={true} sessionId="solidbench-app" onError={console.log}>
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
        </BrowserRouter>
    );
};

const container = document.getElementById('index');
const root = createRoot(container!);
root.render(<App/>);
