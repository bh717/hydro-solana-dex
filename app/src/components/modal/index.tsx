import { FC } from 'react';
import { makeStyles } from '@mui/styles';
import { Dialog, IconButton, Typography } from '@mui/material';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';

import { Close } from '../icons';

const useStyles = makeStyles({
    dialog: {
        '& .MuiDialog-paper': {
            backgroundColor: '#191a24',
            position: 'relative',
            padding: '20px',
            borderRadius: '30px'
        }
    },
    dialogTitle: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 0 20px !important',
        '& p': {
            color: '#FFF',
            fontFamily: 'Rubik, sans-serif !important',
            fontSize: '18px',
            fontWeight: '500',
            lineHeight: '21px'
        },
        '& button': {
            padding: '0 !important',
            '& svg': {
                width: '10px',
                height: '10px'
            }
        }
    },
    dialogContent: {
        padding: '40px 0 !important'
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
            <DialogTitle className={classes.dialogTitle}>
                <Typography>{title}</Typography>
                <IconButton aria-label="close" onClick={onClose}>
                    <Close />
                </IconButton>
            </DialogTitle>
            <DialogContent className={classes.dialogContent}>
                {content}
            </DialogContent>
        </Dialog>
    )
}

export default Modal;