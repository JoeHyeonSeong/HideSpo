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
};

class MovieDialog extends Component {
    state = {
        movieData: []
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
            <Dialog fullWidth={true} onClose={this.props.onClose} open={this.props.open}>
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
                                    <TableCell align="right">
                                        <div>{row.title}</div>
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
            + "collection=kmdb_new2&ServiceKey=M9RA61A20074QJD5W74X&use=극장용&detail=Y&sort=prodYear,1&title=";
        let response = await fetch(basicUrl + this.props.title)
        if (response.ok) {
            let json = await response.json();
            let results = json.Data[0].Result;
            
            if (typeof results === 'undefined') {
                this.setState({
                    movieData: []
                });
            }
            else {
                for (let r of results) {
                    r.title = r.title.replace(/ !HS | !HE /gi, '');
                    r.poster=r.posters.split('|')[0];
                }
                this.setState({
                    movieData: results
                });
            }

        }
    }
}
export default withStyles(styles)(MovieDialog);