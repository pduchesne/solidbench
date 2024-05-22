import {bindMenu, bindTrigger, usePopupState} from "material-ui-popup-state/hooks";
import {Link} from "react-router-dom";
import {memo, useContext} from "react";
import * as React from "react";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import {LogoutButton, useSession} from "@inrupt/solid-ui-react";
import {LoginMultiButton} from "./solid";
import {AppContext} from "./appContext";
import Button from "@mui/material/Button/Button";
import MenuItem from "@mui/material/MenuItem/MenuItem";
import Menu from "@mui/material/Menu/Menu";
import Tooltip from "@mui/material/Tooltip/Tooltip";
import IconButton from "@mui/material/IconButton/IconButton";
import AppBar from "@mui/material/AppBar/AppBar";
import Toolbar from "@mui/material/Toolbar/Toolbar";
import Box from "@mui/material/Box/Box";
import {useNavigate} from "react-router";

export const ToolsMenu = () => {
    const popupState = usePopupState({variant: 'popover'})
    return (
        <>
            <Button variant="contained" {...bindTrigger(popupState)}>
                Tools
            </Button>
            <Menu {...bindMenu(popupState)}>
                <MenuItem onClick={popupState.close} component={Link} to="/tools/pod-viewer">Pod Viewer</MenuItem>
                <MenuItem onClick={popupState.close} component={Link} to="/tools/spotify">Spotify</MenuItem>
                <MenuItem onClick={popupState.close} component={Link} to="/tools/retail">Retail</MenuItem>
                <MenuItem onClick={popupState.close} component={Link} to="/tools/retail/colruytdb">ColruytDB</MenuItem>
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


export const AppNavBar = memo(() => {
    const {session} = useSession();

    const navigate = useNavigate();

    return (

        <AppBar position="static" className='navbar'>
            <Toolbar disableGutters>
                <img src="/images/solidbench-256.png" className="app-logo" onClick={() => navigate('/')}/>

                <Box sx={{flexGrow: 1, minWidth: '5px'}} />
                {/*
                <Box sx={{flexGrow: 1}}>
                    <Button component={Link} to="/tools/personal-dashboard" variant="contained">Personal Dashboard</Button>
                    <ToolsMenu/>
                </Box>
                */ }


                <Box sx={{overflow: 'hidden', flexGrow: 0, float: 'right'}}>
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
                                redirectUrl={new URL("/personal-dashboard", window.location.href).toString()}
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
});