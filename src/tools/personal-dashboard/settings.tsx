import * as React from "react";

import {useContext} from "react";
import {AppContext} from "../../appContext";
import {MenuItem, Select} from "@mui/material";

export const PodDashboardSettings = (props: {}) => {

    const appContext = useContext(AppContext);

    return <div>
        <h3>Settings</h3>

        <div>
            Theme: <Select
            value={appContext.preferences.theme} onChange={(e) => {
            appContext.updateCtx({preferences: {...appContext.preferences, theme: e.target.value}})
        }}>
            {['auto', 'dark', 'light'].map(theme => <MenuItem value={theme} key={theme}>{theme}</MenuItem>)}
        </Select>
        </div>
    </div>
}