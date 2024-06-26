import React from 'react';
import { List, ListItem, ListItemText, Divider, Paper, makeStyles } from '@material-ui/core';
// import { styled } from '@mui/material/styles';

const useStyles = makeStyles((theme) => ({
    listRoot: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: theme.palette.background.paper,
        position: 'relative',
        overflow: 'auto',
        maxHeight: 300,
    },
    // ניתן להוסיף כאן עוד סגנונות לפי הצורך
}));
// const Div = styled('div')(({ theme }) => ({
//     ...theme.typography.button,
//     backgroundColor: theme.palette.background.paper,
//     padding: theme.spacing(1),
// }));
const EventsList = ({ events }) => {
    const classes = useStyles();

    return (
        <div className="p-3">
            <div>{"This div's text looks like that of a button."}</div>
            <Paper className={classes.listRoot} >
                <List component="nav" aria-label="events list">
                    {events.map((event, index) => (
                        <React.Fragment key={index}>
                            <ListItem button style={{ textAlign: 'right', }}>
                                <ListItemText primary={event.title} secondary={`מתחיל: ${event.start.toLocaleDateString()} עד: ${event.end.toLocaleDateString()}`} />
                            </ListItem>
                            {index < events.length - 1 && <Divider />}
                        </React.Fragment>
                    ))}
                </List>
            </Paper>
        </div>
    );
};

export default EventsList;