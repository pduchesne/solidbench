import * as React from "react";

import {Sidenav} from "./sidenav";
import {PodBrowserPanel} from "../../browser/pod-browser";
import {RetailDashboardRoutes} from "../retail";
import {MusicDashboard} from "../music";
import {Navigate, Route, Routes, useLocation, useParams} from "react-router-dom";
import {useNavigate} from "react-router";
import {useSession} from "@inrupt/solid-ui-react";
import {useContext} from "react";
import {AppContext} from "../../appContext";
import {PodDashboardSettings} from "./settings";
import {AnnotationsDashboard} from "../annotations";
import {MoviesDashboard} from "../movies";
import {HealthDashboard} from "../health";

export const PANELS = {
    podbrowser: PodBrowserPanel,
    retail: RetailDashboardRoutes,
    music: MusicDashboard,
    settings: PodDashboardSettings,
    annotations: AnnotationsDashboard,
    movies: MoviesDashboard,
    health: HealthDashboard
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

    /*const appContext =*/ useContext(AppContext);
    /*const {fetch} = */ useSession();

    const navigate = useNavigate();

    const params = useParams();
    const panelId = (props.selectedPanel || params.panelId || 'podbrowser') as PANEL_ID;
    //const [panelId, setPanelId] = useState<keyof typeof PANELS>(props.selectedPanel || panelId || 'podbrowser');
    const Panel = PANELS[panelId];

    return <div className="hFlow">
        <Sidenav selectPanel={(panelId: string) => {navigate("/personal-dashboard/"+panelId);}} selected={panelId}/>
        <div className="contentPane">
            <Panel/>
        </div>

    </div>
}