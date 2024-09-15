import * as React from 'react';
import {useCallback, useEffect, useMemo, useState} from 'react';
import {
    createContainerAt,
    getFile,
    getSolidDataset,
    overwriteFile, saveFileInContainer, SolidDataset,
    WithResourceInfo, WithServerResourceInfo
} from "@inrupt/solid-client";
import {CachedPromiseState, UpdatablePromiseState, usePromiseFn} from "@hilats/react-utils";
import {_404undefined, assert} from '@hilats/utils';
import {GetFileOptions} from "@inrupt/solid-client/dist/resource/file";
import {ResourceCache} from "@hilats/solid-utils";
import ButtonGroup from '@mui/material/ButtonGroup/ButtonGroup';
import Button from '@mui/material/Button/Button';
import {LoginButton} from "./solid/LoginButton";
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

const ISSUERS: Record<string, string> = {
    "https://solidweb.me": "SolidWeb.me",
    "https://inrupt.net": "Inrupt.net",
    "https://solidcommunity.net/": "Solid Community",
    "https://login.inrupt.com/": "Inrupt Pod Spaces",
    "https://idp.use.id/": "use.id",
    "https://teamid.live": "TeamID",
    "https://openid.sandbox-pod.datanutsbedrijf.be": "Athumi Sandbox",
    "http://localhost:3000/": "Localhost Solid"
}


const str = localStorage.getItem("customSolidIssuers");
let customSolidIssuers: string[];
try {
    customSolidIssuers = str ? JSON.parse(str) : [];
} catch (e) {
    customSolidIssuers = [];
}

customSolidIssuers.forEach(i => {if (!ISSUERS[i]) {ISSUERS[i] = i}})

export const LoginMultiButton = (props: Omit<Parameters<typeof LoginButton>[0], 'oidcIssuer'>) => {
    const lastSolidIssuer = localStorage.getItem("lastSolidIssuer");
    const [issuer, setIssuer] = useState(lastSolidIssuer || "https://solidcommunity.net/");
    const [issuerInput, setIssuerInput] = useState(issuer);

    const [options, setOptions] = useState(Object.entries(ISSUERS));

    const filterOptions = createFilterOptions({
        matchFrom: 'any',
        stringify: (option: [string, string]) => option.join(' ') ,
    });

    return (
        <LoginButton {...props} oidcIssuer={issuer}>
            <ButtonGroup variant="contained" className="solid-login-multi">
                <Button variant="contained" color="primary" onClick={() => localStorage.setItem("currentSolidIssuer", issuer)}>
                    Log in &nbsp;
                </Button>
                <Autocomplete
                    filterOptions={filterOptions}
                    className="solid-provider-select"
                    sx={{'& .MuiSelect-select': {padding: "5px 6px"}}}
                    onClick={(e) => e.stopPropagation()}
                    options={options}
                    noOptionsText="Hit Enter to add your Solid Provider"
                    getOptionLabel={(option) => option[1]}
                    getOptionKey={(option) => option[0]}
                    isOptionEqualToValue={(option, value) => option[0] == value[0]}
                    onChange={(e, newValue) => {
                        newValue && setIssuer(newValue[0]);
                        e.stopPropagation();
                    }}
                    onInputChange={(e, newValue) => {
                        setIssuerInput(newValue);
                        e?.stopPropagation();
                    }}
                    value={[issuerInput, ISSUERS[issuerInput] || issuerInput]}
                    renderInput={(params) => (
                        <TextField
                            style={{padding: 0, width: 'fit-content'}}
                            {...params}
                            onClick={(e) => e.stopPropagation()}
                            label="Select"
                            variant="outlined"
                            onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                    if (options.findIndex((o) => o[0] === issuerInput) === -1) {
                                        setOptions((o) => o.concat([[issuerInput, issuerInput]]));
                                    }
                                }
                                e.stopPropagation();
                            }}
                        />
                    )}
                />

            </ButtonGroup>

        </LoginButton>
    );
};

export type SolidFile = {
    file$: CachedPromiseState<Blob & WithResourceInfo | undefined>,
    saveRawContent: (rawContent: string | Blob) => Promise<void>
}


/*
function loadRawContent(path: string,
                        fetchFn: typeof fetch) {
    return fetchFn(path)
        .then(throwOnHttpStatus)
        .then(file => file.text())
        .catch(_404undefined);
}

 */


export type SolidFileMetadata = WithResourceInfo & {
    headers: Record<string, string>
    //creationDate: string,
    //modificationDate: string,
    //contentLength: number
}

export async function getFileWithHeaders(path: string, options?: GetFileOptions): Promise<Blob & SolidFileMetadata> {
    const fetchFn: GetFileOptions['fetch'] = options?.fetch || fetch;
    const headers: Record<string, string> = {};
    const fetchOverride: GetFileOptions['fetch'] = async (url: string, init) => {
        const resp = await fetchFn(url, init);
        resp.headers.forEach((value, key) => {
            headers[key] = value
        });
        return resp;
    }
    const opts = options ? {...options, fetch: fetchOverride} : {fetch: fetchOverride};

    const file = await getFile(
        path,
        opts
    )

    Object.assign(file, {headers});

    return file as unknown as Blob & SolidFileMetadata;
}

/**
 * Create a memoized annotation container to perform storage operations on an annotation file
 * @param annotations
 * @param preselection
 * @param onNewAnnotation
 * @param onSelection
 */
export function useSolidFile(
    path: string,
    fetchFn: typeof fetch = fetch
): SolidFile {

    /*
    const [file, setFile] = useState<Promise<Blob & WithResourceInfo> | undefined>(undefined);

    useEffect(() => {
        setFile(getFile(
            path,               // File in Pod to Read
            {fetch: fetchFn}       // fetch from authenticated session
        ))
    }, [path, fetchFn]);

     */

    const file$ = usePromiseFn(() => getFile(
        path,               // File in Pod to Read
        {fetch: fetchFn}       // fetch from authenticated session
    ).catch(_404undefined), [path, fetchFn]);

    const saveRawContent = useCallback(async (rawContent: string | Blob) => {
        const blob: Blob = typeof rawContent == 'string' ? new Blob([rawContent], {
            type: (await file$.promise)?.type || undefined
        }) : rawContent;
        const newFile = overwriteFile(path, blob, {fetch: fetchFn}) as Promise<Blob & WithServerResourceInfo>;
        file$.setPromise(newFile);
    }, [path, fetchFn, file$]);

    return {
        file$,
        saveRawContent
    };
}


export type ContainerAccessor = {
    container$: UpdatablePromiseState<SolidDataset & WithResourceInfo>,
    addContainer: (name: string) => Promise<SolidDataset & WithServerResourceInfo>,
    saveFile: (name: string, file: File | Blob | string, options?: Parameters<typeof saveFileInContainer>[2]) => Promise<(Blob | File) & WithResourceInfo>
};

/**
 * Create a memoized annotation container to perform storage operations on a solid dataset
 */
export function useSolidContainer(
    path: string,
    fetchFn: typeof fetch = fetch,
    resourceCache?: ResourceCache
) {

    const container$ = usePromiseFn(async () => {
        const containerDataset = resourceCache ?
            await resourceCache.getOrFetchContainerDataset(path, fetchFn) :
            await getSolidDataset(path, {fetch: fetchFn});
        return containerDataset;
    }, [path, fetchFn], false);

    // Add listener to the cache, to reset the promise state when
    // the cache is invalidated
    useEffect( () => {
        if (resourceCache) {
            const listener = () => {
                container$.setPromise( undefined);
            };
            resourceCache.addListener(path, listener);

            // make sure the listener gets detroyed on exit
            return () => {
                resourceCache.removeListener(path, listener);
            }
        }
        return
    }, [path, container$.setPromise])

    const accessors = useMemo(() => {
        const addContainer = async (name: string) => {
            if (!name.endsWith('/')) name = name + '/';
            const result = await createContainerAt(new URL(name, path).toString(), {fetch: fetchFn});
            container$.fetch();
            return result;
        }

        const saveFile = async (name: string, file: File | Blob | string, options?: Parameters<typeof saveFileInContainer>[2]) => {
            assert(!name.endsWith('/'), 'File names must not end with a slash');

            if (typeof file == 'string') file = new Blob([file]);

            const filepath = new URL(name, path).toString();

            // const result = await saveFileInContainer(path, file, {fetch: fetchFn, ...options});
            const result = await overwriteFile(filepath, file, {fetch: fetchFn, ...options});

            resourceCache ? resourceCache.invalidate(path) : container$.fetch();
            return result;
        }

        return {container$, addContainer, saveFile}
    }, [resourceCache, path, fetchFn, container$])

    return accessors as ContainerAccessor;
}
