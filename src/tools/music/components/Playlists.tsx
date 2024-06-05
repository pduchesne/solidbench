import {Route, Routes, useParams} from "react-router-dom";
import * as React from "react";
import { MusicStorage } from "../storage";
import {PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
import {music} from "@hilats/data-modules";
import {usePersistentQueryNavigate} from "../../../ui/hooks";

export const PlaylistsRoutes = (props: { storage: MusicStorage }) => {
    return <Routes>
        <Route path="/:itemId" element={<Playlist {...props} />} />
        <Route path="*" element={<Playlists {...props} />} />
    </Routes>
}

export const Playlists = (props: {storage: MusicStorage}) => {

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

export const MusicRecording = (props: {item: music.MusicRecording}) => {
    return <div>{props.item.name || props.item.identifier} - {props.item.inAlbum?.name} - {props.item.byArtist?.name}</div>
}

export const Playlist = (props: {storage: MusicStorage}) => {
    let { itemId } = useParams();

    const playlist$ = usePromiseFn(() => props.storage.fetchPlaylists().then(pls => pls.find(p => p.id == itemId)) as Promise<music.Playlist | undefined>,[props.storage])

    return <div>
        <PromiseStateContainer promiseState={playlist$}>
            {(playlist) => playlist ? <div>
                {playlist.id} - {playlist.name}
                <div>
                    {playlist.items.map(i =>
                        <MusicRecording item={i}/>)}
                </div>
            </div> : null}
        </PromiseStateContainer>
    </div>
}
