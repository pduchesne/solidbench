import * as React from 'react';
import {useContext, useMemo, useState} from 'react';

/*
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/turtle/turtle';
import 'codemirror/mode/javascript/javascript';

 */
import {useSession} from "@inrupt/solid-ui-react";
import {DirtyCodemirror} from "./codemirror";

import {PromiseContainer, PromiseStateContainer, PromiseState, usePromiseFn} from "@hilats/react-utils";
import {useSolidFile} from "../solid";
import {
    getContainedResourceUrlAll, getContentType,
    getSolidDataset,
    getSourceUrl,
    isContainer, isRawData,
    WithResourceInfo,
    getResourceInfo, WithServerResourceInfo, acp_ess_2
} from "@inrupt/solid-client";
import {SolidDataset} from "@inrupt/solid-client/dist/interfaces";
import {AppContext} from "../appContext";
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import {Breadcrumbs, Link} from "@mui/material";
import {CommonProps} from "@mui/material/OverridableComponent";
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import BasicTabs, {TabDescriptor} from "../ui/tabs";
import {UniversalAccessMetadata} from "./resourceAccess";


export const PodBrowserPanel = () => {

    const {fetch} = useSession();
    const appContext = useContext(AppContext)

    return appContext.podUrl ?
        <PodBrowser fileUrl={appContext.podUrl} fetch={fetch}/> :
        <div> Please login to your Solid pod to use the Pod Browser</div>;
}

/**
 * Display a breadcrumb element for a given resourceURL, displaying all path elements up to a given root.
 * @param props
 * @constructor
 */
function FileBreadcrumbs(props: { rootUrl?: string, path: string, onSelect: (url: string) => void } & CommonProps) {

    const {rootUrl, path, onSelect, ...commonProps} = props;

    // compute the root and the relative path of the file
    const [computedRoot, relPath] = useMemo(() => {
        const computedRoot = rootUrl || new URL(path).origin + '/';

        return [computedRoot, path.startsWith(computedRoot) ? path.substring(computedRoot.length) : path]
    }, [rootUrl, path])

    const pathElements = relPath.split('/');

    // create the list of all subpaths
    const subpaths = pathElements.reduce((acc: string[], path: string, idx, arr) => {
        if (path) acc.push(acc[acc.length - 1] + path + ((idx < arr.length - 1) ? '/' : ''));
        return acc;
    }, [computedRoot]);

    return (
        <Breadcrumbs aria-label="breadcrumb" {...commonProps}>
            {subpaths.map((path) => (
                    <Link
                        underline="hover"
                        color="inherit"
                        onClick={() => props.onSelect(path)}>{path.split('/').filter(e => e).pop()}</Link>
                )
            )
            }

        </Breadcrumbs>
    );
}

export const PodBrowser = (props: { fileUrl: string, fetch?: typeof fetch, displayMetadata?: boolean }) => {

    const [currentUrl, setCurrentUrl] = useState(props.fileUrl);
    const [displayMetadata, setDisplayMetadata] = useState(props.displayMetadata);
    const currentFolder = new URL('./', currentUrl).toString();

    const currentFile = useSolidFile(
        currentUrl,
        props.fetch);

    const fileBlob$ = useMemo(async () => {
        if (currentFile?.file) {
            const file = await currentFile.file;
            const content = await file.text();
            return content;
        } else {
            return undefined;
        }
    }, [currentFile?.file])

    return (
        <div className="vFlow fill">
            <div style={{flex: 0, minHeight: '25px'}}>
                <FileBreadcrumbs path={currentUrl} onSelect={setCurrentUrl} style={{display: 'inline-block'}}/>
                <FolderSharedIcon sx={{verticalAlign: 'sub', fontSize: '110%'}}
                                  onClick={() => setDisplayMetadata(!displayMetadata)}/>
            </div>
            <div className="viewer-basic hFlow" style={{flex: 1}}>
                <div>
                    <PodDirectoryTree folderUrl={currentFolder} fetch={props.fetch} onSelectFile={setCurrentUrl}/>
                </div>
                <div className="vFlow" style={{flex: 2}}>
                    {fileBlob$ ?
                        <PromiseContainer promise={fileBlob$}>
                            {(fileContent) => <DirtyCodemirror
                                value={fileContent}
                                options={{
                                    //theme: 'material',
                                    lineNumbers: true
                                }}
                                onChange={((editor, data, value) => {
                                    currentFile?.saveRawContent(value)
                                })}
                            />}
                        </PromiseContainer> : null
                    }

                </div>
                {displayMetadata ? <div className="vFlow">
                    <ResourceMetadata resourceUrl={currentUrl} fetch={props.fetch}/>
                </div> : null}
            </div>
        </div>
    );
};

export const PodDirectoryTree = (props: { folderUrl: string, fetch?: typeof fetch, onSelectFile: (url: string) => void, selected?: string }) => {

    const container$: PromiseState<{ dataset: SolidDataset & WithResourceInfo, children: string[] }> = usePromiseFn(
        async () => {
            const dataset = await getSolidDataset(
                props.folderUrl,               // File in Pod to Read
                {fetch: props.fetch}       // fetch from authenticated session
            );
            if (!isContainer(dataset))
                throw new Error('Not a folder : ' + props.folderUrl);

            const children = await getContainedResourceUrlAll(dataset);

            return {dataset, children};
        },
        [props.folderUrl, props.fetch]
    )

    return (
        <div className="vFlow">
            <PromiseStateContainer promiseState={container$}>
                {(container) => <div>
                    {container.children.map(res =>
                        <div onClick={() => props.onSelectFile(res)}
                             className={props.selected == res ? 'selected' : undefined}>
                            {res.endsWith('/') ? <FolderIcon/> : <DescriptionIcon/>}
                            {res.substring(props.folderUrl.length)}
                        </div>)}
                </div>}
            </PromiseStateContainer>
        </div>
    );
};

//type ResourceInfoWithAccess = Awaited<ReturnType<typeof acp_ess_1.getResourceInfoWithAccessDatasets>>;

export async function resolveResourceInfo(resource: string | WithResourceInfo, fetchFn?: typeof fetch) {
    return typeof resource == 'string' ?
        await acp_ess_2.getResourceInfoWithAccessDatasets(
            resource,               // File in Pod to Read
            {fetch: fetchFn}       // fetch from authenticated session
        ) : resource
}


export const ResourceMetadata = (props: { resourceUrl: string, resource?: string, fetch?: typeof fetch }) => {

    const resInfo$: PromiseState<WithServerResourceInfo> = usePromiseFn(
        async () => {
            return getResourceInfo(props.resourceUrl, {fetch: props.fetch});
        },
        [props.resourceUrl, props.fetch]
    );

    const tabs = useMemo<TabDescriptor<{ resourceUrl: string, resourceInfo: WithServerResourceInfo, fetch?: typeof fetch }>[]>(() => [
        {label: 'Description', Comp: (tabProps) => <ResourceInfo {...tabProps}/>},
        {label: 'Access', Comp: (tabProps) => <UniversalAccessMetadata {...tabProps}/>},
        {label: 'Raw', Comp: (tabProps) => <RawResourceInfo {...tabProps}/>}
    ], [resInfo$]);

    return (
        <div>
            <PromiseStateContainer promiseState={resInfo$}>
                {(resourceInfo) => <BasicTabs tabs={tabs} tabProps={{
                    resourceInfo,
                    resourceUrl: props.resourceUrl,
                    fetch: props.fetch
                }}/>}
            </PromiseStateContainer>
        </div>
    );
};


export const ResourceInfo = (props: { resourceInfo: WithResourceInfo }) => {

    return (
        <div>
            <h3>Resource Info</h3>
            <div>{getSourceUrl(props.resourceInfo)}</div>
            <div>{isRawData(props.resourceInfo)}</div>
            <div>{getContentType(props.resourceInfo)}</div>
        </div>
    );
};


export const RawResourceInfo = (props: { resourceInfo: WithResourceInfo }) => {

    return (
        <div>
            <pre>
                {JSON.stringify(props.resourceInfo, undefined, 4)}
            </pre>
        </div>
    );
};

