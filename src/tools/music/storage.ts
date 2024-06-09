import {PodStorage} from "@hilats/solid-utils";
import {music} from '@hilats/data-modules';
import {fetch} from "@inrupt/solid-client-authn-browser";

export const PATH_PREFERENCES = 'preferences.json';
export const PATH_ARTISTS = 'artists.json';
export const PATH_TOP_ARTISTS = 'top_artists.json';
export const PATH_PLAYLISTS = 'playlists.json';

export type Preferences = any;


export type TopArtists = {
    artist: string;
    yearly: {y: number, sum: number}[];
}

export interface MusicStorage {

    fetchPlaylists(): Promise<music.Playlist[]>;
}

export class PodMusicStorage
    extends PodStorage
    implements MusicStorage  {

    constructor(podUri: string, options?: { fetch?: typeof fetch, podFolder?: string }) {
        const podFolder = options?.podFolder || 'music/';
        super(podUri + podFolder, options);
    }

    fetchPlaylists() {
        return this.fetchJSON<music.Playlist[]>(PATH_PLAYLISTS).then(res => res || []);
    }

    fetchTopArtists() {
        return this.fetchJSON<TopArtists[]>(PATH_TOP_ARTISTS);
    }

    saveTopArtists(artists: TopArtists[]) {
        return this.putJSON(PATH_TOP_ARTISTS, artists);
    }

    fetchArtists() {
        return this.fetchJSON<music.MusicGroup[]>(PATH_ARTISTS);
    }

    saveArtists(artists: music.MusicGroup[]) {
        return this.putJSON(PATH_ARTISTS, artists);
    }
}


export class MemoryMusicStorage implements MusicStorage {

    private _uris: string[];
    private _playlists$: Promise<music.Playlist[]>;

    constructor(options: {uris: string[], fetch?: typeof global.fetch}) {

        this._uris = options.uris;
        this._playlists$ = Promise.resolve([]);

        const {uris, fetch = global.fetch} = options;

        if (uris) this._playlists$ = this._playlists$.then(async playlists => {
            for (const uri of uris) {
                // TODO check return content type ?
                const ttlStr = await fetch(uri).then(resp => resp.text())
                const parsedPlaylists = await music.DM_MUSIC.parseTriples([ttlStr], {base: uri});

                playlists.push(...parsedPlaylists);
            }
            return playlists;
        });
    }

    fetchPlaylists(): Promise<music.Playlist[]> {
        return this._playlists$;
    }


    get uris(): string[] {
        return this._uris;
    }
}