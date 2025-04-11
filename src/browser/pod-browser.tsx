import * as React from 'react';
import {useCallback, useContext, useEffect, useMemo, useRef, useState} from 'react';

import {CachedPromiseState, PromiseStateContainer, WebResourceDescriptorUrl, usePromiseFn} from "@hilats/react-utils";
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
import {ABSURL_REGEX, assert, FetchOptions, getParentUrl, MIME_REGISTRY} from "@hilats/utils";
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Markdown from "react-markdown";
import Breadcrumbs from "@mui/material/Breadcrumbs/Breadcrumbs";
import Link from "@mui/material/Link/Link";
import Input from "@mui/material/Input/Input";
import CloseIcon from '@mui/icons-material/Close';
import FullscreenIcon from '@mui/icons-material/Fullscreen';
import FullscreenExitIcon from '@mui/icons-material/FullscreenExit';

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
    const inputRef = useRef<HTMLInputElement>();

    const {rootUrl, path, onSelect, className, ...commonProps} = props;

    // compute the root and the relative path of the file
    const [computedRoot, relPath] = useMemo(() => {
        const computedRoot = rootUrl || new URL(path).origin + '/';

        return [computedRoot, path.startsWith(computedRoot) ? path.substring(computedRoot.length) : path]
    }, [rootUrl, path])

    const pathElements = relPath.split('/');

    // create a list of [pathLabel, path] for each subpath
    const subpaths = pathElements.reduce<[string, string][]>((acc, path: string, idx, arr) => {
        if (path) acc.push([
            path,
            acc[acc.length - 1][1] + path + ((idx < arr.length - 1) ? '/' : '')
        ]);
        return acc;
    }, [[computedRoot.endsWith('/') ? computedRoot.substring(0, computedRoot.length - 1) : computedRoot, computedRoot]]);

    const handleInputEnter = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            setEditMode(false);
            props.onSelect(e.currentTarget.value);
        }
    }, []);

    return (
        <div className={className} onDoubleClick={() => setEditMode(true)}>{
            editMode ?
                <Input className="breadcrumb-input"
                       defaultValue={props.path}
                       onKeyDown={handleInputEnter}
                       ref={inputRef}
                       onBlur={(e) => setEditMode(false)}
                       autoFocus
                /> :
                <Breadcrumbs aria-label="breadcrumb" {...commonProps}>
                    <Link
                        title={props.rootUrl ? computedRoot : 'External URL'}
                        key={computedRoot}
                        underline="hover"
                        color="inherit"
                        onClick={(e) => {
                            props.onSelect(subpaths[0][1]);
                            e.stopPropagation();
                        }}>
                        {props.rootUrl ?
                            <HomeIcon/> :
                            <><GlobeIcon/>{subpaths[0][0]}</>
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
        }
            <span title="Edit URL"><EditIcon className="edit-action"  onClick={() => {
                setEditMode(!editMode);
            }}/></span>
            <span title="Open in browser tab"><OpenInNewIcon className="edit-action" onClick={() => {
                window.open(new URL(path, rootUrl).toString(), "blank")
            }}/></span>
        </div>
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
    const fetchOptions = useMemo<FetchOptions>( () => ({fetch}), [fetch]);

    const [selectedResource, setSelectedResource] = useState<string | undefined>();
    const params = useParams();
    const navigate = useNavigate();
    const [displayMetadata, setDisplayMetadata] = useState(props.displayMetadata);

    const appContext = useContext(AppContext);

    const [modal, openModal] = useModal();

    const {ROOT = '-', '*': RES_PATH} = params;

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
            const type = MIME_REGISTRY.guessMimeType(newUri) || MIME_REGISTRY.getMimeType("txt");
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
                    '../$EXT/' + resPath) :
                // it's not an absolute URL. let's assume it is relative to the main root
                '../-/' + resPath
        ;
        navigate(newPath);
    }, [podUrl, navigate]);

    const currentUrl = useMemo(() => {
        if (ROOT == '$EXT') {
            assert(RES_PATH, "No resource path provided for external resource");
            assert(RES_PATH.match(ABSURL_REGEX), "External URL cannot be relative")
            return RES_PATH;
        } else {
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

    /*
    This callback intercepts all clicks on <a href> elements within the pod browser
    and replaces the natural browser navigation with pod-relative resolution
     */
    const anchorClickCallback = useCallback((e: React.MouseEvent) => {
        //console.log(e.type + " : " + e.currentTarget.tagName);
        if (e.target instanceof HTMLAnchorElement &&
            e.target.href &&
            !e.target.target &&
            !e.target.href.startsWith('mailto')) {
            let hrefValue = e.target.attributes.getNamedItem("href")?.value || e.target.href;
            if (!hrefValue.match(ABSURL_REGEX)) {
                hrefValue = new URL(hrefValue, currentUrl).toString();
            }
            navigateToResource(hrefValue);
            e.preventDefault();
        }
    }, [navigateToResource]);

    // TODO not very clean way
    const isOverview = currentUrl.endsWith('/overview');
    const isFolder = currentUrl.endsWith('/');


    const resource = useMemo<WebResourceDescriptorUrl>(() => ({
        uri: currentUrl
    }), [currentUrl]);

    return (
        (!podUrl && ROOT != '$EXT') ?
            (!RES_PATH ? <Navigate to="../welcome"/> :
                <div className="paddedPanel">Please login to browse your pod</div>) :
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
                                {resourceActions.map(action =>
                                    <action.icon onClick={() => action.onClick(currentUrl)}
                                                 titleAccess={action.title}/>)}
                                {(!isFolder || selectedResource) ? <DeleteIcon titleAccess="Delete Resource"
                                                                               onClick={() => deleteResourceCb(isFolder ? selectedResource! : currentUrl)}/> : null}
                                {isFolder ? <>
                                    <CreateNewFolderIcon titleAccess="Create Folder"
                                                         onClick={() => addContainerCb(currentUrl)}/>
                                    <NoteAddIcon titleAccess="Create File" onClick={() => addResourceCb(currentUrl)}/>
                                </> : null}
                                <InfoIcon titleAccess="Display Metadata"
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
                                            <FileViewer resource={resource}
                                                        fetchOptions={fetchOptions}
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

export const FileViewer = (props: {
    resource: WebResourceDescriptorUrl,
    fetchOptions?: FetchOptions,
    edition?: boolean,
    setResourceActions?: (actions: ResourceAction[]) => void
}) => {

    const {edition, setResourceActions, ...otherProps} = props;

    const [editMode, setEditMode] = useState(edition);
    const [fullScreen, setFullScreen] = useState(false);

    const resourceWithType = useMemo(() => {
        return guessContentType(props.resource);
    }, [props.resource])

    const [Viewer, Editor] = useMemo(() => {

        const [viewer] = getViewer(resourceWithType);
        const [editor] = getEditor(resourceWithType);

        return [
            viewer,
            editor
        ];
    }, [resourceWithType]);

    const resourceActions = useMemo(() => {
            const resourceActions: ResourceAction[] = [];

            if (Editor) {
                if (Viewer != Editor) {
                    if (editMode)
                        resourceActions.push({
                            icon: CloseIcon,
                            title: "Stop Editing",
                            onClick: async () => {
                                setEditMode(false);
                            }
                        });
                    else {
                        resourceActions.push({
                            icon: EditIcon,
                            title: "Edit",
                            onClick: async () => {
                                setEditMode(true);
                            }
                        });
                    }
                }

                if (!editMode) {
                    if (fullScreen) {
                        resourceActions.push({
                            icon: FullscreenExitIcon,
                            title: "Exit Full Screen",
                            onClick: async () => {
                                setFullScreen(false);
                            }
                        });
                    } else {
                        resourceActions.push({
                            icon: FullscreenIcon,
                            title: "Full Screen",
                            onClick: async () => {
                                setFullScreen(true);
                            }
                        });
                    }
                }
            }

            return resourceActions;
        },
        [editMode, Editor, Viewer, fullScreen]);

    useEffect(() => {
            setEditMode(!!edition && !!Editor);
        }, [edition, Editor]
    );

    useEffect(() => {
            setResourceActions && setResourceActions(resourceActions);

        }, [resourceActions, setResourceActions, edition]
    );

    const setResourceActionsCb = useCallback((actions: ResourceAction[]) => {
        setResourceActions && setResourceActions([...actions, ...resourceActions])
    },[resourceActions, setResourceActions]);

    return <div className={classNames("fullscreen-container", {"fullscreen": fullScreen})}>
        <div className="exit-fullscreen-button" title="Exit Full Screen"><CloseIcon
            onClick={() => setFullScreen(false)}/>
        </div>
        {Editor == Viewer ?
            <Editor {...otherProps} resource={resourceWithType} setResourceActions={setResourceActionsCb} fullscreen={fullScreen} fetchOptions={props.fetchOptions}/>
            : editMode ?
            <Editor {...otherProps} resource={resourceWithType} setResourceActions={setResourceActionsCb} fetchOptions={props.fetchOptions}/> :
            <Viewer {...otherProps} resource={resourceWithType} setResourceActions={setResourceActionsCb} fullscreen={fullScreen} fetchOptions={props.fetchOptions}/>}
    </div>
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
                        <div className="container-readme-quicklink" title="See README file"><a
                            onClick={() => props.onNavigateToResource(readme)}><OpenInNewIcon/></a></div>
                        <ReadmeViewer uri={readme} fetch={props.fetch}/>
                    </div> : null}
                <Dropzone noClick={true}
                          onDrop={acceptedFiles => acceptedFiles.forEach(f => containerAccessor.saveFile(f.name, f))}>
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