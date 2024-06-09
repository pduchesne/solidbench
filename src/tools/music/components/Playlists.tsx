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
        <Route path="/:itemId" element={<Playlists {...props} />} />
        <Route path="*" element={<Playlists {...props} />} />
    </Routes>
}

export const Playlists = (props: {storage: MusicStorage, player?: MusicPlayer}) => {

    const navigate = usePersistentQueryNavigate();
    const playlists$ = usePromiseFn(() => props.storage.fetchPlaylists(),[props.storage])

    let { itemId } = useParams();

    return <PromiseStateContainer promiseState={playlists$}>
            {(playlists) => <div className="playlists">
                <div className="playlists-list">
                {playlists.map(pl =>
                    <div className={itemId == pl.id ? 'selected' : undefined}><a onClick={(e) => {navigate( (itemId ? '../' : './') + pl.id); e.preventDefault();}}>{pl.name || ('['+pl.id+']')}</a></div>
                )}
                </div>
                <div className="playlist-details">
                    <Playlist player={props.player} playlist={playlists.find(pl =>pl.id == itemId)} />
                </div>
            </div>}
        </PromiseStateContainer>

}

export const MusicRecording = (props: {item: music.MusicRecording, player?: MusicPlayer}) => {
    return <div>
        {props.item.name || props.item.identifier} - {props.item.inAlbum?.name} - {props.item.byArtist?.name}
        {props.player? <PlayArrowIcon onClick={() => props.player?.play(props.item)}/> : null}
    </div>
}

export const Playlist = (props: {player?: MusicPlayer, playlist?: music.Playlist}) => {

    return props.playlist ? <div>
                <h3>{props.playlist.name || ('['+props.playlist.id+']')}</h3>
                <div>
                    {props.playlist.items.map(i =>
                        <MusicRecording item={i} player={props.player}/>)}
                </div>
            </div> : null
}
