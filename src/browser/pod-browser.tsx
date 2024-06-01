import * as React from 'react';
import {useCallback, useContext, useEffect, useMemo, useState} from 'react';

import {CachedPromiseState, PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
import {useSolidContainer, useSolidFile} from "../solid";
import {
    acp_ess_2, deleteFile, getContainedResourceUrlAll,
    getContentType,
    getResourceInfo,
    getSourceUrl,
    overwriteFile,
    WithResourceInfo,
    WithServerResourceInfo
} from "@inrupt/solid-client";
import {AppContext} from "../appContext";
import FolderIcon from '@mui/icons-material/Folder';
import DescriptionIcon from '@mui/icons-material/Description';
import DeleteIcon from '@mui/icons-material/Delete';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import {CommonProps} from "@mui/material/OverridableComponent";
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import InfoIcon from '@mui/icons-material/Info';
import HomeIcon from '@mui/icons-material/Home';
import EditIcon from '@mui/icons-material/Edit';
import GlobeIcon from '@mui/icons-material/Language';
import BasicTabs, {TabDescriptor} from "../ui/tabs";
import {UniversalAccessMetadata} from "./resourceAccess";
import {getResourceName, sanitizeResourceName} from "@hilats/solid-utils";
import classNames from "classnames";
import {PodDirectoryTree} from "./podTree";
import RadarIcon from '@mui/icons-material/Radar';
import {useNavigate} from "react-router";
import {Navigate, Route, Routes, useParams} from "react-router-dom";
import {PodOverview} from "./overview";
import {ModalComponent, useModal} from "../ui/modal";
import {getViewer, guessContentType} from "./viewers/GenericViewer";
import {getEditor} from "./viewers/GenericEditor";
import Dropzone from "react-dropzone";
import {ABSURL_REGEX, assert, getParentUrl, MIME_REGISTRY, WELL_KNOWN_TYPES} from "@hilats/utils";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Markdown from "react-markdown";
import Breadcrumbs from "@mui/material/Breadcrumbs/Breadcrumbs";
import Link from "@mui/material/Link/Link";
import Input from "@mui/material/Input/Input";
import {Link as RouterLink} from 'react-router-dom';

import {MODULE_REGISTRY, retail} from "@hilats/data-modules";
import {toast} from "react-toastify";
import {useFixedSolidSession} from "../solid/SessionProvider";

export const PodBrowserPanel = () => {

    return <PodBrowserRoutes/>
}

/**
 * Display a breadcrumb element for a given resourceURL, displaying all path elements up to a given root.
 * @param props
 * @constructor
 */
function FileBreadcrumbs(props: { rootUrl?: string, path: string, onSelect: (url: string) => void } & CommonProps) {

    const [editMode, setEditMode] = useState(false);

    const {rootUrl, path, onSelect, ...commonProps} = props;

    // compute the root and the relative path of the file
    const [computedRoot, relPath] = useMemo(() => {
        const computedRoot = rootUrl || new URL(path).origin + '/';

        return [computedRoot, path.startsWith(computedRoot) ? path.substring(computedRoot.length) : path]
    }, [rootUrl, path])

    const pathElements = relPath.split('/');

    // create a list of [pathLabel, path] for each subpath
    const subpaths = pathElements.reduce<[string,string][]>((acc, path: string, idx, arr) => {
        if (path) acc.push( [
            path,
            acc[acc.length - 1][1] + path + ((idx < arr.length - 1) ? '/' : '')
        ] );
        return acc;
    }, [[computedRoot.endsWith('/') ? computedRoot.substring(0, computedRoot.length-1) : computedRoot, computedRoot]]);

    return (
        editMode?
            <Input defaultValue={props.path}
                   onBlur={(e) => {
                       props.onSelect(e.target.value);
                       setEditMode(false)
                   } }/> :
            <Breadcrumbs aria-label="breadcrumb" {...commonProps} onDoubleClick={() => setEditMode(true)}>
                <Link
                    title={computedRoot}
                    key={computedRoot}
                    underline="hover"
                    color="inherit"
                    onClick={(e) => {props.onSelect(subpaths[0][1]); e.stopPropagation();} }>
                    {props.rootUrl ?
                        <HomeIcon style={{marginRight: '3px'}}/> :
                        <><GlobeIcon style={{marginRight: '3px'}}/>{subpaths[0][0]}</>
                    }
                </Link>

                {subpaths.slice(1).map(([label, path]) => (
                        <Link
                            title={path}
                            key={path}
                            underline="hover"
                            color="inherit"
                            onClick={() => props.onSelect(path)}>{label}</Link>
                    )
                )
                }

            </Breadcrumbs>
    );
}


export const PodBrowserRoutes = (props: { rootUrl?: string, fetch?: typeof fetch, displayMetadata?: boolean }) => {
    return <Routes>
        <Route path="/" element={<PodBrowser {...props}/>}/>
        <Route path="/welcome" element={<Navigate to="../$EXT/https://pod.solidbench.dev/"/>}/>
        <Route path="/overview" element={<PodBrowser {...props}/>}/>
        <Route path="/:ROOT/*" element={<PodBrowser {...props}/>}/>
    </Routes>
}


export const CreateResourceDialog: ModalComponent<{ resourceName: string }> = (props) => {
    return <div>
        <Input placeholder="Name"
               value={props.values.resourceName}
               onChange={(e) => {
                   props.onChange({...props.values, resourceName: e.target.value})
               }}/>
    </div>
}

export type ResourceAction = {
    title: string,
    icon: React.ElementType,
    onClick: (uri: string) => Promise<void>
}


export const PodBrowser = (props: { rootUrl?: string, fetch?: typeof fetch, displayMetadata?: boolean }) => {

    const session = useFixedSolidSession();
    const fetch = props.fetch || session.fetch;

    const [selectedResource, setSelectedResource] = useState<string | undefined>();
    const params = useParams();
    const navigate = useNavigate();
    const [displayMetadata, setDisplayMetadata] = useState(props.displayMetadata);

    const appContext = useContext(AppContext);

    const [modal, openModal] = useModal();

    const {ROOT= '-', '*' : RES_PATH} = params;

    const deleteResourceCb = useCallback(async (uri: string) => {
        openModal({
            title: "Delete " + uri,
            description: "Are you sure you want to delete this resource ?",
            onOk: async () => {
                await deleteFile(uri, {fetch});
                appContext.cache?.invalidate(uri, true);

                //  let's go to the parent
                navigateToResource(getParentUrl(uri));
            }
        })

    }, [fetch, appContext.cache]);

    const addResourceCb = useCallback(async (containerUri: string) => {
        const onOk = (async (values: { resourceName: string }) => {
            const newUri = new URL(sanitizeResourceName(values.resourceName), containerUri).toString();
            const type = MIME_REGISTRY.guessMimeType(newUri);
            await overwriteFile(newUri, new Blob([""]), {fetch, contentType: type});

            // let's open the new resource
            navigateToResource(newUri);
            appContext.cache?.invalidate(containerUri);
        });
        openModal({
            title: "Create resource",
            component: CreateResourceDialog,
            initValue: {resourceName: "NewFile.txt"},
            onOk
        })

    }, [fetch, appContext.cache]);


    const addContainerCb = useCallback(async (containerUri: string) => {
        const onOk = (async (values: { resourceName: string }) => {
            const newUri = new URL(sanitizeResourceName(values.resourceName) + "/", containerUri).toString();
            await overwriteFile(newUri, new Blob([""], {type: "text/turtle"}), {fetch});

            // let's open the new resource
            navigateToResource(newUri);
            appContext.cache?.invalidate(containerUri);
        });
        openModal({
            title: "Create folder",
            component: CreateResourceDialog,
            initValue: {resourceName: "NewFolder"},
            onOk
        })

    }, [fetch, appContext.cache]);

    const podUrl = props.rootUrl || appContext.podUrl;

    const navigateToResource = useCallback((resPath: string) => {
        const newPath =
                resPath.match(ABSURL_REGEX) ?
                    // we have an absolute URL
                    (podUrl && resPath.startsWith(podUrl) ?
                        // TODO have a list of roots and search through them to find the matching alias
                        resPath.replace(podUrl, '../-/') :
                        // it's not matching a known root -> browse it as external
                        '../$EXT/'+resPath) :
                    // it's not an absolute URL. let's assume it is relative to the main root
                    '../-/'+resPath
        ;
        navigate(newPath);
    }, [podUrl, navigate]);

    const currentUrl = useMemo(() => {
        if (ROOT == '$EXT') {
            assert(RES_PATH, "No resource path provided for external resource");
            assert(RES_PATH.match(ABSURL_REGEX), "External URL cannot be relative")
            return RES_PATH;
        }
        else {
            // TODO support other roots
            if (ROOT == '-') {
                return podUrl + (RES_PATH || '');
            } else
                throw new Error("Unknown root alias : " + ROOT);
        }
    }, [podUrl, RES_PATH, ROOT])

    const [resourceActions, setResourceActions] = useState<ResourceAction[]>([]);

    useEffect(() => {
        if (currentUrl.endsWith('/'))
            setSelectedResource(undefined);
        else
            setSelectedResource(currentUrl);
    }, [currentUrl]);

    const anchorClickCallback = useCallback((e: React.MouseEvent) => {
        //console.log(e.type + " : " + e.currentTarget.tagName);
        if (e.target instanceof HTMLAnchorElement && e.target.href && !e.target.target) {
            e.preventDefault();
            const relUri = e.target.href.replace(e.target.baseURI, './')
            navigateToResource(new URL(relUri, currentUrl).toString());
        }
    }, [navigateToResource]);

    // TODO not very clean way
    const isOverview = currentUrl.endsWith('/overview');
    const isFolder = currentUrl.endsWith('/');

    return (
        (!podUrl && ROOT != '$EXT') ?
            ( !RES_PATH ? <Navigate to="../welcome"/> : <div className="paddedPanel">Please login to browse your pod</div>):
            <div className="vFlow fill podbrowser" onClick={anchorClickCallback}>
                <div className="podbrowser-body">
                    {podUrl ?
                        // TODO display a sidenav if external URL is a pod ?
                        <div className="podbrowser-sidenav">
                            <div className="podbrowser-sidenav-quicklinks">
                                <div onClick={() => navigate('../welcome', {relative: 'route', replace: false})}>
                                    <InfoIcon/> welcome
                                </div>
                                <div onClick={() => navigate('../overview', {relative: 'route', replace: false})}>
                                    <RadarIcon/> overview
                                </div>
                            </div>

                            <div className="podbrowser-tree">
                                <PodDirectoryTree folderUrl={podUrl} fetch={fetch}
                                                  onNavigateToResource={(path) => navigate(path.replace(podUrl, '../-/'), {
                                                      relative: 'route',
                                                      replace: false
                                                  })}
                                                  selected={currentUrl}/>
                            </div>
                        </div> : null}

                    <div className="podbrowser-resource">
                        <div className="topbar">
                            <FileBreadcrumbs path={currentUrl} onSelect={navigateToResource}
                                             rootUrl={ROOT == '-' ? podUrl : undefined}
                                             className='filebreadcrumb'/>
                            <div className='file_actions'>
                                {(!isFolder || selectedResource) ? <DeleteIcon titleAccess="Delete Resource"
                                                                onClick={() => deleteResourceCb(isFolder ? selectedResource! : currentUrl)}/> : null}
                                {isFolder ? <>
                                    <CreateNewFolderIcon titleAccess="Create Folder"
                                                         onClick={() => addContainerCb(currentUrl)}/>
                                    <NoteAddIcon titleAccess="Create File" onClick={() => addResourceCb(currentUrl)}/>
                                </> : null}
                                {resourceActions.map(action =>
                                    <action.icon onClick={() => action.onClick(currentUrl)} titleAccess={action.title} />)}
                                <InfoIcon titleAccess="Display Metadata" sx={{verticalAlign: 'sub', fontSize: '110%'}}
                                          onClick={() => setDisplayMetadata(!displayMetadata)}/>
                            </div>

                        </div>
                        {isOverview ?
                            // podUrl cannot be undefined because it is not an EXT URL
                            <PodOverview folderUrl={podUrl!} fetch={fetch}/> :
                            <div className="hFlow">
                                <div className="podbrowser-resource-viewer">
                                    {
                                        isFolder ?
                                            <ContainerViewer uri={currentUrl} fetch={fetch}
                                                             onNavigateToResource={navigateToResource}
                                                             onSelectResource={setSelectedResource}/> :
                                            <FileViewerWithFetch uri={currentUrl}
                                                                 fetch={fetch}
                                                                 setResourceActions={setResourceActions}/>
                                    }

                                </div>
                                {displayMetadata ? <div className="podbrowser-resource-metadata">
                                    <ResourceMetadata resourceUrl={currentUrl} fetch={fetch}/>
                                </div> : null}
                            </div>}
                    </div>
                </div>
                {modal}
            </div>
    );
};


export const FileViewerWithFetch = (props: { uri: string, fetch?: typeof fetch, edition?: boolean, setResourceActions?: (actions: ResourceAction[]) => void }) => {

    const {fetch, ...otherProps} = props;

    const currentFile = useSolidFile(
        props.uri,
        fetch);

    const onSave = useCallback((content: string | Blob) => currentFile?.saveRawContent(content), [currentFile]);

    return <PromiseStateContainer promiseState={currentFile.file$}>
        {(blob) =>  blob ?
                <FileViewer {...otherProps} content={blob} onSave={onSave} /> :
                <div>
                    Resource not found
                </div>
        }
    </PromiseStateContainer>
}


export const FileViewer = (props: { uri: string, content: Blob | string, edition?: boolean, onSave: (content: string | Blob) => Promise<void>, setResourceActions?: (actions: ResourceAction[]) => void }) => {

    const {edition, onSave, ...otherProps} = props;

    const [editMode, setEditMode] = useState(edition);

    const [Viewer, Editor, contentType] = useMemo(() => {
        const contentType = guessContentType(props.content, undefined, props.uri);

        const [viewer] = getViewer(undefined, contentType, undefined);
        const [editor] = getEditor(undefined, contentType, undefined);

        if (editor) {
            if(viewer != editor) {
                props.setResourceActions && props.setResourceActions([{
                    icon: EditIcon,
                    title: "Edit",
                    onClick: async () => {
                        setEditMode(prevState => !prevState);
                    }
                }]);
            } else {
                if (edition == undefined) setEditMode(true);
            }
        }

        return [
            viewer,
            editor,
            contentType
        ];
    }, [props.content, props.uri])

    useEffect(() => {
        if ((contentType == WELL_KNOWN_TYPES.ttl || contentType == WELL_KNOWN_TYPES.nq || contentType == WELL_KNOWN_TYPES.nt)) {
            Object.entries(MODULE_REGISTRY.modules).forEach( ([key, module]) => {
                module.matches(props.content, contentType).then(result => {
                    if (result.matches.length)
                        toast(() => <div>
                            This resource can be best viewed in your <RouterLink to={`/personal-dashboard/${key}?input=${encodeURIComponent(props.uri)}`}>{key} dashboard</RouterLink>
                        </div>);
                })
            })
            retail.DM_RETAIL.matches(props.content)
        }
    }, [contentType]);

    return editMode ?
        <Editor {...otherProps} type={contentType} onSave={onSave} /> :
        <Viewer {...otherProps} type={contentType} />
}




export type ResourceViewerProps = {
    uri: string,
    fetch?: typeof fetch,
    onNavigateToResource: (url: string) => void,
    onSelectResource: (url?: string) => void,
};

export const ContainerViewer = (props: ResourceViewerProps & {
    display?: 'grid' | 'details'
}) => {
    const appContext = useContext(AppContext);

    const {display = 'grid'} = props;
    const [selected, setSelected] = useState<string>();

    const containerAccessor = useSolidContainer(
        props.uri,
        props.fetch,
        appContext.cache);

    return <PromiseStateContainer promiseState={containerAccessor.container$}>
        {(container) => {
            const childResources = getContainedResourceUrlAll(container);
            const readme = childResources.find(r => r.toLowerCase().endsWith('readme.md') || r.toLowerCase().endsWith('readme.txt'))
            return <div className="container-viewer">
                {readme ?
                    <div className="container-readme">
                        <div className="container-readme-quicklink" title="See README file"><a onClick={() => props.onNavigateToResource(readme)}><OpenInNewIcon/></a></div>
                        <ReadmeViewer uri={readme} fetch={props.fetch}/>
                    </div> : null }
                <Dropzone noClick={true} onDrop={acceptedFiles => acceptedFiles.forEach(f => containerAccessor.saveFile(f.name, f))}>
                    {({getRootProps, getInputProps}) => (
                        <div {...getRootProps()} className="container-resources">
                            <input {...getInputProps()} />
                            <div
                                className={'container-resource-list ' + display} onClick={() => {
                                setSelected(undefined);
                                props.onSelectResource(undefined)
                            }}>
                                {childResources.map(res =>
                                    <div key={res}
                                         onClick={(e) => {
                                             setSelected(res);
                                             props.onSelectResource(res);
                                             e.stopPropagation();
                                         }}
                                         onDoubleClick={() => props.onNavigateToResource(res)}
                                         className={classNames('resource', {selected: selected == res})}>
                                        {res.endsWith('/') ? <FolderIcon/> : <DescriptionIcon/>}
                                        <div className="resource-name">{getResourceName(res)}</div>
                                    </div>)}
                                <div className="container-drag-hint">Drag and drop files here to upload</div>
                            </div>
                        </div>)
                    }
                </Dropzone>
            </div>
            }
        }
</PromiseStateContainer>
}



export const ReadmeViewer = (props: {
    uri: string,
    fetch?: typeof fetch
}) => {
    const readmeFile = useSolidFile(
        props.uri,
        props.fetch);

    const text$ = readmeFile.file$.useThen(async (f) => f?.text());

    return <PromiseStateContainer promiseState={text$}>
        {(readme) =>
            <div>
                <Markdown>{readme}</Markdown>
            </div>
        }
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
            <h4>Resource Info</h4>
            <div><a target="_blank" href={getSourceUrl(props.resourceInfo)}>{getSourceUrl(props.resourceInfo)}</a></div>
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

export default PodBrowserPanel;