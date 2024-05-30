import {ItemWithHistory, Receipt} from "../model";
import {useMemo} from "react";
import * as React from "react";

export const Overview = (props: { receipts: Array<Receipt> }) => {

    const items = useMemo(() => {
        const items: Record<string, ItemWithHistory> = {};
        props.receipts.forEach(r => {
            r.items?.forEach(i => {
                if (i.article.vendorId in items) {
                    items[i.article.vendorId].history.push({...i, receiptId: r.id, date: r.date});
                } else {
                    items[i.article.vendorId] = {
                        id: i.article.vendorId,
                        label: i.article.label,
                        history: [{...i, receiptId: r.id, date: r.date}]
                    }
                }
            })
        });

        return Object.values(items).sort((i1, i2) => i2.history.length - i1.history.length)
    }, [props.receipts]);

    const oldfavorites = useMemo(() => {
        return items.filter(i => i.history.length > 8 && (new Date().getTime() - new Date(i.history[i.history.length - 1].date).getTime()) > 365 * 24 * 3600 * 1000).sort((i1, i2) => i2.history.length - i1.history.length)
    }, [items]);

    return <div>
        {oldfavorites.length > 0 ?
        <div>
            <div>Old time favorites</div>
            <div>
                {oldfavorites.slice(0, 10).map(i => (
                    <div key={i.id}>
                        <FrequencyBar width='3em' freq={i.history.length} maxFreq={oldfavorites[0].history.length}/>
                        <FormattedDate isoDate={i.history.at(-1)!.date} />
                        {i.label} </div>))}
            </div>
        </div> : null}
    </div>
}

export function FrequencyBar(props: {freq: number, maxFreq: number, width?: string | number, height?: string | number}) {
    return <div title={""+props.freq}  className="frequencyBar" style={{width: props.width, height: props.height || '1em'}}>
        <div style={{width: (100*props.freq/props.maxFreq)+'%'}}/>
    </div>
}

export function FormattedDate(props: {isoDate: string}) {
    return <div className="itemDate">
        [{new Date(props.isoDate).toLocaleDateString()}]
    </div>
}

export default Overview;