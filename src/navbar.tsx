import {bindMenu, bindTrigger, usePopupState} from "material-ui-popup-state/hooks";
import {AppBar, Box, Button, IconButton, Menu, MenuItem, Toolbar, Tooltip} from "@mui/material";
import {Link} from "react-router-dom";
import {useContext} from "react";
import * as React from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {LogoutButton, useSession} from "@inrupt/solid-ui-react";
import {LoginMultiButton} from "./solid";
import {AppContext} from "./appContext";

const ToolsMenu = () => {
    const popupState = usePopupState({variant: 'popover'})
    return (
        <>
            <Button variant="contained" {...bindTrigger(popupState)}>
                Tools
            </Button>
            <Menu {...bindMenu(popupState)}>
                <MenuItem onClick={popupState.close} component={Link} to="/tools/spotify">Spotify</MenuItem>
                <MenuItem onClick={popupState.close} component={Link} to="/tools/colruyt">Colruyt</MenuItem>
                <MenuItem onClick={popupState.close} component={Link} to="/tools/colruytdb">ColruytDB</MenuItem>
            </Menu>
        </>
    )
}

const ProfileMenu = () => {
    const appContext = useContext(AppContext);
    const popupState = usePopupState({variant: 'popover'})

    return (
        <>
            <Tooltip title={
                <React.Fragment>
                    <div>{appContext.webId}</div>
                    <div>{appContext.podUrl}</div>
                </React.Fragment>
            }>
                <IconButton sx={{p: 0}} {...bindTrigger(popupState)}>
                    <AccountCircleIcon/>
                </IconButton>
            </Tooltip>
            <Menu {...bindMenu(popupState)}>
                <MenuItem>Settings</MenuItem>
                <LogoutButton>
                    <Button variant="contained" color="primary">
                        Log&nbsp;out
                    </Button>
                </LogoutButton>
            </Menu>
        </>
    )
}


export const AppNavBar = () => {
    const {session} = useSession();

    return (

        <AppBar position="static" className='navbar'>
            <Toolbar disableGutters>
                <img src="/images/logo-big.png" height={60}/>

                <Box sx={{flexGrow: 1}}>
                    <Button component={Link} to="/tools/pod-viewer" variant="contained">Pod Viewer</Button>
                    <ToolsMenu/>
                </Box>


                <Box sx={{flexGrow: 0, float: 'right'}}>
                    {session.info.isLoggedIn ? (
                        <ProfileMenu/>
                    ) : (
                        <>
                            <LoginMultiButton
                                authOptions={
                                    {
                                        //clientName: "Web Annotations App",
                                        clientId: process.env.ROOT_URL+"/client.jsonld",
                                        //clientId: "https://highlatitud.es/app/annotations.jsonld",
                                        //redirectUrl: new URL("/", window.location.href).toString(),

                                        tokenType: 'Bearer'
                                        /*, popUp: true */
                                    }
                                }
                                redirectUrl={new URL("/tools/pod-viewer", window.location.href).toString()}
                                onError={console.log}
                            >
                                <Button variant="contained" color="primary">
                                    Log&nbsp;in
                                </Button>
                            </LoginMultiButton>
                        </>
                    )}
                </Box>
            </Toolbar>
        </AppBar>

    );
};