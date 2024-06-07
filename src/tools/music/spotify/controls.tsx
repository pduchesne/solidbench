import React, {useCallback, useEffect, useState} from "react";

import {Devices, PlaybackState, Queue, SpotifyApi} from "@spotify/web-api-ts-sdk";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';


export type PlayerState = {
    queue: Queue,
    devices: Devices,
    state: PlaybackState,
    currentlyPlaying: PlaybackState,
    play: (...args: Parameters<SpotifyApi['player']['startResumePlayback']>) => Promise<void>,
    pause: (deviceId: string) => Promise<void>
}

export const useSpotifyPlayer = (sdk: SpotifyApi) => {
    const [playerstate, setPlayerstate] = useState<PlayerState>();

    const updateState = useCallback( async () => {
        const state = await sdk.player.getPlaybackState();
        const currentlyPlaying = await sdk.player.getCurrentlyPlayingTrack();

        setPlayerstate((previousState) => ({...previousState!, state, currentlyPlaying}));
    }, [sdk]);

    const play = useCallback( async (...args: Parameters<typeof sdk.player.startResumePlayback>) => {
        await sdk.player.startResumePlayback(...args);
        await updateState();
    }, [sdk, updateState]);

    const pause = useCallback( async (deviceId: string) => {
        await sdk.player.pausePlayback(deviceId);
        await updateState();
    }, [sdk, updateState]);

    useEffect( () => {
        const queue = sdk.player.getUsersQueue();
        const devices = sdk.player.getAvailableDevices();
        const state = sdk.player.getPlaybackState();
        const currentlyPlaying = sdk.player.getCurrentlyPlayingTrack();

        Promise.all([queue, devices, state, currentlyPlaying]).then(
            ([queue, devices, state, currentlyPlaying]) => {
                setPlayerstate({
                    queue,
                    devices,
                    state,
                    currentlyPlaying,
                    play,
                    pause
                })
            }
        )

    }, [sdk, play, pause]);

    return playerstate;
}

export const SpotifyControlBar = (props: {sdk: SpotifyApi}) => {

    const state = useSpotifyPlayer(props.sdk);

    return state ? <div>
        {state.currentlyPlaying?.item?.name}
        {state.currentlyPlaying?.is_playing ?
            <StopIcon onClick={() => {
                state?.pause(state.state?.device?.id || state.devices.devices[0].id!)
            }}/> :
            <PlayArrowIcon onClick={() => {
                state?.play(state?.state?.device?.id || state.devices.devices[0].id!)
            }}/>}
        {state.state?.device?.name}
    </div> : null
}