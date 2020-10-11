import React, { Component } from 'react';
import { Button } from '@material-ui/core';
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
import CloseIcon from '@material-ui/icons/Close';

const styles = {
    root: {
        minWidth: 400,
    },
};

class MovieDialog extends Component {
    state = {
        movieData: []
    }

    componentDidUpdate(prevProps, prevState){
        if (prevProps.open != this.props.open && this.props.open) {
            this.searchMovie();
        }
    }

    render() {
        const name = 'react';
        const { classes } = this.props;
        return (
            <Dialog className={classes.root} onClose={this.props.onClose} open={this.props.open}>
                <DialogTitle>영화 목록
                    <IconButton aria-label="close" className={classes.closeButton} onClick={this.props.onClose}>
                        <CloseIcon />
                    </IconButton>
                </DialogTitle>
                <TableContainer component={Paper}>
                    <Table aria-label="simple table">
                        <TableHead>
                            <TableRow>
                                <TableCell align="right">제목</TableCell>
                                <TableCell align="right">연도</TableCell>
                                <TableCell align="right">국가</TableCell>
                                <TableCell align="right">감독</TableCell>
                                <TableCell align="right">추가</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {this.state.movieData.map((row) => (
                                <TableRow key={row.name}>
                                    <TableCell align="right">{row.title}</TableCell>
                                    <TableCell align="right">{row.prodYear}</TableCell>
                                    <TableCell align="right">{row.nation}</TableCell>
                                    <TableCell align="right">{row.directors.director[0].directorNm}</TableCell>
                                    <TableCell align="right"><Button variant="contained" color="primary" onClick={() => { this.props.addMovie(row) }}>+</Button></TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Dialog>

        );
    }

    handleChange = (e) => {
        this.setState({
            title: e.target.value
        })
    }

    searchMovie = async () => {
        console.log("search: "+this.props.title)
        let basicUrl = "http://api.koreafilm.or.kr/openapi-data2/wisenut/search_api/search_json2.jsp?"
            + "collection=kmdb_new2&ServiceKey=M9RA61A20074QJD5W74X&use=극장용&detail=N&sort=prodYear,1&title=";
        let response = await fetch(basicUrl + this.props.title)
        if (response.ok) {
            let json = await response.json();
            let results = json.Data[0].Result;
            for (let r of results) {
                console.log(r);
                r.title = r.title.replace(/ !HS | !HE /gi, '');
                console.log(r.title);
            }
            this.setState({
                movieData: json.Data[0].Result
            });
        }
    }
}
export default withStyles(styles)(MovieDialog);