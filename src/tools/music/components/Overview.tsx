import {MusicStorage} from "../storage";
import React from "react";
import {usePersistentQueryNavigate} from "../../../ui/hooks";
import {PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
import {Card, CardContent, CardHeader} from "@mui/material";
import {music} from "@hilats/data-modules";


export const MusicOverview = (props: {storage?: MusicStorage}) => {

    const playlists$ = usePromiseFn(() => props.storage?.fetchPlaylists(),[props.storage])

    return <div className="music-overview">
        <PromiseStateContainer promiseState={playlists$}>{pls => <Playlists items={pls}/>}</PromiseStateContainer>
    </div>
}

export function Playlists(props: {items: music.Playlist[]}) {
    const navigate = usePersistentQueryNavigate();

    return props.items.length > 0 ?
        <Card className="card">
            <CardHeader title="Playlists"/>
            <CardContent>
                {props.items.slice(0, 10).map(i => (
                    <div key={i.id} onClick={() => navigate('../playlists/'+encodeURIComponent(i.id))}>
                        {i.name} </div>))}
            </CardContent>
        </Card> : null
}

export default MusicOverview;