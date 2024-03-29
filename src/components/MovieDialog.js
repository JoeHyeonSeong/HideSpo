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
import { Close, Add } from '@material-ui/icons';
import { CircularProgress } from '@material-ui/core';
import Question from './Question'
const styles = {
    text: {
        textAlign: "center",
        position: "relative",
        color: "#000000f5",
        backgroundColor: "#ffffffed",
        bottom: "-70%",
        width: "100%",
        height: "30%",
        display: "flex",
        alignItems: "center"
    },
    yearText: {
        fontSize: "smaller"
    },
    titleText: {
        fontWeight: "bold",
        wordBreak: "keep-all"
    },
    title: {
        padding: 0,
        backgroundColor: "#ffffff00",
        textAlign: "center",
        position: "fixed",
        width: "100%",
        zIndex: 1
    },
    cell: {
        padding: 8,
        height: 126,
        backgroundColor: "#e8e8e894"
    },
    tableText: {
        verticalAlign: "middle",
        color: "#0000006b",
        textAlign: "center",
        lineHeight: '419px'
    },
    table: {
        textAlign: "center",
    },
    cell1: {
        padding: 8,
        textAlign: "right"
    },
    cell2: {
        padding: 8,
        textAlign: "right",
        width: "100%"
    },
    row: {
        width: 180,
        minHeight: 240,
        display: "flex",
        margin: "10px auto",
        borderRadius: 10,
        position: "relative"
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
    addButton: {
        position: "absolute",
        right: "0%",
        padding: 4,
        backgroundColor: '#00000042',
        '&:hover': {
            backgroundColor: '#0000008a',
        },
    },
    width100: {
        width: "100%"
    }
};

class MovieDialog extends Component {
    state = {
        movieData: [],
        searchStatusText: '',
        isSearching: true,
        questionOpen:false
    }
    questionNum=5;
    selectedMovieInfo;
    textThreshold=14;
    questions;

    componentDidMount() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.message === "questionResponse") {
                this.questions=request.questions;
                this.openQuestion(this.questions);
            }

        });
    }

    componentDidUpdate(prevProps, prevState) {
        if (prevProps.open != this.props.open && this.props.open) {
            this.setState({
                movieData: [],
                searchStatusText: '',
                isSearching: true
            });
            this.searchMovie();
        }
    }

    render() {
        const name = 'react';
        const { classes } = this.props;
        return (
            <Dialog fullScreen={true} onClose={this.props.onClose} open={this.props.open}>
                <Paper className={classes.table} square={true} elevation={0}>
                    <Question addMovie={this.addMovie}
                        movieDatas={this.props.movieDatas}
                        open={this.state.questionOpen}
                        onClose={this.handleQuestionClose}
                        questions={this.questions}>
                    </Question>

                    <IconButton aria-label="close" className={classes.closeButton} onClick={this.props.onClose}>
                        <Close color="secondary"></Close>
                    </IconButton>
                    {this.state.movieData.map((row) => (
                        <Paper className={classes.row} key={row.name} elevation={3}>
                            <span style={
                                {
                                    textAlign: "right",
                                    width: "100%",
                                    borderRadius: 10,
                                    overflow: "hidden",
                                    backgroundImage: (row.poster) ? 'url(' + row.poster + ')' : 'url(images/no_poster_found.png)',
                                    backgroundPosition: 'center',
                                    backgroundSize: 'cover'
                                }}>
                                <IconButton color="secondary" className={classes.addButton} variant="contained" onClick={() => { this.addButtonClicked(row) }}>
                                    <Add></Add>
                                </IconButton>
                                <div className={classes.text}>
                                    <div className={classes.width100}>
                                        <p class={classes.titleText}>
                                            {(row.title.length < this.textThreshold) ? row.title : row.title.substring(0, this.textThreshold) + "..."}
                                        </p>
                                        <p class={classes.yearText}>{row.prodYear}</p>
                                    </div>

                                </div>
                            </span>
                        </Paper>
                    ))}
                    <div class={classes.tableText}>
                        {(this.state.isSearching) ? <CircularProgress /> : this.state.searchStatusText}
                    </div>
                </Paper>
            </Dialog>

        );
    }

    addButtonClicked = (movieInfo) => {
        //중복 체크
        for (let m of this.props.movieDatas) {
            console.log(movieInfo.title);
            console.log(m.title[0]);
            if (movieInfo.title.trim() === m.title[0].trim()) {
                this.props.onDuplicate();
                this.props.onClose();
                return;
            }
        }

        chrome.runtime.sendMessage({
            message: 'question',
            questionNum:this.questionNum
        });
        this.selectedMovieInfo=movieInfo;
    }

    openQuestion=(questions)=>{
        console.log(questions);
        if(questions.length>0){
            this.setState({questionOpen:true});
        }
        else{
            this.props.addMovie(this.selectedMovieInfo);
        }
    }

    handleQuestionClose=(complete)=>{
        this.setState({questionOpen:false});
        if(complete){
            this.props.addMovie(this.selectedMovieInfo);
        }
    }


    handleChange = (e) => {
        this.setState({
            title: e.target.value
        })
    }

    searchMovie = async () => {
        let basicUrl = "http://158.247.209.101:5000/search?title=";
        let response = await fetch(basicUrl + this.props.title)
        this.setState({
            movieData: []
        }, async () => {
            if (response.ok) {
                let json = await response.json();
                let results = json.Data[0].Result;
                //console.log(results);
                if (typeof results === 'undefined') {
                    this.setState({
                        movieData: [],
                        isSearching: false,
                        searchStatusText: '검색결과가 없습니다.'
                    });
                }
                else {
                    for (let r of results) {
                        r.title = r.title.replace(/ !HS | !HE /gi, '');
                        r.poster = r.posters.split('|')[0];
                    }
                    this.setState({
                        movieData: results,
                        isSearching: false,
                        searchStatusText: ''
                    });
                }

            }
        });
    }
}
export default withStyles(styles)(MovieDialog);