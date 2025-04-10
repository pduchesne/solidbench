import React, { useMemo } from "react";
import asciidoctor from 'asciidoctor';
import {ResolvedContentViewerProps, withResolvableUri} from "./GenericViewer";

// TODO use https://plantuml.github.io/plantuml.js/
// See https://github.com/plantuml/plantuml.js/blob/main/examples/02-asciidoctor.js/index.html
//   for example integration


export const AsciiDocRenderer = (props: ResolvedContentViewerProps<'string'>) => {

    const Asciidoctor = asciidoctor();
    const html = useMemo( () => Asciidoctor.convert(props.resource.content), [props.resource.content]);

    return <div className="paddedPanel">
        <div dangerouslySetInnerHTML={{__html: html}}/>
    </div>
}


export const AsciiDocViewer = withResolvableUri(AsciiDocRenderer, {as: 'text'});

export default AsciiDocViewer;