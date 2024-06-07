import * as React from "react";
import {useContext, useMemo} from "react";
import {AppContext} from "../../appContext";
import {Navigate, Route, Routes, useLocation, useParams, useSearchParams} from "react-router-dom";
import {SPOTIFY_SCOPES_ALL, SpotifyAuthenticator, SpotifyContextProvider, useSpotifyContext} from "./spotify/auth";
import {useFixedSolidSession} from "../../solid/SessionProvider";
import {usePersistentQueryNavigate} from "../../ui/hooks";
import Box from "@mui/material/Box/Box";
import TabContext from "@mui/lab/TabContext/TabContext";
import TabList from "@mui/lab/TabList/TabList";
import TabPanel from "@mui/lab/TabPanel/TabPanel";
import Tab from "@mui/material/Tab/Tab";
import {PlaylistsRoutes} from "./components/Playlists";
import {MemoryMusicStorage, PodMusicStorage} from "./storage";
import MusicHistory from "./components/MusicHistory";
import MusicExplore from "./components/MusicExplore";
import ConnectSources from "./components/ConnectSources";
import {SpotifyControlBar} from "./spotify/controls";
export const MusicDashboard = () => {

    const {search} = useLocation();

    return <div className="music">
        <SpotifyContextProvider clientId={process.env.SPOTIFY_CLIENTID!}
                                redirectUrl={new URL('/personal-dashboard/music/spotify/auth', window.location.toString()).toString()}
                                scopes={SPOTIFY_SCOPES_ALL}>
            <Routes>
                <Route path="/spotify/auth" element={<SpotifyAuthenticator />}/>
                <Route path="/:panelId/*" element={<MusicDataDisplay/>}/>
                <Route path="*" element={<Navigate to={"overview" + decodeURIComponent(search)} replace={true}/>}/>
            </Routes>
        </SpotifyContextProvider>

    </div>
}



export const MusicDataDisplay = () => {

    const {fetch} = useFixedSolidSession();
    const appContext = useContext(AppContext);

    const spotifyCtx = useSpotifyContext();
    const spotifyPlayer = spotifyCtx.usePlayer();

    const podStorage = useMemo(
        () => appContext.podUrl ? new PodMusicStorage(appContext.podUrl, {fetch}) : undefined,
        [appContext.podUrl, fetch]);

    const [params] = useSearchParams();
    const externalInputs = params.getAll('input');

    const memoryStorage = useMemo(
        () => externalInputs?.length ? new MemoryMusicStorage({uris: externalInputs}) : undefined,
        // must concat array to have a constant value across renderings
        [externalInputs.join(',')]);

//const preferences$ = useMemo(() => podStorage?.fetchPreferences(), [podStorage]);

    const musicStorage = memoryStorage || podStorage;

    const navigate = usePersistentQueryNavigate();
    let {panelId} = useParams();

    const tab = panelId || 'overview';

    return <>
        <Box className="retail">
            <TabContext value={tab}>
                <Box sx={{borderBottom: 1, borderColor: 'divider', flex: 'none'}}>
                    <TabList style={{flex: '1 1 100%'}} onChange={(e, value) => navigate('../' + value)}>
                        <Tab label="Overview" value="overview"/>
                        <Tab label="Playlists" value="playlists" />
                        <Tab label="History" value="history" />
                        <Tab label="Explore" value="explore" />
                        <Tab label="Connect" value="connect"/>
                        {spotifyCtx.userProfile ? <SpotifyControlBar sdk={spotifyCtx.sdk}/> : null}
                    </TabList>

                </Box>
                <TabPanel value="overview" className='vFlow'>
                    Overview
                </TabPanel>
                {musicStorage ? <>
                    <TabPanel value="playlists" className='vFlow'><PlaylistsRoutes storage={musicStorage} player={spotifyPlayer}/></TabPanel>
                    <TabPanel value="history" className='vFlow'><MusicHistory storage={musicStorage}/></TabPanel>
                    <TabPanel value="explore" className='vFlow'><MusicExplore storage={musicStorage}/></TabPanel>
                </> : null}

                <TabPanel value="connect" className='vFlow'><ConnectSources/></TabPanel>
            </TabContext>
        </Box></>
}



export default MusicDashboard;