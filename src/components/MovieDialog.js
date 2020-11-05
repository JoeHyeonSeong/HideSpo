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
import {Close,AddCircle} from '@material-ui/icons';

const styles = {
    text:{
        wordBreak:"keep-all",
        textAlign:'center'
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
                <DialogTitle>영화 목록
                    <IconButton aria-label="close" className={classes.closeButton} onClick={this.props.onClose}>
                        <Close></Close>
                    </IconButton>
                </DialogTitle>
                <TableContainer component={Paper}>
                    <Table aria-label="simple table">
                        <TableBody>
                            {this.state.movieData.map((row) => (
                                <TableRow key={row.name}>
                                    <TableCell align="right">
                                        <img width='80' src={row.poster}></img>
                                        </TableCell>
                                    <TableCell align="right" >
                                        <p class={classes.text}>{row.title}</p>
                                        <p>{row.prodYear}</p>
                                        </TableCell>
                                    <TableCell align="right">
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
                            <div class={classes.text}>
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
        let basicUrl = "http://api.koreafilm.or.kr/openapi-data2/wisenut/search_api/search_json2.jsp?"
            + "collection=kmdb_new2&ServiceKey=M9RA61A20074QJD5W74X&use=극장용&detail=Y&listCount=500&title=";
        let response = await fetch(basicUrl + this.props.title)
        this.setState({
            movieData: [],
            searchStatusText: '검색 중'
        }, async () => {
            if (response.ok) {
                let json = await response.json();
                let results = json.Data[0].Result;
                console.log(results);
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