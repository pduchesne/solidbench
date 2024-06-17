import {PodStorage} from "@hilats/solid-utils";
import {fetch} from "@inrupt/solid-client-authn-browser";
import {Annotation, BOOKMARKS_FOLDER, loadAnnotations} from "@hilats/annotations-core";

export const PATH_ANNOTATIONS = 'annotations.ttl';

export interface AnnotationStorage {
    fetchAnnotations(): Promise<Annotation[]>;
}

export class PodAnnotationStorage
    extends PodStorage
    implements AnnotationStorage  {

    constructor(podUri: string, options?: { fetch?: typeof fetch, podFolder?: string }) {
        const podFolder = options?.podFolder || BOOKMARKS_FOLDER;
        super(podUri + podFolder, options);
    }

    fetchAnnotations() {
        return loadAnnotations(this.getResourceUri(PATH_ANNOTATIONS), this.fetch).then(res => res.annotations);
    }
}


export class MemoryAnnotationStorage implements AnnotationStorage {

    private _uris: string[];
    private _annotations$: Promise<Annotation[]>;

    constructor(options: {uris: string[], fetch?: typeof global.fetch}) {

        this._uris = options.uris;
        this._annotations$ = Promise.resolve([]);

        const {uris, fetch = global.fetch} = options;

        if (uris) this._annotations$ = this._annotations$.then(async annotations => {
            for (const uri of uris) {
                const parsedAnnotations = await loadAnnotations(uri, fetch).then(res => res.annotations);

                annotations.push(...parsedAnnotations);
            }
            return annotations;
        });
    }

    fetchAnnotations() {
        return this._annotations$;
    }

    get uris(): string[] {
        return this._uris;
    }
}