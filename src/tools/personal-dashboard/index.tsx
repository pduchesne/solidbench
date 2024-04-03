import * as React from "react";

import {Sidenav} from "./sidenav";
import {PodBrowserPanel} from "../../browser/pod-browser";
import {RetailDashboard} from "../retail";
import {MusicDashboard} from "../music";
import {Navigate, Route, Routes, useParams} from "react-router-dom";
import {useNavigate} from "react-router";
import {useSession} from "@inrupt/solid-ui-react";
import {useContext} from "react";
import {AppContext} from "../../appContext";
import {PodDashboardSettings} from "./settings";

export const PANELS: Record<string, React.FC> = {
    podbrowser: PodBrowserPanel,
    retail: RetailDashboard,
    music: MusicDashboard,
    settings: PodDashboardSettings
}

export const DashboardRoutes = () => {
    return <Routes>
        <Route path="/:panelId/*" element={<PersonalDashboard />} />
        <Route path="*" element={<Navigate to="/personal-dashboard/podbrowser" />} />
    </Routes>
}


export const PersonalDashboard = (props: {selectedPanel?: string }) => {

    /*const appContext =*/ useContext(AppContext);
    /*const {fetch} = */ useSession();

    const navigate = useNavigate();

    let { panelId } = useParams();
    panelId = props.selectedPanel || panelId || 'podbrowser';
    //const [panelId, setPanelId] = useState<keyof typeof PANELS>(props.selectedPanel || panelId || 'podbrowser');
    const Panel = PANELS[panelId];

    return <div className="hFlow">
        <Sidenav selectPanel={(panelId: string) => {navigate("/personal-dashboard/"+panelId);}} selected={panelId}/>
        <div className="contentPane">
            <Panel/>
        </div>

    </div>
}