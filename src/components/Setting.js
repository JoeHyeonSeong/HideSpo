/*global chrome*/
import React, { Component } from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import {Close,Add} from '@material-ui/icons';
import Slider from '@material-ui/core/Slider';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import Divider from '@material-ui/core/Divider';

const styles = {
    root:{
        width:200,
        height:315,
        margin:5
    }
};

class Setting extends Component {
    state = {
        blockPower: 1
    }
    blockPowerText = [
        '차단 안 함',
        '의미분석',
        '영화 제목',
        '영화 제목, 감독, 배우, 배역'
    ];
    blockDescription='스포일러 차단 방법';
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.open != this.props.open && this.props.open) {
            this.setState({
                blockPower:this.props.blockPower
            });
        }
    }

    handleSliderChange = (event, newValue) => {
        this.setState({
            blockPower: newValue
        })
        chrome.runtime.sendMessage({
            message: 'blockPowerChange',
            blockPower: newValue
        });
    }

    render() {
        const name = 'react';
        const { classes } = this.props;
        return (
            <Dialog onClose={this.props.onClose} open={this.props.open}>
                <List className={classes.root}>
                    <ListItem>
                        <div>
                            {this.blockDescription}
                        </div>
                        <Slider
                            value={this.state.blockPower}
                            aria-labelledby="discrete-slider"
                            valueLabelDisplay="auto"
                            onChange={this.handleSliderChange}
                            step={1}
                            min={0}
                            max={3}
                            marks={true}
                        />
                        <div>
                            {this.blockPowerText[this.state.blockPower]}
                        </div>
                    </ListItem>
                    <Divider variant="inset" component="li" />
                </List>

            </Dialog>

        );
    }

}
export default withStyles(styles)(Setting);