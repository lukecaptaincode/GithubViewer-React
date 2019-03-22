import * as React from 'react';
import * as ReactDOM from 'react-dom';
import {GithubViewer} from './components/GithubViewer';

ReactDOM.render(
  <GithubViewer githubUserName={'lukecaptaincode'} height={"500px"} width={"800px"} exclusions={["iot_ca1_x14742841"]}/>,
  document.getElementById('githubViewer') as HTMLElement
);

