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

import LibraryMusicIcon from '@mui/icons-material/LibraryMusic';

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