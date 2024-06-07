import {useMemo, useState} from "react";
import {PromiseContainer} from "@hilats/react-utils";
import * as React from "react";
import {Receipt} from "../../model";
import {parseZipExport} from "./parser";
import {FileDrop, ImportResult} from "../../components/Import";

export const AmazonPanel = (props: { onImport: (receipts: Receipt[]) => void}) => {

    const [blob, setBlob] = useState<Blob>();

    const zipContent$ = useMemo(() => {
        return blob && parseZipExport(blob);
    }, [
        blob
    ]);

    return <>
        {zipContent$ ? <PromiseContainer promise={zipContent$}>
            {(receipts) => <ImportResult receipts={receipts} onImport={props.onImport}/>}
        </PromiseContainer> : <div className="dataprovider">
            <FileDrop onData={(blob) => setBlob(blob)} text="Drop or select your Amazon ZIP file here"/>
            <div>
                Amazon history data can be obtained by sending a request using the "Request your data" or
                "Transfer your data" section (depending on which national amazon account you are using).<br/>
                E.g. the amazon.fr <a href="https://www.amazon.fr/hz/privacy-central/data-requests/portability/preview.html">Data Transfer panel</a>.<br/>
                Using the dropdown, request at least the purchase history data. Then you will receive a confirmation
                request right away, either by email, SMS, or in the <a href="https://www.amazon.fr/gp/message?ref_=ya_d_c_msg_center#!/inbox">Amazon Message Center</a> in
                the portal. Confirm the request.<br/>
                After a few days, you should receive an email response with a zip file that you can then upload in this panel.
            </div>
        </div>}
    </>
}
