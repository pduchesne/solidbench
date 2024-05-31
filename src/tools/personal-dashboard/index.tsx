import * as React from "react";

import {Sidenav} from "./sidenav";

import {Navigate, Route, Routes, useLocation, useParams} from "react-router-dom";
import {useNavigate} from "react-router";
import {lazy, LazyExoticComponent, Suspense, useContext} from "react";
import {AppContext} from "../../appContext";
import { DEFAULTS } from "@hilats/react-utils";
import { ToastContainer } from 'react-toastify';
import {useFixedSolidSession} from "../../ui/hooks";

DEFAULTS.loaderMessage = 'Loading data...';

export const PANELS: Record<string, LazyExoticComponent<any>> = {
    podbrowser: lazy(() => import('../../browser/pod-browser')),
    retail: lazy(() => import('../retail')),
    music: lazy(() => import('../music')),
    settings: lazy(() => import('./settings')),
    annotations: lazy(() => import('../annotations')),
    movies: lazy(() => import('../movies')),
    health: lazy(() => import('../health'))
}
export type PANEL_ID = keyof typeof PANELS;

export const DashboardRoutes = () => {
    const {search} = useLocation();

    return <Routes>
        <Route path="/:panelId/*" element={<PersonalDashboard />} />
        <Route path="*" element={<Navigate to={"/personal-dashboard/podbrowser"+decodeURIComponent(search)} replace={true} />} />
    </Routes>
}


export const PersonalDashboard = (props: {selectedPanel?: string }) => {

    const appContext = useContext(AppContext);
    /*const {fetch} = */ useFixedSolidSession();

    const navigate = useNavigate();

    const params = useParams();
    const panelId = (props.selectedPanel || params.panelId || 'podbrowser') as PANEL_ID;
    //const [panelId, setPanelId] = useState<keyof typeof PANELS>(props.selectedPanel || panelId || 'podbrowser');
    const Panel = PANELS[panelId];

    return <div className="hFlow">
        <Sidenav selectPanel={(panelId: string) => {navigate("/personal-dashboard/"+panelId);}} selected={panelId}/>
        <div className="contentPane">
            <Suspense fallback={<DEFAULTS.Loader message="Loading UI..."/>}>
                <Panel/>
            </Suspense>
            <ToastContainer theme={appContext.theme}/>
        </div>

    </div>
}