/*global chrome*/
import React, { Component } from 'react';
import { Button } from '@material-ui/core';
import TextField from '@material-ui/core/TextField';
import { withStyles, createMuiTheme, ThemeProvider } from '@material-ui/core/styles';
import MovieDialog from './MovieDialog'
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Paper from '@material-ui/core/Paper';
import Slider from '@material-ui/core/Slider';
import { Search, Cancel } from '@material-ui/icons';
import IconButton from '@material-ui/core/IconButton';
const styles = {
    root: {
        minWidth: 370,
        background: '#e6e6e6',
        textAlign: 'center',
        paddingBottom: 10,
        overflow: 'hidden'
    },
    wrap: {
        padding: 10,
        margin: 10,
        background: '#FFFFFF',
        textAlign: 'center'
    },
    title: {
        background: 'linear-gradient(30deg, #1d9a89 30%, #199BB0 90%)',
        color: 'white',
        padding: 15,
        fontSize: 16,
        fontWeight: "fontWeightMedium",
        marginBottom: 10
    },
    table: {
        padding: 10,
        margin: 10,
        background: '#FFFFFF',
        textAlign: 'center',
        minHeight: 390
    },
    fullButton: {
        minWidth: 350,
        textAlign: 'center',
        background: 'white'
    },
    text: {
        wordBreak: "keep-all"
    }
};

const theme = createMuiTheme({
    palette: {
        primary: {
            main: '#1d9a89',
        },
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
        return (

            <ThemeProvider theme={theme}>
                <Paper className={classes.root} square={true}>
                    <Paper className={classes.title} square={true} elevation={3}>
                        스포노노
                </Paper>

                    <Paper className={classes.table} elevation={3}>
                        <TextField id="standard-basic" onChange={this.handleChange} onKeyPress={this.handlePress} label="영화제목" />
                        <Button variant="contained" color='primary' onClick={this.handleClickOpen}>
                            <Search></Search>
                        </Button>
                        <MovieDialog addMovie={this.addMovie} title={this.searchTitle} open={this.state.open} onClose={this.handleClose}></MovieDialog>
                        <TableContainer>
                            <Table aria-label="simple table">
                                <TableBody>
                                    {this.state.movieDatas.map((row) => (
                                        <TableRow key={row.name}>
                                            <TableCell align="right">
                                                <img width='80' src={row.poster}></img>
                                            </TableCell>
                                            <TableCell align="right">
                                                <p class={classes.text}>{row.title}</p>
                                                <p>{row.prodYear}</p>
                                            </TableCell>
                                            <TableCell align="right">
                                                <IconButton variant="contained" color='primary' onClick={() => { this.deleteMovie(row) }}>
                                                    <Cancel></Cancel>
                                                </IconButton>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                    <Button
                        variant="contained"
                        className={classes.fullButton}
                        onClick={this.toggleWhiteList}
                        color='white'
                        elevation={3}>
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
        let actorCnt = 0;
        let roles = [];
        for (let s of value.staffs.staff) {
            if (s.staffRoleGroup == '출연') {
                trimData.actor.push(s.staffNm);
                actorCnt += 1;
                let role = s.staffRole.split('/');
                for (let r of role)
                    roles.push(r.replace("목소리", "").trim());
                if (actorCnt >= 5)
                    break;
            }
        }
        trimData.actor = trimData.actor.concat(roles);
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