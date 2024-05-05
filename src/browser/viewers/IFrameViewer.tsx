import React, {useMemo} from "react";

export const IFrameViewer = (props:{uri?: string, content: Blob | string, type?: string}) => {

    const blobUrl = useMemo(() => {
        const blob = props.content instanceof Blob ? props.content : new Blob([props.content], {type: props.type});
        return URL.createObjectURL(blob);
    }, [props.content]);

    return <iframe src={blobUrl}/>

}

export default IFrameViewer;