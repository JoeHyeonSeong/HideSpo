/*global chrome*/
import React, { Component } from 'react';
import Paper from '@material-ui/core/Paper';
import { withStyles } from '@material-ui/core/styles';
import Dialog from '@material-ui/core/Dialog';
import IconButton from '@material-ui/core/IconButton';
import { Close, Add } from '@material-ui/icons';
import { CircularProgress } from '@material-ui/core';
import { Button } from '@material-ui/core';

const styles = {
    main:{
        textAlign: "center",
    },
    closeButton: {
        padding: 4,
        margin: "15px auto",
        //marginLeft:-16,
        backgroundColor: "#00000042",
        position: "fixed",
        zIndex: 1,
        left: '0',
        right:'0',
        '&:hover': {
            backgroundColor: '#0000008a',
        },
    },
    yesButton:{
        backgroundColor:'#1fd6fe',
        color:'white',
        margin:'auto 20px',
        '&:hover': {
            backgroundColor: '#1fd6fe',
        },
    },
    noButton:{
        backgroundColor:'#ff5e41',
        color:'white',
        margin:'auto 20px',
        '&:hover': {
            backgroundColor: '#ff5e41',
        },
    },
    questionNum:{
        textAlign:"right",
        margin:"15px"
    },
    titleArea:{
        margin:"15px",
        border:"solid 1px",
        borderColor:"#c9dae1",
    },
    textArea:{
        margin:"15px",
        minHeight:"180px",
        border:"solid 1px",
        borderColor:"#c9dae1",
        padding:"5px"
    }
};

class Question extends Component {
    state = {
        title: '',
        text: '',
        index: 0,
    }

    questionNum=0;
    textThreshold=200;
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.open != this.props.open && this.props.open) {
            this.questionNum=this.props.questions.length;
            this.setIndex(0);
        }
    }

    setIndex(index) {
        console.log(this.state.text);
        this.setState(
            {
                index:index,
                title: this.props.questions[index]['title'][0],
                text: this.props.questions[index]['text'],
            }
        )
    }

    render() {
        const name = 'react';
        const { classes } = this.props;
        return (
            <Dialog fullScreen={true} onClose={()=>{this.props.onClose(false)}} open={this.props.open}>
                <Paper square={true} elevation={0} className={classes.main}>
                    <IconButton aria-label="close" className={classes.closeButton} onClick={()=>{this.props.onClose(false)}}>
                        <Close color="secondary"></Close>
                    </IconButton>
                    <div className={classes.questionNum}>
                        {this.state.index+1+" / "+this.questionNum}
                    </div>
                    <h2>
                        스포일러가 포함되어있습니까?
                    </h2>
                    <Paper
                    className={classes.titleArea}
                    elevation={0}
                    >
                        <h3>
                        {this.state.title}
                        </h3>
                        
                    </Paper>
                    <Paper
                    elevation={0}
                    className={classes.textArea}
                    >
                    {(this.state.text.length < this.textThreshold) ? this.state.text : this.state.text.substring(0, this.textThreshold) + "..."}
                    </Paper>
                    <Button
                    onClick={()=>{this.answer(true)}}
                    className={classes.yesButton}
                    >
                        O
                    </Button>
                    <Button
                    onClick={()=>{this.answer(false)}}
                    className={classes.noButton}
                    >
                        X
                    </Button>
                </Paper>
            </Dialog>
        );
    }

    answer=(result)=>{
        console.log("answer");
        console.log(result);
        let masked=this.props.questions[this.state.index]['masked'];
        console.log(masked);
        chrome.runtime.sendMessage({
            message: 'report',
            data: masked,
            isSpoiler: result
        });
        if (this.state.index < this.props.questions.length-1) 
                this.setIndex(this.state.index+1);
        else{
            this.props.onClose(true);
        }
    }
}
export default withStyles(styles)(Question);