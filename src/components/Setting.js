/*global chrome*/
import React, { Component } from 'react';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import Divider from '@material-ui/core/Divider';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Typography from '@material-ui/core/Typography';
import BlockIcon from '@material-ui/icons/Block';
import { FormControl, FormLabel } from '@material-ui/core';

const styles = {
    root:{
        width:180,
        height:315,
        margin:5,
    },
    radio:{
        padding:4
    },
    formControlLabel:{
        fontSize:"80%"
    }
};


class Setting extends Component {
    state = {
        blockPower: "1"
    }
    blockPowerText = [
        '차단 안 함',
        '의미분석',
        '영화 제목',
        '영화 제목, 감독, 배우, 배역'
    ];
    blockDescription='스포일러 차단';
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.open != this.props.open && this.props.open) {
            this.setState({
                blockPower:String(this.props.blockPower)
            });
        }
    }

    handleBlockPowerChange = (event, newValue) => {
        this.setState({
            blockPower: String(newValue)
        })
        chrome.runtime.sendMessage({
            message: 'blockPowerChange',
            blockPower: String(newValue)
        });
    }

    render() {
        const name = 'react';
        const { classes } = this.props;
        return (
            <Dialog onClose={this.props.onClose} open={this.props.open}>
                <List className={classes.root}>
                    <ListItem>

                        <FormControl component="fieldset">
                            <FormLabel>
                                스포일러 차단
                        </FormLabel>
                            <RadioGroup value={this.state.blockPower} onChange={this.handleBlockPowerChange}>
                                <FormControlLabel value="0"
                                    control={<Radio color="primary" size="small" className={classes.radio} />}
                                    label={<Typography className={classes.formControlLabel}>차단 안 함</Typography>} />
                                <FormControlLabel value="1"
                                    control={<Radio color="primary" size="small" className={classes.radio} />}
                                    label={<Typography className={classes.formControlLabel}>의미 분석</Typography>} />
                                <FormControlLabel value="2"
                                    control={<Radio color="primary" size="small" className={classes.radio} />}
                                    label={<Typography className={classes.formControlLabel}>영화 제목</Typography>} />
                                <FormControlLabel value="3"
                                    control={<Radio color="primary" size="small" className={classes.radio} />}
                                    label={<Typography className={classes.formControlLabel}>영화 키워드</Typography>} />
                            </RadioGroup>
                        </FormControl>

                    </ListItem>
                    <Divider />
                </List>

            </Dialog>

        );
    }

}
export default withStyles(styles)(Setting);