import * as React from "react";
import {useSpotifyContext} from "./tools";
import {Scopes} from "@spotify/web-api-ts-sdk";
import {Button} from "@mui/material";
import {PromiseFnContainer} from "@hilats/react-utils";
import {MusicDataImporter, MusicDataProvider} from "../index";
import {useNavigate} from "react-router";

// Store the scopes as a const, because 'Scopes.all' returns a new array on each call
const SCOPES_ALL = Scopes.all;

export const SpotifyCard = () => {
    const navigate = useNavigate();

    const spotifyCtx = useSpotifyContext(
        '7ca9684301bc4f62ac837fa96c00c179',
      new URL('/personal-dashboard/music', window.location.toString()).toString() /* 'https://localhost:8000/tools/spotify' */,
        SCOPES_ALL
    );

    return <div>
        {spotifyCtx.authenticated ? <div>
                <PromiseFnContainer promiseFn={() => spotifyCtx.sdk!.currentUser.profile()} deps={[spotifyCtx.authenticated]}>
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