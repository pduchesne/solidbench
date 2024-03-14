import {PodStorage} from "@hilats/solid-utils";
import {_404undefined} from "@hilats/utils";


export const PATH_PREFERENCES = 'preferences.json';
export const PATH_ARTISTS = 'artists.json';
export const PATH_TOP_ARTISTS = 'top_artists.json';

export type Preferences = any;

export type Artist = {
    name: string;
    mb?: string;
    sp?: string;
    wd?: string;
    lfm?: string;
}
export type Album = {
    name: string;
    artist: string;
}

export type TopArtists = {
    artist: string;
    yearly: {y: number, sum: number}[];
}

export class MusicStorage extends PodStorage {

    constructor(podUri: string, options?: { fetch?: typeof fetch, podFolder?: string }) {
        const podFolder = options?.podFolder || 'music/';
        super(podUri + podFolder, options);
    }

    fetchTopArtists() {
        return this.fetchJSON<TopArtists[]>(PATH_TOP_ARTISTS);
    }

    saveTopArtists(artists: TopArtists[]) {
        return this.putJSON(PATH_TOP_ARTISTS, artists);
    }

    fetchArtists() {
        return this.fetchJSON<Artist[]>(PATH_ARTISTS);
    }

    saveArtists(artists: Artist[]) {
        return this.putJSON(PATH_ARTISTS, artists);
    }
}