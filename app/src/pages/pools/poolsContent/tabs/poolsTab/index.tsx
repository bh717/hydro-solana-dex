import React from 'react';
import { makeStyles } from '@mui/styles';
import { Box } from '@mui/material';

import Filter from '../../filter';

const useStyles = makeStyles({
    tabContainer: {
        display: 'flex',
        flexDirection: 'column'
    },
    tabContent: {

    }
})

const PoolsTab = () => {
    const classes = useStyles();

    return (
        <Box className={classes.tabContainer}>
            <Filter />
            <Box className={classes.tabContent}>

            </Box>
        </Box>
    )
}

export default PoolsTab;