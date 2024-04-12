import {Checkbox} from "@mui/material";
import * as React from "react";
import {useCallback} from "react";
import {usePromiseFn} from "@hilats/react-utils";
import {assert} from "@hilats/utils";
import {universal, getResourceInfoWithAccessDatasetsFixed} from "@hilats/solid-utils";

// @ts-ignore
import {WacAccess} from "@inrupt/solid-client/dist/access/wac";
// @ts-ignore
import {getAgentAccessAll} from "@inrupt/solid-client/dist/acl/agent";
// @ts-ignore
import {internal_setResourceAcl} from "@inrupt/solid-client/dist/acl/acl.internal";

export function useUniversalAccess(resUri: string, fetchFn: typeof fetch = fetch) {

    const access$ = usePromiseFn(async () => {

        const resInfo = await getResourceInfoWithAccessDatasetsFixed(
            resUri,
            {fetch: fetchFn}            // fetch from the authenticated session
        );

        /*
        const acr = await getResourceAcr(resInfo, {fetch: fetchFn});
        if (acr === null) {
            return getPublicAccessWac(resourceInfo, options);
        }
        return getPublicAccessAcp(acr);

         */

        const pub = await universal.getPublicAccess(resInfo);
        const agents = await universal.getAgentAccessAll(resInfo); //await universalAccess.getAgentAccessAll(resUri, {fetch: fetchFn});
        assert(agents, "Universal agent access should not be null");

        return {
            pub,
            agents,
            resInfo
        }
    }, [resUri, fetchFn])


    const setAccessModes = useCallback((webId: string, accessModes: Partial<universal.InheritableAccessModes>) => {
        if (access$.result) {
            universal.setAgentAccess(access$.result.resInfo, webId, accessModes, fetchFn, accessModes.inheritable).then( () => {
                access$.fetch();
            })}
        }, [access$]);

    const setPublic = useCallback(async (accessModes: Partial<universal.InheritableAccessModes>) => {
        if (access$.result) {
            universal.setPublicAccess(access$.result.resInfo, accessModes, fetchFn, accessModes.inheritable).then( () => {
                access$.fetch();
            })}
    }, [setAccessModes]);

    return {
        access$,
        setPublic,
        setAccessModes
    };
}

export const UniversalAccessCheckbox = (props: {
    mode: keyof universal.InheritableAccessModes,
    accessModes: universal.InheritableAccessModes,
    onChange: (access: universal.InheritableAccessModes) => void
}) => {
    return <Checkbox checked={props.accessModes[props.mode]} onChange={(event, checked) => props.onChange({
        ...props.accessModes,
        [props.mode]: checked
    })}/>
}
export const UniversalAccessForm = (props: {
    public: universal.InheritableAccessModes,
    accessModes: Record<string, universal.InheritableAccessModes>,
    onChangePublic: (access: universal.InheritableAccessModes) => void,
    onChange: (entity: string, access: universal.InheritableAccessModes) => void
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
                    <th>Inherit</th>
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
                    <td><UniversalAccessCheckbox accessModes={props.public} mode='inheritable'
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
                        <td><UniversalAccessCheckbox accessModes={rights} mode='inheritable'
                                                     onChange={(modes) => props.onChange(entity, modes)}/></td>
                    </tr> : null)}
                </tbody>
            </table>

        </div>
    );
};