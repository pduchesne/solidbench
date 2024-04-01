import * as React from 'react';
import {BrowserRouter, Navigate, Route, Routes} from 'react-router-dom';
import './solidbench.scss';
import { SessionProvider} from '@inrupt/solid-ui-react';

import {ErrorBoundary, useDarkThemeDetector} from '@hilats/react-utils';
import {PodBrowserPanel} from "./browser/pod-browser";
import {createRoot} from "react-dom/client";
import {AppNavBar} from "./navbar";
import {AppContextProvider} from "./appContext";
import { ColruytDbPanel } from './tools/retail/colruytdb';
import {RetailDashboard} from "./tools/retail";
import {useCallback} from "react";
import {useNavigate} from "react-router";
import {DashboardRoutes, PersonalDashboard} from "./tools/personal-dashboard";
import {createTheme, ThemeProvider} from "@mui/material";
import {MusicDashboard} from "./tools/music";




const theme = createTheme({
    palette: {
        primary: {
            //light?: string;
            main: "#1976d2",
            //dark?: string;
            contrastText: "#F0F0F0"
        },
        secondary: {
            //light?: string;
            main: "#237777",
            //dark?: string;
            contrastText: "#F0F0F0"
        },
    },
});

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

const routes = [
    {
        component: PersonalDashboard,
        path: '/personal-dashboard'
    },
    {
        component: DashboardRoutes,
        path: '/personal-dashboard/*'
    },
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

    const isDarkTheme = useDarkThemeDetector();

    const sessionRestoreCb = useCallback((url: string) => {
        const host = new URL(url).host;
        const path = url.substring(url.indexOf(host) + host.length);
        navigate(path);
    }, [navigate])

    return (
            <SessionProvider restorePreviousSession={true} sessionId="solidbench-app" onSessionRestore={sessionRestoreCb} onError={console.log}>
                <AppContextProvider>
                    {ctx => (
                        <ThemeProvider theme={isDarkTheme ? darkTheme : theme}>
                        <div className="mainApp vFlow">
                            <AppNavBar/>
                            <div className='vFlow'>
                                <ErrorBoundary>
                                    <Routes>
                                        {routes.map((route, i) => (
                                            <Route path={route.path} key={i} element={<ErrorBoundary><route.component/></ErrorBoundary>}/>
                                        ))}
                                        <Route path="*" element={<Navigate to="/personal-dashboard" />} />
                                    </Routes>
                                </ErrorBoundary>
                            </div>
                        </div>
                        </ThemeProvider>
                    )}
                </AppContextProvider>
            </SessionProvider>
    );
};

const container = document.getElementById('index');
const root = createRoot(container!);
root.render(<AppRouter/>);
