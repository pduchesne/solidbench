import {ItemWithHistory, Receipt} from "../model";
import {useMemo} from "react";
import * as React from "react";
import {Card, CardContent, CardHeader} from "@mui/material";
import { getVendorId } from "../storage";
import {useNavigate} from "react-router";
import {getEcoscore, getNutriscore, SCORE_COLORS} from "../off";

export const Overview = (props: { receipts: Array<Receipt> }) => {

    const navigate = useNavigate();

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
                        gtin: i.article.gtin,
                        history: [{...i, receiptId: r.id, date: r.date}]
                    }
                }
            })
        });

        return Object.values(items);
    }, [props.receipts]);

    return <div className="retail-overview">
        <Stats receipts={props.receipts}/>
        <OldFavourites items={items} onItemSelect={(id) => navigate('../frequent/'+encodeURIComponent(id))}/>
        <RecentItems items={items} onItemSelect={(id) => navigate('../frequent/'+encodeURIComponent(id))}/>
        <EcoscoreOverview items={items} onItemSelect={(id) => navigate('../frequent/'+encodeURIComponent(id))}/>
        <NutriscoreOverview items={items} onItemSelect={(id) => navigate('../frequent/'+encodeURIComponent(id))}/>
    </div>
}

type VendorStats = {
    total: number;
    timespan: [string, string];
}

export function Stats(props: {receipts: Receipt[]}) {
    const vendorStats = useMemo(() => {
        const vendorStats: Record<string, VendorStats> = {};

        props.receipts.forEach(r => {
            const vendorId = getVendorId(r.id);
            let stat = vendorStats[vendorId];
            if (!stat) {
                stat = vendorStats[vendorId] = {
                    total: r.amount, timespan:[r.date, r.date]
                }
            } else {
                stat.total += r.amount;
                if (stat.timespan[0] > r.date) stat.timespan[0] = r.date;
                if (stat.timespan[1] < r.date) stat.timespan[1] = r.date;
            }
        })

        return vendorStats;
    }, [props.receipts]);

    return Object.keys(vendorStats).length > 0 ?
        <Card className="card">
            <CardHeader title="Stats"/>
            <CardContent>
                {Object.entries(vendorStats).map( ([vendorId, vendorStats]) => (
                    <div key={vendorId}>
                        {vendorId}
                        <FormattedDate isoDate={vendorStats.timespan[0]} /> - <FormattedDate isoDate={vendorStats.timespan[1]} />
                        {vendorStats.total.toFixed(2)}
                    </div>))}
            </CardContent>
        </Card> : null;
}



export function OldFavourites(props: {items: ItemWithHistory[], onItemSelect?: (itemId: string) => void}) {

    const oldfavorites = useMemo(() => {
        return props.items.filter(
            i => i.history.length > 8 &&
                (new Date().getTime() - new Date(i.history[i.history.length - 1].date).getTime()) > 365 * 24 * 3600 * 1000)
            .sort((i1, i2) => i2.history.length - i1.history.length)
    }, [props.items]);

    return oldfavorites.length > 0 ?
        <Card className="card">
            <CardHeader title="Old time favorites"/>
            <CardContent>
                {oldfavorites.slice(0, 10).map(i => (
                    <div key={i.id} onClick={() => props.onItemSelect && props.onItemSelect(i.id)} className="actionableItem">
                        <FrequencyBar width='3em' freq={i.history.length} maxFreq={oldfavorites[0].history.length}/>
                        <FormattedDate isoDate={i.history.at(-1)!.date} />
                        {i.label} </div>))}
            </CardContent>
        </Card> : null;
}

export function RecentItems(props: {items: ItemWithHistory[], onItemSelect?: (itemId: string) => void}) {
    const recentItems = useMemo(() => {
        return props.items.sort((i1, i2) => i2.history.at(-1)!.date.localeCompare(i1.history.at(-1)!.date))
    }, [props.items]);

    return recentItems.length > 0 ?
        <Card className="card">
            <CardHeader title="Recently bought"/>
            <CardContent>
                {recentItems.slice(0, 10).map(i => (
                    <div key={i.id} onClick={() => props.onItemSelect && props.onItemSelect(i.id)} className="actionableItem">
                        <FormattedDate isoDate={i.history.at(-1)!.date} />
                        {i.label} </div>))}
            </CardContent>
        </Card> : null
}

export function EcoscoreOverview(props: {items: ItemWithHistory[], onItemSelect?: (itemId: string) => void}) {
    const worstItems = useMemo(() => {
        return props.items.sort((i1, i2) => {
            const ecoscore1 = getEcoscore(i1.gtin, true);
            const ecoscore2 = getEcoscore(i2.gtin, true);
            const weight1 = (ecoscore1 ? ecoscore1.charCodeAt(0)-96 : 0) * (1 + i1.history.length / 10);
            const weight2 = (ecoscore2 ? ecoscore2.charCodeAt(0)-96 : 0) * (1 + i2.history.length / 10);

            return weight2 - weight1;
        })
    }, [props.items]);

    return worstItems.length > 0 ?
        <Card className="card">
            <CardHeader title="Ecoscore"/>
            <CardContent>
                {worstItems.slice(0, 10).map(i => (
                    <div key={i.id} onClick={() => props.onItemSelect && props.onItemSelect(i.id)}
                         className="actionableItem">
                        <div title={`${getEcoscore(i.gtin)} - ${i.history.length}`}
                             style={{display: 'inline-block', width: '3em', height: '1em', backgroundColor: SCORE_COLORS[getEcoscore(i.gtin) || '']}} />
                            {i.label} </div>
                        ))}
                    </CardContent>
                    </Card> : null
}


export function FrequencyBar(props: {freq: number, maxFreq: number, width?: string | number, height?: string | number}) {
    return <div title={""+props.freq}  className="frequencyBar" style={{width: props.width, height: props.height || '1em'}}>
        <div style={{width: (100*props.freq/props.maxFreq)+'%'}}/>
    </div>
}


export function NutriscoreOverview(props: {items: ItemWithHistory[], onItemSelect?: (itemId: string) => void}) {
    const worstItems = useMemo(() => {
        return props.items.sort((i1, i2) => {
            const nutriscore1 = getNutriscore(i1.gtin, true);
            const nutriscore2 = getNutriscore(i2.gtin, true);
            const weight1 = (nutriscore1 ? nutriscore1.charCodeAt(0)-96 : 0) * (1 + i1.history.length / 10);
            const weight2 = (nutriscore2 ? nutriscore2.charCodeAt(0)-96 : 0) * (1 + i2.history.length / 10);

            return weight2 - weight1;
        })
    }, [props.items]);

    return worstItems.length > 0 ?
        <Card className="card">
            <CardHeader title="Nutriscore"/>
            <CardContent>
                {worstItems.slice(0, 10).map(i => (
                    <div key={i.id} onClick={() => props.onItemSelect && props.onItemSelect(i.id)}
                         className="actionableItem">
                        <div title={`${getNutriscore(i.gtin)} - ${i.history.length}`}
                             style={{display: 'inline-block', width: '3em', height: '1em', backgroundColor: SCORE_COLORS[getNutriscore(i.gtin) || '']}} />
                        {i.label} </div>
                ))}
            </CardContent>
        </Card> : null
}

export function FormattedDate(props: {isoDate: string}) {
    return <div className="itemDate">
        [{new Date(props.isoDate).toLocaleDateString()}]
    </div>
}

export default Overview;