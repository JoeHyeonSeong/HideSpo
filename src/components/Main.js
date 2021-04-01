/*global chrome*/
import React, { Component } from 'react';
import { Button } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import { withStyles, createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import MovieDialog from './MovieDialog'
import Paper from '@material-ui/core/Paper';
import { Search, Close, NavigateNext,NavigateBefore } from '@material-ui/icons';
import IconButton from '@material-ui/core/IconButton';
import InputAdornment from '@material-ui/core/InputAdornment';
import Carousel from "react-material-ui-carousel"

const styles = {
    root: {
        background: '#FFFFFF',
        textAlign: 'center',
        overflow: 'hidden',
        width: 260
    },
    wrap: {
        padding: 10,
        margin: 10,
        background: '#FFFFFF',
        textAlign: 'center'
    },
    title: {
        background: '#ffa703',
        color: 'white',
        fontSize: 16,
        padding: 5,
        fontWeight: "fontWeightMedium",
        position: "relative",
        zIndex: 2
    },
    table: {
        minHeight:277.5
    },
    fullButton: {
        //background: '#ffa703',
        color: 'white',
        borderRadius: 25,
        fontWeight: 1000,
        margin: 10
    },
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
    titleText: {
        fontWeight: "bold",
        wordBreak: "keep-all"
    },
    yearText: {
        fontSize: "smaller"
    },
    tableText: {
        width: "100%",
        color: "#0000006b",
        lineHeight:'277.5px'
    },
    search: {
        color: '#FFFFFF',
        borderRadius: 25,
        backgroundColor: '#ffffff47',
        '& .MuiInputBase-root': {
            color: 'white',
            fontWeight: 1000
        },
        [`& fieldset`]: {
            borderRadius: 25,
        },
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
    poster: {
        borderRadius: 10
    },
    deleteButton: {
        position: "absolute",
        right: "0%",
        padding: 4,
        backgroundColor:'#00000042',
        '&:hover': {
            backgroundColor: '#0000008a',
        },
    },
    width100: {
        width: "100%"
    }
};

const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#ffa703',

        },
        secondary: {
            main: '#FFFFFF'
        }
    },
});

class Main extends Component {
    state = {
        open: false,
        movieDatas: [],
        onWhiteList: false,
        blockPower: 1
    }
    searchTitle = '';
    bodyText = '';
    blockPowerText = [
        '스포일러를 차단하지 않습니다.',
        '의미를 분석해 스포일러일 확률이 높은 문장을 차단합니다.',
        '영화의 제목이 포함된 문장을 차단합니다.',
        '영화의 제목, 감독, 배우, 배역이 포함된 문장을 차단합니다.'
    ];
    componentDidMount() {
        chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
            if (request.message === "whiteList") {
                this.setState({ onWhiteList: request.onWhiteList });
            } else if (request.message === "getMovieDataReply") {
                this.setState({
                    movieDatas: request.movieData,
                    blockPower: request.blockPower
                });
            }
        });
        chrome.runtime.sendMessage({
            message: 'getMovieData'
        });
        chrome.tabs.executeScript(
            { code: "document.domain" },
            (results) => {
                let url = results[0];
                chrome.runtime.sendMessage({
                    message: 'whiteListCheck',
                    url: url
                });
            });
    }

    render() {
        const { classes } = this.props;
        let tableText = (this.state.movieDatas.length > 0) ? "" : "추가된 영화 없음";
        console.log(this.movieData);
        return (

            <ThemeProvider theme={theme}>
                <Paper className={classes.root} square={true}>
                    <Paper className={classes.title} elevation={3} square={true}>
                        <img width='82' src="images/title.png"></img>
                        <TextField
                            onChange={this.handleChange}
                            onKeyPress={this.handlePress}
                            placeholder="영화제목"
                            className={classes.search}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="end">
                                        <Search color="secondary"></Search>
                                    </InputAdornment>
                                ),
                                disableUnderline: true
                            }
                            }
                        />
                    </Paper>

                    <MovieDialog addMovie={this.addMovie}
                        title={this.searchTitle}
                        open={this.state.open}
                        onClose={this.handleClose}></MovieDialog>
                    <Carousel
                        className={classes.table}
                        autoPlay={false}
                        animation={"slide"}
                        navButtonsAlwaysVisible={(this.state.movieDatas.length>1)?true:false}
                        navButtonsAlwaysInvisible={(this.state.movieDatas.length>1)?false:true}
                        fullHeightHover={false}
                        navButtonsProps={{
                            style:{
                                backgroundColor:'#ffffff00',
                                padding:0,
                                color:'#494949'
                            }
                        }}
                        NextIcon={<NavigateNext fontSize="large"></NavigateNext>}
                        PrevIcon={<NavigateBefore fontSize="large"></NavigateBefore>}
                        >
                        {
                            (this.state.movieDatas.length > 0) ?
                                this.state.movieDatas.map((row) => (
                                    <Paper className={classes.row} key={row.name} elevation={3}>
                                        <span style={
                                            {
                                            textAlign: "right",
                                            width: "100%",
                                            borderRadius: 10,
                                            overflow: "hidden",
                                            backgroundImage: (row.poster)?'url('+row.poster+')':'url(images/no_poster_found.png)',
                                            backgroundPosition: 'center',
                                            backgroundSize: 'cover'
                                        }}>
                                            <IconButton color="secondary" className={classes.deleteButton} variant="contained" onClick={() => { this.deleteMovie(row) }}>
                                                <Close></Close>
                                            </IconButton>
                                            <div className={classes.text}>
                                                <div className={classes.width100}>
                                                    <p class={classes.titleText}>{(row.title.length < 14) ? row.title : row.title.substring(0, 14) + "..."}</p>
                                                    <p class={classes.yearText}>{row.prodYear}</p>
                                                </div>

                                            </div>
                                        </span>
                                    </Paper>
                                )) :
                                <div class={classes.tableText}>
                                    {tableText}
                                </div>
                        }

                    </Carousel>
                    <Button
                        variant="contained"
                        className={classes.fullButton}
                        color="primary"
                        onClick={this.toggleWhiteList}
                    >
                        {this.state.onWhiteList ? '이 사이트에서 사용' : '이 사이트에서 사용 중지'}
                    </Button>
                    {/*<Paper className={classes.wrap} elevation={3}>
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
                                    </Paper>*/}
                </Paper>
            </ThemeProvider>

        );
    }

    addMovie = (value) => {
        let trimData = {};
        trimData.title = value.title.trim();
        trimData.prodYear = value.prodYear;
        trimData.nation = value.nation;
        trimData.director = value.directors.director.map(d => d.directorNm);
        trimData.actor = [];
        trimData.poster = value.poster;
        for (let s of value.staffs.staff) {
            if (s.staffRoleGroup == '출연') {
                let role = s.staffRole.split('/');
                let roles = [];
                for (let r of role)
                    roles.push(r.replace("목소리", "").trim());
                trimData.actor.push([s.staffNm, roles]);
            }
        }
        for (let m of this.state.movieDatas) {
            if (trimData.title === m.title && trimData.prodYear === m.prodYear) {
                this.handleClose();
                return;
            }
        }
        console.log(trimData)
        let newDatas = this.state.movieDatas.concat(trimData);
        this.setState({
            movieDatas: newDatas
        });
        chrome.runtime.sendMessage({
            message: 'setMovieData',
            movieData: newDatas,
            add: true
        });
        this.handleClose();
    }

    deleteMovie = (value) => {
        const { movieDatas } = this.state;
        let newDatas = movieDatas.filter(info => info.title !== value.title);
        this.setState({
            movieDatas: newDatas
        });
        chrome.runtime.sendMessage({
            message: 'setMovieData',
            movieData: newDatas,
            add: false
        });
    }

    toggleWhiteList = () => {
        let url;
        chrome.tabs.executeScript(
            { code: "document.domain" },
            (results) => {
                url = results[0];
                if (this.state.onWhiteList) {
                    chrome.runtime.sendMessage({
                        message: 'whiteListDelete',
                        url: url
                    });
                }
                else {
                    chrome.runtime.sendMessage({
                        message: 'whiteListAdd',
                        url: url
                    });
                }
            });

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
        this.searchTitle = e.target.value;
    }

    handlePress = (e) => {
        if (e.key === 'Enter') {
            this.handleClickOpen();
        }
    }
}
export default withStyles(styles)(Main);