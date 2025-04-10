import React, {useMemo} from "react";
import {ContentViewer} from "./GenericViewer";

export const IFrameViewer: ContentViewer = (props) => {

    const { resource } = props;

    const resourceUrl = useMemo(() => {
        if (resource.uri != undefined) {
            return resource.uri;
        } else if ('content' in resource) {
            const blob = resource.content instanceof Blob ? resource.content : new Blob([resource.content!], {type: resource.type});
            return URL.createObjectURL(blob);
        } else {
            throw "Cannot happen but TS is too dumb to infer it";
        }

    }, [resource]);

    return <iframe src={resourceUrl}/>

}

export default IFrameViewer;