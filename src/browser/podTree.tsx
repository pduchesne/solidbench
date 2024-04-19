import * as React from "react";
import {useContext, useState} from "react";
import classNames from "classnames";
import {FolderOpen} from "@mui/icons-material";
import FolderIcon from "@mui/icons-material/Folder";
import {getResourceName} from "@hilats/solid-utils";
import {AppContext} from "../appContext";
import {useSolidContainer} from "../solid";
import {PromiseStateContainer} from "@hilats/react-utils";
import {getContainedResourceUrlAll} from "@inrupt/solid-client";

export const PodDirectoryTree = (props: {
    folderUrl: string,
    fetch?: typeof fetch,
    onSelectFile: (url: string) => void,
    selected?: string
}) => {
    return (
        <div className="vFlow">
            <PodDirectorySubTree folderUrl={props.folderUrl} onSelectFile={props.onSelectFile}
                                 selected={props.selected} fetch={props.fetch}/>
        </div>
    );
};
export const PodDirectorySubTree = (props: {
    folderUrl: string,
    fetch?: typeof fetch,
    onSelectFile: (url: string) => void,
    selected?: string
}) => {
    const appContext = useContext(AppContext);

    const containerAccessor= useSolidContainer(
        props.folderUrl,
        props.fetch,
        appContext.cache
    );

    return <PromiseStateContainer promiseState={containerAccessor.container$}>
        {(container) => <>
            {getContainedResourceUrlAll(container).filter(res => res.endsWith('/')).map(res =>
                <PodDirectoryTreeElement folderUrl={res} onSelectFile={props.onSelectFile} fetch={props.fetch}
                                         selected={props.selected}/>)}</>}
    </PromiseStateContainer>
};
export const PodDirectoryTreeElement = (props: {
    folderUrl: string,
    fetch?: typeof fetch,
    onSelectFile: (url: string) => void,
    selected?: string
}) => {
    const [expanded, setExpanded] = useState(false);

    return <div>
        <div className={classNames('resource', {selected: props.folderUrl == props.selected})}
             onClick={() => props.onSelectFile(props.folderUrl)}
             onDoubleClick={() => setExpanded(!expanded)}>{expanded ? <FolderOpen/> :
            <FolderIcon/>} {getResourceName(props.folderUrl)}</div>
        {expanded ? <div className='podbrowser-tree-children'><PodDirectorySubTree folderUrl={props.folderUrl}
                                                                                   onSelectFile={props.onSelectFile}
                                                                                   selected={props.selected}
                                                                                   fetch={props.fetch}/></div> : null}
    </div>
};