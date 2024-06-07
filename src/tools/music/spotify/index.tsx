import * as React from "react";
import Button from "@mui/material/Button/Button";
import {PromiseFnContainer} from "@hilats/react-utils";
import {useNavigate} from "react-router";
import {useSpotifyContext} from "./auth";
import {MusicDataImporter, MusicDataProvider} from "../components/ConnectSources";

export const SpotifyCard = () => {
    const navigate = useNavigate();

    const spotifyCtx = useSpotifyContext();

    return <div>
        {spotifyCtx.userProfile ? <div>
                <div>{spotifyCtx.userProfile.display_name} [{spotifyCtx.userProfile.id}]</div>
                <PromiseFnContainer promiseFn={() => spotifyCtx.sdk?.playlists.getUsersPlaylists(spotifyCtx.userProfile.id)} deps={[spotifyCtx.userProfile.id]}>
                    {result => <>{result.items.map(pl => <div>
                        <a href={pl.href}>{pl.name}</a> [{pl.tracks.total}]
                    </div>)}</>}
                </PromiseFnContainer>
                <Button onClick={() => navigate('./import/spotify', { replace: false })}>Import Top Artists</Button>
            </div> :
            <div><Button onClick={() => spotifyCtx.authenticate()}>Connect Spotify</Button></div>
        }
    </div>
}

export const SpotifyImporter: MusicDataImporter = (props: {onClose: () => void}) => {
    return <div>
Importer
    </div>
}

export const SpotifyProvider: MusicDataProvider = {
    label: "Spotify",
    card: SpotifyCard,
    importer: SpotifyImporter
}