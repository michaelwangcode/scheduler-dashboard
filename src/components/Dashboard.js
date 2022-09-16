// Creating an Application using old React classes
import React, { Component } from "react";
import classnames from "classnames";
import Loading from "./Loading";
import Panel from "./Panel";
import axios from "axios";
import { setInterview } from "helpers/reducers";

// Import helper functions
import {
  getTotalInterviews,
  getLeastPopularTimeSlot,
  getMostPopularDay,
  getInterviewsPerDay
 } from "helpers/selectors";


// Mock data (used initially)
const data = [
  {
    id: 1,
    label: "Total Interviews",
    getValue: getTotalInterviews
  },
  {
    id: 2,
    label: "Least Popular Time Slot",
    getValue: getLeastPopularTimeSlot
  },
  {
    id: 3,
    label: "Most Popular Day",
    getValue: getMostPopularDay
  },
  {
    id: 4,
    label: "Interviews Per Day",
    getValue: getInterviewsPerDay
  }
];


// Create the Dashboard class
class Dashboard extends Component {

  // Store the state
  state = {
    loading: true,
    focused: null,
    days: [],
    appointments: {},
    interviewers: {}
  };


  // Function for clicking on a panel
  selectPanel(id) {
    this.setState(previousState => ({
      focused: previousState.focused !== null ? null : id
    }));
  }


  // Use the componentDidMount lifecycle method to check to see if there is saved focus state 
  // When the local storage contains state, we can set the state of the application to match.
  componentDidMount() {

    // Get the data from the scheduler api
    Promise.all([
      axios.get("/api/days"),
      axios.get("/api/appointments"),
      axios.get("/api/interviewers")
    ]).then(([days, appointments, interviewers]) => {
      this.setState({
        loading: false,
        days: days.data,
        appointments: appointments.data,
        interviewers: interviewers.data
      });
    });

    // Add websocket
    this.socket = new WebSocket(process.env.REACT_APP_WEBSOCKET_URL);

    // Listen for messages on the socket and update the state
    this.socket.onmessage = event => {
      const data = JSON.parse(event.data);
    
      if (typeof data === "object" && data.type === "SET_INTERVIEW") {
        this.setState(previousState =>
          setInterview(previousState, data.id, data.interview)
        );
      }
    };

    // Get the focused state
    const focused = JSON.parse(localStorage.getItem("focused"));

    // Set state to focused if focused
    if (focused) {
      this.setState({ focused });
    }
  }


  // Use the componentDidUpdate lifecycle method to listen for changes to the state.
  componentDidUpdate(previousProps, previousState) {

    if (previousState.focused !== this.state.focused) {
      localStorage.setItem("focused", JSON.stringify(this.state.focused));
    }
  }

  
  // This function removes the websocket
  componentWillUnmount() {
    this.socket.close();
  }


  // Render function
  render() {

    console.log(this.state)
    // Add conditional CSS class to dashboardClasses
    const dashboardClasses = classnames("dashboard", {
      "dashboard--focused": this.state.focused
     });

    // If the state is loading return the Loading component
    if (this.state.loading) {
      return <Loading />;
    }


    // Filter panel data before converting to components
    // If this.state.focused is null then return true for every panel (display all panels)
    // If this.state.focused is equal to the Panel id, then let it through the filter (ignore other Panels)
    const panels = (this.state.focused ? data.filter(panel => this.state.focused === panel.id) : data)
    .map(panel => (
      <Panel
      key={panel.id}
      label={panel.label}
      value={panel.getValue(this.state)}
      onSelect={() => this.selectPanel(panel.id)}
      />
    ));

    return <main className={dashboardClasses}>{panels}</main>;
  }
}

export default Dashboard;
