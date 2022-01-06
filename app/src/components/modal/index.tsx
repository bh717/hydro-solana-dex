import { FC } from 'react';
import { makeStyles } from '@mui/styles';
import { Dialog, Box, IconButton, Typography } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { Close } from '../icons';

const useStyles = makeStyles({
    dialog: {
        '& .MuiDialog-container': {
            alignItems: 'flex-start'
        },
        '& .MuiDialog-paper': {
            background: 'linear-gradient(180deg, rgba(41, 255, 200, 0.25) 0%, rgba(1, 207, 237, 0) 100%)',
            borderRadius: '6px',
            position: 'relative',
            padding: '1px',
            marginTop: '84px',
            marginBottom: '84px',
            '@media (max-width:600px)': {
                marginTop: '80px',
                marginBottom: '80px'
            }
        }
    },
    contentWrapper: {
        background: '#313C4E',
        borderRadius: '6px',
        padding: '1px'
    },
    dialogTitle: {
        borderBottom: '1px solid #FFFFFF0F',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px !important',
        '& p': {
            color: '#FFFFFFD9',
            fontSize: '18px',
            fontWeight: '500',
            lineHeight: '21px'
        },
        '& button': {
            padding: '0 !important',
            '& svg': {
                color: '#FFFFFF73',
                width: '14px',
                height: '14px'
            }
        }
    },
    dialogContent: {
        padding: '32px 24px !important'
    }
})

interface ModalProps {
    title: string;
    content: JSX.Element;
    open: boolean;
    onClose(): void;
}

const Modal: FC<ModalProps> = ({ title, content, open, onClose }) => {
    const classes = useStyles();

    return (
        <Dialog className={classes.dialog} open={open}>
            <Box className={classes.contentWrapper}>
                <DialogTitle className={classes.dialogTitle}>
                    <Typography>{title}</Typography>
                    <IconButton aria-label="close" onClick={onClose}>
                        <Close />
                    </IconButton>
                </DialogTitle>
                <DialogContent className={classes.dialogContent}>
                    {content}
                </DialogContent>
            </Box>
        </Dialog>
    )
}

export default Modal;