import * as React from "react";

import {Sidenav} from "./sidenav";

import {Navigate, Route, Routes, useLocation, useParams} from "react-router-dom";
import {useNavigate} from "react-router";
import {lazy, Suspense, useContext, useMemo} from "react";
import { DEFAULTS } from "@hilats/react-utils";
import { APP_REGISTRY, AppDescriptor } from "@hilats/data-modules";
import {useFixedSolidSession} from "../../solid/SessionProvider";
import { APP_ROOT } from "../..";

import {AppContext} from "../../appContext";
import { PodStorage, MemoryStorage } from "@hilats/solid-utils";

import LocalGroceryStoreIcon from '@mui/icons-material/LocalGroceryStore';
import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';
// import MonitorHeartIcon from '@mui/icons-material/MonitorHeart';
// import MovieIcon from '@mui/icons-material/Movie';
import CommentIcon from '@mui/icons-material/Comment';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AssistantIcon from '@mui/icons-material/Assistant';

APP_REGISTRY.registerModule({
    id: 'retail',
    label: 'Retail Dashboard',
    icon: LocalGroceryStoreIcon,
    loadApp: () => import('@hilats/solid-app-retail').then(m => m.default)
})

APP_REGISTRY.registerModule({
    id: 'annotations',
    label: 'Annotation Dashboard',
    icon: CommentIcon,
    loadApp: () => import('../annotations').then(m => m.default)
})

APP_REGISTRY.registerModule( {
    id: 'music',
    label: 'Music Dashboard',
    icon: LibraryMusicIcon,
    loadApp: () => import('@hilats/solid-app-music').then(m => m.default)
})

APP_REGISTRY.registerModule({
    id: 'assistant',
    label: 'AI Assistant',
    icon: AssistantIcon,
    loadApp: () => import('@hilats/solid-app-assistant').then(m => m.default)
})

APP_REGISTRY.registerModule({
    id: 'template',
    label: 'Template Dashboard',
    icon: DashboardIcon,
    loadApp: () => import('@hilats/solid-app-template').then(m => m.default)
})

/*

export const PANELS: Record<string, LazyExoticComponent<PersonalDataApp>> = {
    podbrowser: lazy(() => import('../../browser/pod-browser')),
    retail: lazy(() => import('../retail')),
    //music: lazy(() => import('../music')),
    settings: lazy(() => import('./settings')),
    annotations: lazy(() => import('../annotations')),
    movies: lazy(() => import('../movies')),
    health: lazy(() => import('../health')),
}

Object.entries(APP_REGISTRY.items).forEach( ([id, appDescriptor]) => {
    PANELS[appDescriptor.id] = lazy(() => appDescriptor.loadApp().then(app => ({default: app})));
});

 */

DEFAULTS.loaderMessage = 'Loading data...';

const appDescriptors: Record<string, AppDescriptor> = APP_REGISTRY.items

const PANELS: Record<string, AppDescriptor> = {
    podbrowser: {
        id: 'podbrowser',
        label: 'Pod Browser',
        icon: LibraryMusicIcon,
        loadApp: () => import('../../browser/pod-browser').then(m => m.default)
    },
    settings: {
        id: 'settings',
        label: 'Settings',
        icon: LibraryMusicIcon,
        loadApp: () => import('./settings').then(m => m.default)
    },
    ...appDescriptors
}

export const DashboardRoutes = () => {
    const {search} = useLocation();

    return <Routes>
        <Route path="/:panelId/*" element={<PersonalDashboard />} />
        <Route path="*" element={<Navigate to={APP_ROOT+"podbrowser"+decodeURIComponent(search)} replace={true} />} />
    </Routes>
}


export const PersonalDashboard = (props: {selectedPanel?: string }) => {

    /*const {fetch} = */ useFixedSolidSession();

    const navigate = useNavigate();

    const params = useParams();
    const panelId = (props.selectedPanel || params.panelId || 'podbrowser');
    //const [panelId, setPanelId] = useState<keyof typeof PANELS>(props.selectedPanel || panelId || 'podbrowser');
    const Panel = lazy(() => PANELS[panelId].loadApp().then((app) => ({default: app})));

    const {fetch} = useFixedSolidSession();
    const appContext = useContext(AppContext);

    const podStorage = useMemo(
        () => appContext.podUrl ? new PodStorage(appContext.podUrl, {fetch}) : new MemoryStorage(),
        [appContext.podUrl, fetch]);

    return <div className="hFlow">
        <Sidenav selectPanel={(panelId: string) => {navigate(APP_ROOT+panelId);}} selected={panelId} customPanels={appDescriptors}/>
        <div className="contentPane">
            <Suspense fallback={<DEFAULTS.Loader message="Loading UI..."/>}>
                <Panel APP_ROOT={APP_ROOT+panelId+'/'} storage={podStorage} theme={appContext.theme}/>
            </Suspense>
        </div>

    </div>
}