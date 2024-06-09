import React, {useCallback, useEffect, useState} from "react";

import {Devices, PlaybackState, Queue, SpotifyApi, UserProfile} from "@spotify/web-api-ts-sdk";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import Select from "@mui/material/Select/Select";
import MenuItem from "@mui/material/MenuItem/MenuItem";


/*

class SpotifyPlayer {
    private sdk: SpotifyApi;
    private profile: UserProfile;

    private state$: Promise<PlayerState>;

    constructor(sdk: SpotifyApi, profile: UserProfile) {
        this.sdk = sdk;
        this.profile = profile;

        assert(this.profile, "Must be authenticated to Spotify to obtain player instance")

        this.state$ = this.fetchState();
    }

    async fetchState(): Promise<PlayerState> {
        const queue = this.sdk.player.getUsersQueue();
        const devices = this.sdk.player.getAvailableDevices();
        const state = this.sdk.player.getPlaybackState();
        const currentlyPlaying = this.sdk.player.getCurrentlyPlayingTrack();

        return Promise.all([queue, devices, state, currentlyPlaying]).then(
            ([queue, devices, state, currentlyPlaying]) => (
                {
                    queue,
                    devices,
                    state,
                    currentlyPlaying
                }
            )
        )
    }

    async play(...args: Parameters<SpotifyApi['player']['startResumePlayback']>) {
        await this.sdk.player.startResumePlayback(...args);
        this.state$ = this.fetchState();
    }

    async pause(deviceId: string) {
        await this.sdk.player.pausePlayback(deviceId);
        this.state$ = this.fetchState();
    }

    get state () {
        return this.state$;
    }
}
 */

export type PlayerState = {
    queue: Queue,
    devices: Devices,
    state: PlaybackState,
    currentlyPlaying: PlaybackState,
    play: (...args: Parameters<SpotifyApi['player']['startResumePlayback']>) => Promise<void>,
    pause: (deviceId: string) => Promise<void>
}

export const useSpotifyPlayer = (sdk: SpotifyApi, profile?: UserProfile) => {
    const [playerstate, setPlayerstate] = useState<PlayerState>();


    const updateState = useCallback(async (full: boolean = false) => {
        if (profile) {
            const state = await sdk.player.getPlaybackState();
            const currentlyPlaying = await sdk.player.getCurrentlyPlayingTrack();

            setPlayerstate((previousState) => ({
                ...previousState!,
                state,
                currentlyPlaying}));
        }
    }, [sdk, profile]);

    const updateQueue = useCallback(async () => {
        if (profile) {
            const queue = await sdk.player.getUsersQueue();

            setPlayerstate((previousState) => ({
                ...previousState!,
                queue
            }));
        }
    }, [sdk, profile]);

    const updateDevices = useCallback(async () => {
        if (profile) {
            const devices = await sdk.player.getAvailableDevices();

            setPlayerstate((previousState) => ({
                ...previousState!,
                devices
            }));
        }
    }, [sdk, profile]);

    useEffect( () => {updateQueue()}, [playerstate?.currentlyPlaying?.item?.id] );

    useEffect( () => {updateDevices()}, [playerstate?.state?.device?.id] );

    const play = useCallback(async (...args: Parameters<typeof sdk.player.startResumePlayback>) => {
        await sdk.player.startResumePlayback(...args);
        setTimeout( () => updateState(), 100);
    }, [sdk]);

    const pause = useCallback(async (deviceId: string) => {
        await sdk.player.pausePlayback(deviceId);
        setTimeout( () => updateState(), 100);
    }, [sdk]);

    useEffect(() => {
        if (profile) {
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
        }
    }, [sdk, play, pause, profile]);

    useEffect(() => {
        if (profile) {
            const timeout = setInterval(updateState, 5000);

            return () => {
                clearInterval(timeout);
            }
        } else return undefined;
    }, [profile]);

    return playerstate;
}

function getActiveDevice(state: PlayerState | undefined) {
    return (state?.state?.device.is_active && state?.state?.device) || state?.devices?.devices.find(d => d.is_active) || state?.devices?.devices[0]
}

export const SpotifyControlBar = (props: { sdk: SpotifyApi, profile?: UserProfile }) => {

    const state = useSpotifyPlayer(props.sdk, props.profile);

    const [device, setDevice] = useState(getActiveDevice(state)?.id);

    function switchDevice(deviceId: string) {
        const activeDevice = getActiveDevice(state);
        const newDevice = state?.devices.devices.find(d => d.id == deviceId);
        if (newDevice) {
            if (activeDevice?.id != newDevice?.id && activeDevice?.is_active) {
                //state?.pause(activeDevice.id!).then(() => state?.play(newDevice.id!));
            }
            state?.play(newDevice.id!)
        }
    }

    useEffect( () => {
        const activeDevice = getActiveDevice(state);
        // if the current device is actively playing, or there's no device selected at the moment, or the selected one is no longer in the list
        if (activeDevice?.is_active || !device || !state?.devices?.devices || !state?.devices?.devices.find(d => d.id == device))
            setDevice(activeDevice?.id);
    }, [state])

    return (state && device) ? <div className="music-control-bar">
        <span className="logo"><img height="25" src={'/images/logos/Spotify_icon.svg'}/></span>
        <span className="title">{state.currentlyPlaying?.item?.name || '-'}</span>
        <span className="action">
        {state.currentlyPlaying?.is_playing ?
            <StopIcon onClick={() => {
                state?.pause(device)
            }}/> :
            <PlayArrowIcon onClick={() => {
                state?.play(device)
            }}/>}
        </span>
        {state?.devices.devices.length ?
            <Select
                value={device}
                label="Device"
                onChange={(e) => switchDevice(e.target.value)}
            > {state?.devices.devices.map(d => (<MenuItem value={d.id!}>{d.name}</MenuItem>))}
            </Select> :
            null
        }
    </div> : null
}