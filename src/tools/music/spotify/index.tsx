import * as React from "react";
import Button from "@mui/material/Button/Button";
import {PromiseFnContainer} from "@hilats/react-utils";
import {useSpotifyContext} from "./auth";
import {MusicDataImporter, MusicDataProvider} from "../components/ConnectSources";

export const SpotifyCard = () => {
    const spotifyCtx = useSpotifyContext();

    return <div>
        {spotifyCtx.userProfile ?
            <div>
                <div>Connected as {spotifyCtx.userProfile.display_name} [{spotifyCtx.userProfile.id}] <Button variant="outlined" onClick={() => spotifyCtx.logout()}>Disconnect</Button></div>
                <PromiseFnContainer promiseFn={() => spotifyCtx.sdk?.playlists.getUsersPlaylists(spotifyCtx.userProfile.id)} deps={[spotifyCtx.userProfile.id]}>
                    {result => <>{result.items.map(pl => <div key={pl.id}>
                        <a href={pl.href}>{pl.name}</a> [{pl.tracks.total}]
                    </div>)}</>}
                </PromiseFnContainer>
            </div> :
            <div><Button variant="outlined" onClick={() => spotifyCtx.authenticate()}>Connect Spotify</Button></div>
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