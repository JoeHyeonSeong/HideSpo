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
import {Close,AddCircle, CancelOutlined} from '@material-ui/icons';

const styles = {
    text:{
        wordBreak:"keep-all"
    },
    yearText:{
        fontSize:"smaller"
    },
    titleText:{
        fontWeight:"bold",
        wordBreak: "keep-all"
    },
    title:{
        color:"#FFFFFF",
        padding:0,
        backgroundColor:"#ffa703",
        textAlign:"center"
    },
    cell:{
        padding:8,
        height:126,
        backgroundColor:"#e8e8e894"
    },
    tableText:{
        verticalAlign:"middle",
        color:"#0000006b",
        textAlign:"center"
    },
    table: {
        textAlign:"center"
    },
    closeButton:{

    }
};

class MovieDialog extends Component {
    state = {
        movieData: [],
        searchStatusText:''
    }
    
    componentDidUpdate(prevProps, prevState) {
        if (prevProps.open != this.props.open && this.props.open) {
            this.searchMovie();
        }
    }

    render() {
        const name = 'react';
        const { classes } = this.props;
        return (
            <Dialog fullScreen={true} onClose={this.props.onClose} open={this.props.open}>
                <Paper className={classes.title} square={true}>
                    <IconButton aria-label="close" className={classes.closeButton} onClick={this.props.onClose}>
                        <CancelOutlined  color="secondary"></CancelOutlined>
                    </IconButton>
                </Paper>
                <TableContainer component={Paper} square={true}  elevation={0}>
                    <Table aria-label="simple table">
                        <TableBody>
                            {this.state.movieData.map((row) => (
                                <TableRow key={row.name}>
                                    <TableCell className={classes.cell}>
                                        <img width='80' src={row.poster}></img>
                                        </TableCell>
                                    <TableCell className={classes.cell}>
                                        <p class={classes.titleText}>{(row.title.length<14)? row.title:row.title.substring(0,14)+"..."}</p>
                                        <p class={classes.yearText}>{row.prodYear}</p>
                                        </TableCell>
                                    <TableCell align="right" className={classes.cell}>
                                        <IconButton variant="contained" color="primary"
                                        onClick={() => { this.props.addMovie(row) }}>
                                            <AddCircle></AddCircle>
                                            </IconButton>
                                        </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                            <div class={classes.tableText}>
                                {this.state.searchStatusText}
                            </div>
            </Dialog>

        );
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
            movieData: [],
            searchStatusText: '검색 중'
        }, async () => {
            if (response.ok) {
                let json = await response.json();
                let results = json.Data[0].Result;
                //console.log(results);
                if (typeof results === 'undefined') {
                    this.setState({
                        movieData: [],
                        searchStatusText: '검색결과가 없습니다.'
                    });
                }
                else {
                    this.searchStatusText = '';
                    for (let r of results) {
                        r.title = r.title.replace(/ !HS | !HE /gi, '');
                        r.poster = r.posters.split('|')[0];
                    }
                    this.setState({
                        movieData: results,
                        searchStatusText: ''
                    });
                }

            }
        });
    }
}
export default withStyles(styles)(MovieDialog);