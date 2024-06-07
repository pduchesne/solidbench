import {useMemo, useState} from "react";
import {PromiseContainer} from "@hilats/react-utils";
import * as React from "react";
import {Receipt} from "../../model";
import {parseXlsxExport} from "./parser";
import {FileDrop, ImportResult} from "../../components/Import";
import {PasswordDialog, useModal} from "../../../../ui/modal";

export const DelhaizePanel = (props: { onImport: (receipts: Receipt[]) => void}) => {

    const [modal, openModal] = useModal();

    const [blob, setBlob] = useState<Blob>();

    const zipContent$ = useMemo(() => {
        return blob && parseXlsxExport(blob, () => {
            const password$ = new Promise<string>((resolve, reject) => {
                openModal({
                    title: "XLSX Password",
                    component: PasswordDialog,
                    initValue: {password: ""},
                    onOk: (values) => resolve(values.password),
                    onCancel: () => reject()
                })
            });

            return password$;
        });
    }, [
        blob
    ]);

    return <>
        {modal}
        {zipContent$ ? <PromiseContainer promise={zipContent$}>
            {(receipts) => <ImportResult receipts={receipts} onImport={props.onImport}/>}
        </PromiseContainer> : <div className="dataprovider">
            <FileDrop onData={(blob) => setBlob(blob)} text="Drop or select your Delhaize XLSX file here"/>
            <div>
                Delhaize history data can be obtained by sending a request, either via their
                <a href="https://help.delhaize.be/s/contactsupport">online contact form</a>, or by sending an email
                to <a href="mailto:info@delhaize.be">info@delhaize.be</a> . Either way, be sure to mention
                your SuperPlus card number, and join a copy of your national ID card (where you can redact out
                information such as your picture or your national number)<br/>
                After a few weeks, you should receive an email response with a password-protected xlsx file, and the
                password.
                Upload the xlsx file in this panel, and provide the password when requested.<br/><br/>
                <a href="https://www.delhaize.be/fr/CP-gdpr">More information on the Delhaize GDPR process</a>.
            </div>
        </div>}
    </>
}
