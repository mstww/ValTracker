import React from "react"
import Layout from "./Layout"
import OverlayWrapper from "./settings/OverlayWrapper";
import PopupCard from "./settings/PopupCard";
import { shell } from "electron";
import { ipcRenderer } from "electron";
import pjson from '../../package.json';

const isProd = process.env.NODE_ENV === 'production';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    // Define a state variable to track whether is an error or not
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI

    return { hasError: true };
  }

  onUnload() {
    this.setState({ hasError: false });
  }

  componentDidCatch(error, errorInfo) {
    this.props.router.events.on("routeChangeComplete", () => {
      this.setState({ hasError: false });
    });
    
    console.warn("---------------");
    console.error(error, errorInfo);
    console.warn("---------------");

    if(!isProd) return;
    
    errorInfo.date = Date.now();
    errorInfo.valtracker_version = pjson.version;
    ipcRenderer.send("rendererProcessError", { error, errorInfo });
  }

  render() {
    // Check if the error is thrown
    if (this.state.hasError) {
      return (
        <Layout isNavbarUseable={false}>
          <OverlayWrapper useRef={null} isShown={true}>
            <PopupCard 
              useRef={null}
              header={"Oops! We've encountered an error."} // TODO: Translations
              text={"A bug report has been anonymously sent to our team."}
              text_2={"For any further questions, please join our Discord Server."}
              button_1={"Discord Server"}
              button_1_onClick={() => { shell.openExternal("link"); }}
              button_2={"Retry"}
              button_2_onClick={() => { this.setState({ hasError: false }) }}
              isOpen={true}
              isButtonClickable={true}
            />
          </OverlayWrapper>
        </Layout>
      )
    }

    // Return children components in case of no error

    return this.props.children;
  }
}

export default ErrorBoundary