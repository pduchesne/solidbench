import {AccessModes, universalAccess} from "@inrupt/solid-client";
import {Checkbox} from "@mui/material";
import * as React from "react";
import {useCallback} from "react";
import {usePromiseFn} from "@hilats/react-utils";
import {assert} from "@hilats/utils";

export function useUniversalAccess(resUri: string, fetchFn: typeof fetch = fetch) {

    const access$ = usePromiseFn(async () => {
        const pub = await universalAccess.getPublicAccess(resUri, {fetch: fetchFn});
        const agents = await universalAccess.getAgentAccessAll(resUri, {fetch: fetchFn});
        assert(pub, "Universal public access should not be null");
        assert(agents, "Universal agent access should not be null");

        return {
            pub,
            agents
        }
    }, [resUri, fetchFn])

    const setPublic = useCallback((accessModes: Partial<AccessModes>) => universalAccess.setPublicAccess(resUri, accessModes, {fetch: fetchFn}).then(res => {
        access$.fetch();
        return res;
    }), [access$]);

    const setAccessModes = useCallback((webId: string, accessModes: Partial<AccessModes>) => universalAccess.setAgentAccess(resUri, webId, accessModes, {fetch: fetchFn}).then(res => {
        access$.fetch();
        return res;
    }), [access$]);

    return {
        access$,
        setPublic,
        setAccessModes
    };
}

export const UniversalAccessCheckbox = (props: {
    mode: keyof AccessModes,
    accessModes: AccessModes,
    onChange: (access: AccessModes) => void
}) => {
    return <Checkbox checked={props.accessModes[props.mode]} onChange={(event, checked) => props.onChange({
        ...props.accessModes,
        [props.mode]: checked
    })}/>
}
export const UniversalAccessForm = (props: {
    public: AccessModes,
    accessModes: Record<string, AccessModes>,
    onChangePublic: (access: AccessModes) => void,
    onChange: (entity: string, access: AccessModes) => void
}) => {

    return (
        <div>
            <h4>Universal</h4>
            <table>
                <thead>
                <tr>
                    <th>entity</th>
                    <th>R</th>
                    <th>A</th>
                    <th>W</th>
                    <th>CR</th>
                    <th>CW</th>
                </tr>
                </thead>
                <tbody>
                <tr>
                    <td>PUBLIC</td>
                    <td><UniversalAccessCheckbox accessModes={props.public} mode='read'
                                                 onChange={props.onChangePublic}/></td>
                    <td><UniversalAccessCheckbox accessModes={props.public} mode='append'
                                                 onChange={props.onChangePublic}/></td>
                    <td><UniversalAccessCheckbox accessModes={props.public} mode='write'
                                                 onChange={props.onChangePublic}/></td>
                    <td><UniversalAccessCheckbox accessModes={props.public} mode='controlRead'
                                                 onChange={props.onChangePublic}/>
                    </td>
                    <td><UniversalAccessCheckbox accessModes={props.public} mode='controlWrite'
                                                 onChange={props.onChangePublic}/>
                    </td>
                </tr>
                {Object.entries(props.accessModes).map(([entity, rights]) =>
                    entity != 'http://www.w3.org/ns/solid/acp#PublicAgent' ? <tr>
                        <td>{entity}</td>
                        <td><UniversalAccessCheckbox accessModes={rights} mode='read'
                                                     onChange={(modes) => props.onChange(entity, modes)}/></td>
                        <td><UniversalAccessCheckbox accessModes={rights} mode='append'
                                                     onChange={(modes) => props.onChange(entity, modes)}/></td>
                        <td><UniversalAccessCheckbox accessModes={rights} mode='write'
                                                     onChange={(modes) => props.onChange(entity, modes)}/></td>
                        <td><UniversalAccessCheckbox accessModes={rights} mode='controlRead'
                                                     onChange={(modes) => props.onChange(entity, modes)}/></td>
                        <td><UniversalAccessCheckbox accessModes={rights} mode='controlWrite'
                                                     onChange={(modes) => props.onChange(entity, modes)}/></td>
                    </tr> : null)}
                </tbody>
            </table>

        </div>
    );
};