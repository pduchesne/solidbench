import React, { useMemo } from "react";
import {PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
import asciidoctor from 'asciidoctor';

// TODO use https://plantuml.github.io/plantuml.js/
// See https://github.com/plantuml/plantuml.js/blob/main/examples/02-asciidoctor.js/index.html
//   for example integration


export const AsciiDocViewer = (props:{uri?: string, content: Blob | string, type?: string}) => {

    const contentString$ = usePromiseFn( async () => {
        return props.content instanceof Blob ? props.content.text() : props.content;
    }, [props.content]);

    return <PromiseStateContainer promiseState={contentString$}>
        {(content) => <AsciiDocRenderer content={content} />}
    </PromiseStateContainer>

}

export const AsciiDocRenderer = (props:{content: string}) => {

    const Asciidoctor = asciidoctor();
    const html = useMemo( () => Asciidoctor.convert(props.content), [props.content]);

    return <div dangerouslySetInnerHTML={{__html: html}} />
}


export default AsciiDocViewer;