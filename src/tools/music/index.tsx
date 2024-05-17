import * as React from "react";
import {FC, useContext, useMemo} from "react";
import {ErrorBoundary} from "@hilats/react-utils";
import {useSession} from "@inrupt/solid-ui-react";
import {AppContext} from "../../appContext";
import {MusicStorage} from "./storage";
import {SpotifyProvider} from "./spotify";
import {Route, Routes, useParams} from "react-router-dom";
import {useNavigate} from "react-router";

export type MusicDataImporter<T = {}> = FC<T & {onClose: () => void}>;

export type ProviderCard<T> = FC<{ onAction:(props: T) => void}>;

export type MusicDataProvider<T = {}> = { label: string, card: ProviderCard<T>, importer: MusicDataImporter<T> };

/**
 * Import UI components for specific retailers
 */
const MUSICDATAPROVIDERS: Record<string, MusicDataProvider> = {
    spotify: SpotifyProvider,
    lastfm: SpotifyProvider
}

export const MusicDashboard = () => {

    const {fetch} = useSession();
    const appContext = useContext(AppContext);

    //const [importerAction, setimporterAction] = useState<{importer: MusicDataImporter<any>, props: any}>();

    const musicStorage = useMemo(() => appContext.podUrl ? new MusicStorage(appContext.podUrl, {fetch}) : undefined, [appContext.podUrl, fetch]);
    //const preferences$ = useMemo(() => musicStorage?.fetchPreferences(), [musicStorage]);
    musicStorage
    return <div className="retail">
        <ImporterCards/>
        <Routes>
            <Route path="/import/:source" Component={MusicImporter}/>
            <Route path="/" Component={MusicDataDisplay}/>
        </Routes>
    </div>
}


export const MusicImporter = () => {

    const {source} = useParams();
    const navigate = useNavigate();

    const Importer = MUSICDATAPROVIDERS[source!].importer;

    return <div>CLOSE<Importer onClose={() => navigate('.', {replace: false})}/></div>
}


export const MusicDataDisplay = () => {

    const {fetch} = useSession();
    const appContext = useContext(AppContext);

    const musicStorage = useMemo(() => appContext.podUrl ? new MusicStorage(appContext.podUrl, {fetch}) : undefined, [appContext.podUrl, fetch]);
    //const preferences$ = useMemo(() => musicStorage?.fetchPreferences(), [musicStorage]);
    musicStorage
    return <ErrorBoundary>
        <div>TODO</div>
    </ErrorBoundary>
}

export const ImporterCards = () => {
    return <div className="hFlow dataproviders">
        {Object.entries(MUSICDATAPROVIDERS).map(([retailer, config]) => {
            return <div className="providerCard">
                {config.label}
                <config.card onAction={() => {
                }}/>
            </div>
        })}
    </div>
}

export default MusicDashboard;