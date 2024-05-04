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

export type PodDirectoryTreeProps = {
    folderUrl: string,
    fetch?: typeof fetch,
    onNavigateToResource: (url: string) => void,
    selected?: string
};

export const PodDirectoryTree = (props: PodDirectoryTreeProps) => {
    return (
        <div className="vFlow">
            <PodDirectorySubTree {...props}/>
        </div>
    );
};
export const PodDirectorySubTree = (props: PodDirectoryTreeProps) => {
    const appContext = useContext(AppContext);

    const containerAccessor= useSolidContainer(
        props.folderUrl,
        props.fetch,
        appContext.cache
    );

    return <PromiseStateContainer promiseState={containerAccessor.container$}>
        {(container) => <>
            {getContainedResourceUrlAll(container).filter(res => res.endsWith('/')).map(res =>
                <PodDirectoryTreeElement key={res} {...props} folderUrl={res}/>)}</>}
    </PromiseStateContainer>
};
export const PodDirectoryTreeElement = (props: PodDirectoryTreeProps) => {
    const [expanded, setExpanded] = useState(false);

    return <div>
        <div className={classNames('resource', {selected: props.folderUrl == props.selected})}
             onClick={() => props.onNavigateToResource(props.folderUrl)}
             onDoubleClick={() => setExpanded(!expanded)}>{expanded ? <FolderOpen/> :
            <FolderIcon/>} {getResourceName(props.folderUrl)}</div>
        {expanded ? <div className='podbrowser-tree-children'><PodDirectorySubTree {...props}/></div> : null}
    </div>
};