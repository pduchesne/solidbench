import * as React from "react";
import {FC, useContext, useMemo} from "react";
import {ErrorBoundary} from "@hilats/react-utils";
import {AppContext} from "../../appContext";
import {MusicStorage} from "./storage";
import {SpotifyProvider} from "./spotify";
import {Route, Routes, useParams} from "react-router-dom";
import {useNavigate} from "react-router";
import {SPOTIFY_SCOPES_ALL, SpotifyAuthenticator, SpotifyContextProvider} from "./spotify/auth";
import {useFixedSolidSession} from "../../solid/SessionProvider";

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

    const {fetch} = useFixedSolidSession();
    const appContext = useContext(AppContext);

    //const [importerAction, setimporterAction] = useState<{importer: MusicDataImporter<any>, props: any}>();

    const musicStorage = useMemo(() => appContext.podUrl ? new MusicStorage(appContext.podUrl, {fetch}) : undefined, [appContext.podUrl, fetch]);
    //const preferences$ = useMemo(() => musicStorage?.fetchPreferences(), [musicStorage]);
    musicStorage
    return <div className="music">
        <SpotifyContextProvider clientId='7ca9684301bc4f62ac837fa96c00c179' redirectUrl={new URL('/personal-dashboard/music/spotify/auth', window.location.toString()).toString()} scopes={SPOTIFY_SCOPES_ALL}>
            <ImporterCards/>
            <Routes>
                <Route path="/spotify/auth" element={<SpotifyAuthenticator />}/>
                <Route path="/import/:source" Component={MusicImporter}/>
                <Route path="/" Component={MusicDataDisplay}/>
            </Routes>
        </SpotifyContextProvider>

    </div>
}


export const MusicImporter = () => {

    const {source} = useParams();
    const navigate = useNavigate();

    const Importer = MUSICDATAPROVIDERS[source!].importer;

    return <div>CLOSE<Importer onClose={() => navigate('.', {replace: false})}/></div>
}


export const MusicDataDisplay = () => {

    const {fetch} = useFixedSolidSession();
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