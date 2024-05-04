import React, {useCallback, useState} from "react";
import {Button, Modal} from "@mui/material";

export type ModalComponent<T extends {}> = React.ComponentType<{values: T, onChange: (newValues: T) => void}>;

export type BasicModalProps = {
    open?: boolean,
    title?: string,
    onOk?: () => Promise<void> | void,
    onCancel?: () => void,
    description?: string,
}

export type ValueObjectModalProps<T extends {} = {}> = Omit<BasicModalProps, 'onOk'> & {
    component: ModalComponent<T>,
    initValue: T,
    onOk: (values: T) => Promise<void> | void,
}

export type ModalProps<T extends ({} | void) = {} | void> = T extends {  } ? ValueObjectModalProps<T> : BasicModalProps;


export function useModal(): [JSX.Element, <T extends {} | void>(props: ModalProps<T>) => void] {
    const [props, setProps] = React.useState<ModalProps>({});

    const okCb = useCallback(
        (obj?: any) => {
            if (props?.onOk) {
                if ('component' in props) {
                    props.onOk(obj);
                } else {
                    props.onOk();
                }
            }
            setProps({...props, open: false});
        },
        [props?.onOk]);

    const cancelCb = useCallback(
        ( ) => {props?.onCancel && props?.onCancel(); setProps({...props, open: false})},
        [props?.onCancel]);

    const openModal = useCallback(
        (modalProps: ModalProps) => {
            const open = modalProps.open == undefined ? true : modalProps.open;
            setProps({...modalProps, open});
        },
        []);

    const modalElement = (props && 'component' in props) ?
        <ValueObjectModal {...props} onOk={okCb} onCancel={cancelCb} /> :
        <BasicModal {...props} onOk={okCb} onCancel={cancelCb} /> ;

    return [modalElement, openModal];
}

/*
export function OtherModal(props: ModalProps) {

    return (
        <Modal
            open={!!props.open}
            onClose={props.onCancel}
            aria-labelledby={props.title}
        >
            <div className="modal">
                {(props && 'component' in props) ?
                    <>
                        <props.component onChange={props.onChange} values={props.initValue}/>
                    </> :
                    <>
                        <h3>{props.title}</h3>
                        <div>{props.description}</div>
                    </>
                }
                <Button onClick={props.onOk}>OK</Button>
                <Button onClick={props.onCancel}>Cancel</Button>
            </div>
        </Modal>
    );
}

 */


export function BasicModal(props: ModalProps) {

    return (
        <Modal
            open={!!props.open}
            onClose={props.onCancel}
            aria-labelledby={props.title}
        >
            <div className="modal">
                <h3>{props.title}</h3>
                <div>{props.description}</div>
                <Button onClick={props.onOk}>OK</Button>
                <Button onClick={props.onCancel}>Cancel</Button>
            </div>
        </Modal>
    );
}

export function ValueObjectModal(props: ValueObjectModalProps) {

    const [values, setValues] = useState(props.initValue);

    return (
        <Modal
            open={!!props.open}
            onClose={props.onCancel}
            aria-labelledby={props.title}
        >
            <div className="modal">
                <props.component onChange={setValues} values={props.initValue}/>
                <Button onClick={() => props.onOk(values)}>OK</Button>
                <Button onClick={props.onCancel}>Cancel</Button>
            </div>
        </Modal>
    );
}