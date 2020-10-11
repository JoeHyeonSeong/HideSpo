/*global chrome*/
import React, { Component } from 'react';
import { Button } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import { withStyles } from '@material-ui/core/styles';
import MovieDialog from './MovieDialog'
import { ChromeReaderMode } from '@material-ui/icons';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Slider from '@material-ui/core/Slider';

const styles = {
    root: {
        minWidth: 600,
        minHeight: 600,
    },
};

class Main extends Component {
    state = {
        open: false,
        movieDatas: [],
        whiteList:[],
    }
    searchTitle='';
    bodyText='';
    componentDidMount() {
        try {
            chrome.storage.sync.get(['movieDatas','whiteList'],
                items => {
                    let mv=(typeof items.movieDatas=="undefined")? []:items.movieDatas;
                    let wh=(typeof items.whiteList=="undefined")? []:items.whiteList;
                    this.setState({
                        movieDatas: mv,
                        whiteList:wh
                    },()=>{console.log(this.state.whiteList)});
                });
        }
        catch {
            console.log('fail to load data');
        }


    }

    render() {
        const name = 'react';
        const { classes } = this.props;
        return (
            <div className={classes.root}>
                <Slider
                    defaultValue={1}
                    //getAriaValueText={valuetext}
                    aria-labelledby="discrete-slider"
                    valueLabelDisplay="auto"
                    step={1}
                    min={0}
                    max={2}
                />
                <TextField id="standard-basic" onChange={this.handleChange} onKeyPress={this.handlePress} label="영화제목" />
                <Button variant="contained" color="primary" onClick={this.handleClickOpen}>Search</Button>
                <Button variant="contained" color="primary" onClick={this.htmlTest}>Test</Button>
                <Button variant="contained" color="primary" onClick={this.addWhiteList}>WhiteList</Button>
                <MovieDialog addMovie={this.addMovie} title={this.searchTitle} open={this.state.open} onClose={this.handleClose}></MovieDialog>
                <TableContainer component={Paper}>
                    <Table aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell align="right">제목</TableCell>
                                <TableCell align="right"></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.state.movieDatas.map((row) => (
                                <TableRow key={row.name}>
                                    <TableCell align="right">{row.title}</TableCell>
                                    <TableCell align="right">
                                        <Button variant="contained" color="primary" onClick={()=>{this.deleteMovie(row)}}>-</Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </div>

        );
    }

    addMovie = (value) => {
        let trimData={};
        trimData.title=value.title;
        trimData.prodYear=value.prodYear;
        trimData.nation=value.nation;
        trimData.director=value.directors.director.map(d=>d.directorNm);
        trimData.actor=value.actors.actor.map(d=>d.actorNm);

        let newDatas=this.state.movieDatas.concat(trimData);
        console.log(newDatas);
        this.setState({
            movieDatas: newDatas
        });
        chrome.storage.sync.set({'movieDatas':newDatas});
        this.handleClose();
    }

    deleteMovie=(value)=>{
        const {movieDatas}=this.state;
        let newDatas=movieDatas.filter(info => info.title!==value.title);
        console.log(value.title);
        console.log(newDatas);
        this.setState({
            movieDatas: newDatas
        });
        chrome.storage.sync.set({movieDatas:newDatas});
    }

    addWhiteList = () => {
        chrome.tabs.getSelected(null, tabs => {
            console.log(tabs);
            let url = this.trimUrl(tabs.url);
            let newDatas = this.state.whiteList.concat(url);
            this.setState({
                whiteList: newDatas
            });
            chrome.storage.sync.set({ 'whiteList': newDatas });
        });
    }


    deleteWhiteList = () => {
        chrome.tabs.getSelected(null, tabs => {
            let url = this.trimUrl(tabs.url);
            let newDatas = this.state.whiteList.filter(info => info !== url);
            this.setState({
                whiteList: newDatas
            });
            chrome.storage.sync.set({ 'whiteList': newDatas });
        });
    }

    trimUrl = (url) => {
        let i = 0;
        let cnt = 0;
        for (; i < url.length; i++) {
            if (url[i] === '/') {
                cnt++;
                if (cnt === 3)
                    break;
            }
        }
        return url.substring(0, i);
    }

    htmlTest=()=>{
        chrome.tabs.executeScript({
            code:'document.querySelector("body").innerText'
        }, function (result) {
            this.bodyText = result[0];
            console.log(result);
            console.log(this.bodyText);
        });
    }

    handleClose = () => {
        this.setState({
            open: false
        })
    }

    handleClickOpen = () => {
        if (this.searchTitle.length != 0) {
            this.setState({
                open: true
            })
        }
    };

    handleChange = (e) => {
        this.searchTitle=e.target.value;
    }

    handlePress = (e) => {
        if (e.key === 'Enter') {
            this.handleClickOpen();
        }
    }

    preprocess = async (str) => {
        console.log(str);
        let response = await fetch("https://open-korean-text-api.herokuapp.com/tokenize?text=" + str)
        if (response.ok) {
            let json = response.json();
            let words = [];
            for (let token of json.tokens) {
                let split = token.split(/:|\(/);
                let blockPumsa = ['Punctuation', 'Foreign', 'Alpha', 'URL', "ScreenName", "Josa"];
                if (!blockPumsa.includes(split[1])) {
                    let newWord = split[0];
                    words.push(split[0]);
                    //if(split[1]=='Noun')
                    //newWord=properNounLabel(hash[data])
                }
            }
            let sentence = words.join(' ').trim();
            console.log(sentence);
        }
    }

    properNounLabel(info, word) {
        if (info[0] == word)
            return "<타이틀>";
        for (let director in info[1])
            if (director == word)
                return "<감독>";
        for (let director in info[2])
            if (director == word)
                return "<배우>";
        return word;
    }
}
export default withStyles(styles)(Main);