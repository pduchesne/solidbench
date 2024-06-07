import {music} from "@hilats/data-modules";

export type MusicPlayer = {
    play(item: music.MusicRecording): Promise<void>,
    pause(): Promise<void>,
}