import {_404undefined} from "@hilats/utils";

export const PATH_EIN_MAP = 'colruyt_ein_map.json';

export type ColruytEanMap = Record<string, {ean?: string, label: string}>;

export class ColruytDbStorage {

    private _einMap: Promise<ColruytEanMap> | undefined = undefined;
    private podUri: string;
    private fetch: typeof fetch;

    get einMap(): Promise<ColruytEanMap> {
        if (!this._einMap)
            this._einMap = this.readMap();

        return this._einMap;
    }

    constructor(podUri: string, options: { fetch?: typeof fetch } = {}) {
        this.podUri = podUri
        this.fetch = options?.fetch || fetch;
    }

    async readMap(): Promise<ColruytEanMap> {
        return (await this.fetch(this.podUri + PATH_EIN_MAP).then(resp => resp.status == 404 ? undefined : resp.json())) || {};
    }

    async putMap(map: ColruytEanMap) {
        const resp = this.fetch(this.podUri + PATH_EIN_MAP, {
            method: 'PUT',
            body: JSON.stringify(map, undefined, 4),
            headers: {'Content-Type': 'application/json'}
        });

        this._einMap = Promise.resolve(map);

        return resp;
    }
}