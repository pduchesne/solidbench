import * as React from 'react';
import {useCallback, useContext, useMemo, useState} from 'react';

/*
import 'codemirror/lib/codemirror.css';
import 'codemirror/theme/material.css';
import 'codemirror/mode/xml/xml';
import 'codemirror/mode/turtle/turtle';
import 'codemirror/mode/javascript/javascript';

 */
import {useSession} from "@inrupt/solid-ui-react";
import {DirtyCodemirror} from "./codemirror";

import {CachedPromiseState, PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
import {useSolidContainer, useSolidFile} from "../solid";
import {
    acp_ess_2,
    getContentType,
    getResourceInfo,
    getSourceUrl,
    isRawData,
    WithResourceInfo,
    WithServerResourceInfo
} from "@inrupt/solid-client";
import {AppContext} from "../appContext";
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import {Breadcrumbs, Link} from "@mui/material";
import {CommonProps} from "@mui/material/OverridableComponent";
import FolderSharedIcon from '@mui/icons-material/FolderShared';
import BasicTabs, {TabDescriptor} from "../ui/tabs";
import {UniversalAccessMetadata} from "./resourceAccess";
import {getResourceName} from "@hilats/solid-utils";
import classNames from "classnames";
import {PodDirectoryTree} from "./podTree";
import RadarIcon from '@mui/icons-material/Radar';
import {useNavigate} from "react-router";
import {Route, Routes, useParams} from "react-router-dom";
import {PodOverview} from "./overview";


export const PodBrowserPanel = () => {

    const {fetch} = useSession();
    const appContext = useContext(AppContext);

    return appContext.podUrl ?
        <PodBrowserRoutes rootUrl={appContext.podUrl} fetch={fetch}/> :
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
                        key={path}
                        underline="hover"
                        color="inherit"
                        onClick={() => props.onSelect(path)}>{path.split('/').filter(e => e).pop()}</Link>
                )
            )
            }

        </Breadcrumbs>
    );
}


export const PodBrowserRoutes = (props: { rootUrl: string, fetch?: typeof fetch, displayMetadata?: boolean }) => {
    return <Routes>
        <Route path="/" element={<PodBrowser {...props}/>}/>
        <Route path="/overview" element={<PodBrowser {...props}/>}/>
        <Route path="/:ROOT/*" element={<PodBrowser {...props}/>}/>
    </Routes>
}


export const PodBrowser = (props: { rootUrl: string, fetch?: typeof fetch, displayMetadata?: boolean }) => {

    const params = useParams();
    console.log(JSON.stringify(params));
    const navigate = useNavigate();
    const [displayMetadata, setDisplayMetadata] = useState(props.displayMetadata);

    /*
    const [currentUrl, setCurrentUrl] = useState(props.rootUrl);
    useEffect(() => {
        // TODO support other roots
        const path = props.rootUrl + (params['*'] || '');
        setCurrentUrl(path);
    }, [props.rootUrl, params['*'], params.ROOT]);

     */

    const navigateToResource = useCallback((resPath: string) => {
        const relativePath = resPath.replace(props.rootUrl, '../-/');
        navigate(relativePath);
    }, [props.rootUrl, navigate]);

    const currentUrl = useMemo(() => {
        // TODO support other roots
        const path = props.rootUrl + (params['*'] || '');
        return path;
    }, [props.rootUrl, params['*'], params.ROOT])

    return (
        <div className="vFlow fill podbrowser">
            <div className="topbar">
                <FileBreadcrumbs path={currentUrl} onSelect={navigateToResource} style={{display: 'inline-block'}}
                                 className='filebreadcrumb'/>
                <FolderSharedIcon sx={{verticalAlign: 'sub', fontSize: '110%'}}
                                  onClick={() => setDisplayMetadata(!displayMetadata)}/>
            </div>
            <div className="podbrowser-body">
                <div className="podbrowser-sidenav">
                    <div className="podbrowser-sidenav-quicklinks">
                        <div onClick={() => navigate('../overview', {relative: 'route', replace: false})}>
                            <RadarIcon/> overview
                        </div>
                    </div>
                    <div className="podbrowser-tree">
                        <PodDirectoryTree folderUrl={props.rootUrl} fetch={props.fetch}
                                          onSelectFile={(path) => navigate(path.replace(props.rootUrl, '../-/'), {
                                              relative: 'route',
                                              replace: false
                                          })}
                                          selected={currentUrl}/>
                    </div>
                </div>

                {currentUrl.endsWith('/overview') ?
                    <PodOverview folderUrl={props.rootUrl} fetch={props.fetch}/> :
                    <>
                        <div className="podbrowser-resource-viewer">
                            {
                                currentUrl.endsWith('/') ?
                                    <ContainerViewer uri={currentUrl} fetch={props.fetch}
                                                     onSelectResource={navigateToResource}/> :
                                    <FileViewer uri={currentUrl} fetch={props.fetch}/>
                            }

                        </div>
                        {displayMetadata ? <div className="vFlow">
                            <ResourceMetadata resourceUrl={currentUrl} fetch={props.fetch}/>
                        </div> : null}
                    </>}
            </div>
        </div>
    );
};


export const FileViewer = (props: { uri: string, fetch?: typeof fetch }) => {
    const currentFile = useSolidFile(
        props.uri,
        props.fetch);

    const fileBlob$ = currentFile.file$.then(file => file.text());

    return fileBlob$ ?
        <PromiseStateContainer promiseState={fileBlob$}>
            {(fileContent) => <DirtyCodemirror
                value={fileContent}
                options={{
                    theme: 'material',
                    lineNumbers: true
                }}
                onChange={((editor, data, value) => {
                    currentFile?.saveRawContent(value)
                })}
            />}
        </PromiseStateContainer> : <div>No file content</div>
}


export const ContainerViewer = (props: {
    uri: string,
    fetch?: typeof fetch,
    display?: 'grid' | 'details',
    onSelectResource: (url: string) => void
}) => {
    const {display = 'grid'} = props;
    const [selected, setSelected] = useState<string>();

    const containerAccessor$ = useSolidContainer(
        props.uri,
        props.fetch);

    return <PromiseStateContainer promiseState={containerAccessor$}>
        {(containerAccessor) => <div className={'container-viewer ' + display}>
            {containerAccessor.children.map(res =>
                <div key={res}
                     onClick={() => setSelected(res)}
                     onDoubleClick={() => props.onSelectResource(res)}
                     className={classNames('resource', {selected: selected == res})}>
                    {res.endsWith('/') ? <FolderIcon/> : <DescriptionIcon/>}
                    <div>{getResourceName(res)}</div>
                </div>)}
        </div>}
    </PromiseStateContainer>
}


//type ResourceInfoWithAccess = Awaited<ReturnType<typeof acp_ess_1.getResourceInfoWithAccessDatasets>>;

export async function resolveResourceInfo(resource: string | WithResourceInfo, fetchFn?: typeof fetch) {
    return typeof resource == 'string' ?
        await acp_ess_2.getResourceInfoWithAccessDatasets(
            resource,               // File in Pod to Read
            {fetch: fetchFn}       // fetch from authenticated session
        ) : resource
}


export const ResourceMetadata = (props: { resourceUrl: string, resource?: string, fetch?: typeof fetch }) => {

    const resInfo$: CachedPromiseState<WithServerResourceInfo> = usePromiseFn(
        async () => {
            return getResourceInfo(props.resourceUrl, {fetch: props.fetch});
        },
        [props.resourceUrl, props.fetch]
    );

    const tabs = useMemo<TabDescriptor<{
        resourceUrl: string,
        resourceInfo: WithServerResourceInfo,
        onUpdate: () => void,
        fetch?: typeof fetch
    }>[]>(() => [
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
                    onUpdate: () => resInfo$.fetch(),
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

