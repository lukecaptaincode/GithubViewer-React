import axios from 'axios'
import {object} from "prop-types";
// @ts-ignore
import * as randomColor from 'randomcolor';
import * as React from 'react';
import {Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip} from 'recharts'
import WebFont from 'webfontloader';

/**
 * Loads whatever google web font ya wont, makes the component pretty , remove if ya like
 */
WebFont.load({
    google: {
        families: ['Roboto Condensed', 'sans-serif']
    }
});

/**
 * The props interface
 * @prop githubUserName: string - the username of the desired stats to get
 * @prop height: string - the desired height of the component - can be px,em,% - whatever is valid css
 * @prop width: string - the desired width of the component - can be px,em,% - whatever is valid css
 * @prop exclusions: string [] - the string array with the repo names of repos to exclude
 */
interface IProps {
    githubUserName: string;
    height: string;
    width: string;
    exclusions: string [];
}

export class GithubViewer extends React.Component<IProps> {

    public readonly state = { reposAmount: 0, repoObject: object, language: []};
    private apiRoot = "https://api.github.com/";
    private languageInfo: any = [];
    // Get the exclusions array from the props
    private repoExclusions: any = this.props.exclusions;
    /* Add your github access token to the env file OR you can add it here plain text if your mental. DO NOT COMMIT YA
     * DANG ENV FILE
    */
    private accessToken = '?access_token=' + process.env.REACT_APP_GITHUB_TOKEN;

    // Style objects
    private githubViewerContainerStyle = {
        backgroundColor: '#222221',
        border: '3px solid #99BA6C',
        color: '#6576AA',
        display: 'flex',
        fontFamily: 'Roboto Condensed, sans-serif',
        height: this.props.height,
        width: this.props.width
    };
    private statsContainerStyle = {
        borderRight: '1px solid #99BA6C',
        height: 'inherit',
        overflow: 'hidden',
        width: '30%'

    };
    private chartContainerStyle = {
        borderLeft: '1px solid #99BA6C',
        height: 'inherit',
        width: '70%'
    };
    private repoListStyle = {
        height: '90%',
        overflow: 'auto',
        overflowY: 'scroll' as 'scroll',
        textAlign: 'left' as 'left'
    };
    private listStyles = {
        listStyle: 'none'
    };
    private linkStyle = {
        color: '#6576AA',
        marginLeft: '5%',
        textDecoration: 'none'
    };

    /**
     * Constructor
     * @param props
     */
    constructor(props: any) {
        super(props);
        // Welcome to the promise land TODO there is 100% a better way to do this
        this.getRepoObject().then(response => this.getLanguages(this.state.repoObject)
            .then(responses => this.sortLanguages()));

    }

    /**
     * Renderer - returns the built component to be rendered
     */
    public render() {
        return (
            <div id="githubViewerContainer" style={this.githubViewerContainerStyle}>
                <div id="statsContainer" style={this.statsContainerStyle}>
                    <h2>Number of Repos {this.state.reposAmount}</h2>
                    <div id="repoList" style={this.repoListStyle}>
                        <ul style={{paddingLeft: 0}}>
                            {this.listRepos(this.state.repoObject)}
                        </ul>
                    </div>
                </div>
                <div id="chartContainer" style={this.chartContainerStyle}>
                    <h2>Repo language split</h2>
                    {
                        this.loadChart()
                    }
                </div>
            </div>
        );
    }

    /**
     * Creates and returns that chart that displays the split of language across all repos
     * The colors for the chart are randomly generated via the randomColor node module, this is a solid
     * requirement as it could replaced with whatever  (large pre generated array of hex codes, random colour method, etc)
     *  --- I've used a legend to highlight the different colours instead of label callouts as the labels where all squished
     */
    private loadChart() {
        // Generated random colours to the size of the language array
        const colors = randomColor({count:this.state.language.length});
        return (
            <ResponsiveContainer>
                <PieChart>

                    <Pie dataKey="value" nameKey="name" isAnimationActive={false} data={this.state.language} cx="50%"  // Use the language array as the data source
                         cy="42%" outerRadius='80%'
                         fill="#8884d8" stroke="#000">
                        {
                            // Creates cells for each colour using the language array and COLORS array
                            this.state.language.map((entry, index) => <Cell key={`cell-${index}`}
                                                                            fill={colors[index % colors.length]}/>)
                        }
                    </Pie>
                    <Tooltip/>
                    <Legend verticalAlign="top" height={36}/>
                </PieChart>
            </ResponsiveContainer>);
    }

    /**
     * Calls the github api using the access token from the env, the api root and the github username passed as a prop
     * ones the request resolves, update the amount of repos (public of course) and add the returned object to the
     * repoObject in the state for late use
     */
    private async getRepoObject() {
        const requestUrl = this.apiRoot + "users/" + this.props.githubUserName + "/repos" + this.accessToken;
        await axios.get(requestUrl).then(response => this.setState({
            repoObject: response,
            reposAmount: response.data.length
        }));
    }

    /**
     * Gets the language info of all repos in the repoObject by calling the github api using the root, username prop
     * the name of the repo and access token. If the name of the repo is on the exclusion list, it wont have its languages pulled.
     * The response is then added to the language repo array.
     * @param repoObject
     */
    private async getLanguages(repoObject: any) {
        for (const data of repoObject.data) {
            if (!this.repoExclusions.includes(data.name)) {
                const requestUrl = this.apiRoot + "repos/" + this.props.githubUserName + "/" + data.name + "/languages" + this.accessToken;
                await axios.get(requestUrl).then(response => {
                    this.languageInfo.push(response.data);
                });
            }

        }
    }

    /**
     * Gets the list of repos from the repo object and returns them as a HTML list.
     * Will also not list objects in the exclusion list.
     * -- Have wrapped this in a try catch to avoid errors when the repoObject is undefined
     * TODO add better handling of this instead of try catch
     * @param repoObject
     */
    private listRepos(repoObject: any) {
        const items: any = [];
        try {
            for (const data of repoObject.data) {
                if (!this.repoExclusions.includes(data.name)) {
                    items.push(<li style={this.listStyles} key={Math.random()}><a style={this.linkStyle}
                                                                                  href={data.html_url}
                                                                                  target="_blank">{data.name}</a></li>);
                    items.push(<hr
                        style={{color: '#F1EAB6', backgroundColor: '#F1EAB6', height: 0.5, width: '100%'}}/>);
                }
            }
            return (items);
        } catch (e) {
            return (null);
        }

    }

    /**
     * Sorts the language language info array to get a count of how many repos the language is present in, formats
     * that data for consumption by the chart builder and then adds the result the state.
     */
    private sortLanguages() {
        const tmpObj: any = {};
        const tmpArray: any = [];
        for (const data of this.languageInfo) {
            for (const key of  Object.keys(data)) {
                /* If the language doesnt already exist in the tmpObj add it and give it the value one as it exists in at
                 * least on repo, else increment the value
                */
                if (!tmpObj.hasOwnProperty(key)) {
                    tmpObj[key] = 1
                    /* data[key]; */
                } else {
                    tmpObj[key] = tmpObj[key] + 1/* data[key] */;
                }
            }
        }
        // Format the data entry of the tmoObj and push them into the tmpArray, this makes the data easier for the chart to use.
        for (const key of  Object.keys(tmpObj)) {
            tmpArray.push({name: key, value: tmpObj[key]})
        }
        this.setState({language: tmpArray});
    }

}
