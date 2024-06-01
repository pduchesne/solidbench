import * as React from "react";
import Button from "@mui/material/Button/Button";
import {PromiseFnContainer} from "@hilats/react-utils";
import {MusicDataImporter, MusicDataProvider} from "../index";
import {useNavigate} from "react-router";
import {useSpotifyContext} from "./auth";

export const SpotifyCard = () => {
    const navigate = useNavigate();

    const spotifyCtx = useSpotifyContext();

    return <div>
        {spotifyCtx.authenticated ? <div>
                <PromiseFnContainer promiseFn={() => spotifyCtx.sdk.currentUser.profile()} deps={[spotifyCtx.authenticated]}>
                    {result => <>{result.id}</>}
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