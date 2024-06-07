import {Route, Routes, useParams} from "react-router-dom";
import * as React from "react";
import { MusicStorage } from "../storage";
import {PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
import {music} from "@hilats/data-modules";
import {usePersistentQueryNavigate} from "../../../ui/hooks";
import {MusicPlayer} from "../types";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';

export const PlaylistsRoutes = (props: { storage: MusicStorage, player?: MusicPlayer }) => {
    return <Routes>
        <Route path="/:itemId" element={<Playlist {...props} />} />
        <Route path="*" element={<Playlists {...props} />} />
    </Routes>
}

export const Playlists = (props: {storage: MusicStorage, player?: MusicPlayer}) => {

    const navigate = usePersistentQueryNavigate();
    const playlists$ = usePromiseFn(() => props.storage.fetchPlaylists(),[props.storage])

    return <div>
        <PromiseStateContainer promiseState={playlists$}>
            {(playlists) => <div>
                {playlists.map(pl => <div><a onClick={(e) => {navigate('./'+pl.id); e.preventDefault();}}>{pl.id}</a></div>)}
            </div>}
        </PromiseStateContainer>
    </div>
}

export const MusicRecording = (props: {item: music.MusicRecording, player?: MusicPlayer}) => {
    return <div>
        {props.item.name || props.item.identifier} - {props.item.inAlbum?.name} - {props.item.byArtist?.name}
        {props.player? <PlayArrowIcon onClick={() => props.player?.play(props.item)}/> : null}
    </div>
}

export const Playlist = (props: {storage: MusicStorage, player?: MusicPlayer}) => {
    let { itemId } = useParams();

    const playlist$ = usePromiseFn(() => props.storage.fetchPlaylists().then(pls => pls.find(p => p.id == itemId)) as Promise<music.Playlist | undefined>,[props.storage])

    return <div>
        <PromiseStateContainer promiseState={playlist$}>
            {(playlist) => playlist ? <div>
                <h3>{playlist.id} - {playlist.name}</h3>
                <div>
                    {playlist.items.map(i =>
                        <MusicRecording item={i} player={props.player}/>)}
                </div>
            </div> : null}
        </PromiseStateContainer>
    </div>
}
