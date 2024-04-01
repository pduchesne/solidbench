import * as React from 'react';
import {useEffect, useMemo, useState} from 'react';
import {LoginButton} from '@inrupt/solid-ui-react';
import {Button, MenuItem, Select} from "@mui/material";
import {
    createContainerAt,
    getContainedResourceUrlAll,
    getFile,
    getSolidDataset,
    overwriteFile, saveFileInContainer,
    WithResourceInfo
} from "@inrupt/solid-client";
import {usePromiseFn} from "@hilats/react-utils";
import { assert } from '@hilats/utils';
import {GetFileOptions} from "@inrupt/solid-client/dist/resource/file";

const ISSUERS: Record<string, string> = {
    //"https://openid.sandbox-pod.datanutsbedrijf.be": "DNB Sandbox",
    "https://solidweb.me": "SolidWeb.me",
    "https://inrupt.net": "Inrupt.net",
    "https://solidcommunity.net/": "Solid Community",
    "https://login.inrupt.com/": "Inrupt Pod Spaces",
    "https://idp.use.id/": "use.id",
    "https://teamid.live": "TeamID",
    "http://localhost:3000/": "Localhost Solid",
}

export const LoginMultiButton = (props: Omit<Parameters<typeof LoginButton>[0], 'oidcIssuer'>) => {
    const [issuer, setIssuer] = useState("https://login.inrupt.com/");

    return (
        <LoginButton {...props} oidcIssuer={issuer}>
            <Button variant="contained" color="primary">
                Log in with&nbsp;
                <Select
                    sx={{ '& .MuiSelect-select': {padding: "5px 6px"}}}
                    value={issuer}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => {
                        setIssuer(e.target.value as string);
                        e.stopPropagation()
                    }}
                >
                    {Object.keys(ISSUERS).map(uri => <MenuItem value={uri} key={uri}>{ISSUERS[uri]}</MenuItem>)}
                </Select>
            </Button>
        </LoginButton>
    );
};

export type SolidFile = {
    file: Promise<Blob & WithResourceInfo>,
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
): SolidFile | undefined {

    const [file, setFile] = useState<Promise<Blob & WithResourceInfo> | undefined>(undefined);

    useEffect(() => {
        setFile(getFile(
            path,               // File in Pod to Read
            {fetch: fetchFn}       // fetch from authenticated session
        ))
    }, [path, fetchFn]);

    const container = useMemo(() => {

        const saveRawContent = async (rawContent: string | Blob) => {
            const blob: Blob = typeof rawContent == 'string' ? new Blob([rawContent], {
                type: file ? (await file).type : undefined
            }) : rawContent;
            const newFile = overwriteFile(path, blob, {fetch: fetchFn});
            setFile(newFile);
        };

        return file ? {
            file,
            saveRawContent
        } : undefined;

    }, [path, fetchFn, file]);


    return container;
}



/**
 * Create a memoized annotation container to perform storage operations on a solid dataset
 */
export function useSolidContainer(
    path: string,
    fetchFn: typeof fetch = fetch
) {

    const accessor = usePromiseFn( async () => {
        const containerDataset = await getSolidDataset(path, {fetch: fetchFn});

        const children = getContainedResourceUrlAll(containerDataset);

        const addContainer = async (name: string) => {
            if (!name.endsWith('/')) name = name+'/';
            const result = await createContainerAt(new URL(name, path).toString(), {fetch: fetchFn});
            accessor.fetch();
            return result;
        }

        const saveFile = async (name: string, file: File | Blob, options?: Parameters<typeof saveFileInContainer>[2]) => {
            assert(! name.endsWith('/'), 'File names must not end with a slash');
            const result = await saveFileInContainer(new URL(name, path).toString(), file, {fetch: fetchFn, ...options});
            accessor.fetch();
            return result;
        }

        return {containerDataset, children, addContainer, saveFile};
    }, [path, fetchFn])

    return accessor;
}
