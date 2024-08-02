import React, {useState} from 'react';
import PropTypes from 'prop-types';
import { withStyles, useTheme } from '@mui/styles';
import Typography from '@mui/material/Typography';

import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';

import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';

// https://mui.com/material-ui/material-icons/
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import MenuIcon from '@mui/icons-material/Menu';
import ContrastIcon from '@mui/icons-material/Contrast';
import SearchIcon from '@mui/icons-material/Search';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import StraightenIcon from '@mui/icons-material/Straighten';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';

import RectangleOutlinedIcon from '@mui/icons-material/RectangleOutlined';
import Divider from "@mui/material/Divider";

import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Slide from '@mui/material/Slide';
import Toolbar from '@mui/material/Toolbar';

import TagsTable from './TagsTable';

import './DwvComponent.css';
import {
  App,
  getDwvVersion,
  decoderScripts
} from 'dwv';
import {Draw} from "@mui/icons-material";

// Image decoders (for web workers)
decoderScripts.jpeg2000 = `${process.env.PUBLIC_URL}/assets/dwv/decoders/pdfjs/decode-jpeg2000.js`;
decoderScripts["jpeg-lossless"] = `${process.env.PUBLIC_URL}/assets/dwv/decoders/rii-mango/decode-jpegloss.js`;
decoderScripts["jpeg-baseline"] = `${process.env.PUBLIC_URL}/assets/dwv/decoders/pdfjs/decode-jpegbaseline.js`;
decoderScripts.rle = `${process.env.PUBLIC_URL}/assets/dwv/decoders/dwv/decode-rle.js`;

const styles = theme => ({
  appBar: {
    position: 'relative',
  },
  title: {
    flex: '0 0 auto',
  },
  iconSmall: {
    fontSize: 20,
  }
});

//transition
export const TransitionUp = React.forwardRef((props, ref) => (
  <Slide direction="up" {...props} ref={ref} />
))

class DwvComponent extends React.Component {


  constructor(props) {
    super(props);
    this.state = {
      versions: {
        dwv: getDwvVersion(),
        react: React.version
      },
      tools: {
        Scroll: {},
        ZoomAndPan: {},
        WindowLevel: {}, //  this key is for contrast manipulation
        Draw: {
          options: ['Draw_Ruler', 'Draw_Rectangle']
        }
      },
      selectedTool: 'Select Tool',
      loadProgress: 0,
      dataLoaded: false,
      dwvApp: null,
      metaData: {}, //metaData structure => {tagName: {value: string | number}, ...}
      orientation: undefined,
      showDicomTags: false,
      dropboxDivId: 'dropBox',
      dropboxClassName: 'dropBox',
      borderClassName: 'dropBoxBorder',
      hoverClassName: 'hover'
    };
  }

  render() {
    const { classes } = this.props;
    const { versions, tools, loadProgress, dataLoaded, metaData } = this.state;

    const handleToolChange = (event, newTool) => {
      console.log(newTool)
      if (newTool) {
        this.onChangeTool(newTool);
      }
    };

    // const handleShapeChange = (event , newShape) => {
    //   if (newShape) {
    //     this.onChangeShape(newShape);
    //   }
    // };


    const drawShapeButtons = this.state.tools.Draw.options.map((option) => {
      // console.log(this.state.tools.Draw.options);
      // console.log(option);
      return (
          <ToggleButton
              value={option}
              key={option}
              title={option}
              disabled={!dataLoaded}
          >
            {this.getToolIcon(option.split("_")[1])}
          </ToggleButton>
      );
    });

    const toolsButtons = Object.keys(tools).map( (tool) => { // bug : Draw_Ruler is not good, you should not change the name of the options of the draw key, you should handle it another way.
      if (tool.split("_")[0] !== 'Draw')
      {
        return (
            <ToggleButton value={tool} key={tool} title={tool}
                          disabled={!dataLoaded || !this.canRunTool(tool)}>
              {this.getToolIcon(tool)}
            </ToggleButton>
        );
      }
      else {
        return drawShapeButtons;
      }
    });



    return (
      <div id="dwv">
        <LinearProgress variant="determinate" value={loadProgress} />
        <Stack direction="row" spacing={1} padding={1}
          justifyContent="center" flexWrap="wrap">

          <ToggleButtonGroup size="small"
            color="primary"
            value={ this.state.selectedTool }
            exclusive
            onChange={handleToolChange}
          >
            {toolsButtons}
          </ToggleButtonGroup>

          <ToggleButton size="small"
            value="reset"
            title="Reset"
            disabled={!dataLoaded}
            onChange={this.onReset}
          ><RefreshIcon /></ToggleButton>

          <ToggleButton size="small"
            value="toggleOrientation"
            title="Toggle Orientation"
            disabled={!dataLoaded}
            onClick={this.toggleOrientation}
          ><CameraswitchIcon /></ToggleButton>

          <ToggleButton size="small"
            value="tags"
            title="Tags"
            disabled={!dataLoaded}
            onClick={this.handleTagsDialogOpen}
          ><LibraryBooksIcon /></ToggleButton>

          {/*Tags table is a Dialog (which is a component in mui)*/}
          <Dialog
            open={this.state.showDicomTags}
            onClose={this.handleTagsDialogClose}
            TransitionComponent={TransitionUp}
            >
              <AppBar className={classes.appBar} position="sticky"> // this is the header of the dialog
                <Toolbar>
                  <IconButton color="inherit" onClick={this.handleTagsDialogClose} aria-label="Close">
                    <CloseIcon />
                  </IconButton>
                  <Typography variant="h6" color="inherit" className={classes.flex}>
                    DICOM Tags
                  </Typography>
                </Toolbar>
              </AppBar>
              <TagsTable data={metaData} />
          </Dialog>
        </Stack>

        {/*DropBox*/}
        <div id="layerGroup0" className="layerGroup">
          <div id="dropBox"></div>
        </div>

        {/*The text at the bottom of the page*/}
        <div><p className="legend">
          <Typography variant="caption">Powered by <Link
              href="https://github.com/ivmartel/dwv"
              title="dwv on github"
              color="inherit">dwv
            </Link> {versions.dwv} and <Link
              href="https://github.com/facebook/react"
              title="react on github"
              color="inherit">React
            </Link> {versions.react}
          </Typography>
        </p></div>

      </div>
    );
  }
  /**In the `componentDidMount` method of the `DwvComponent`, several event listeners are added to handle different stages of loading and interacting with DICOM images. These events help manage the user interface, update the component's state, and handle errors during the image loading process. Here's a detailed explanation of each event and its purpose:

   ### `componentDidMount` Method Events

   1. **Load Events**:
   - **`loadstart`**:
   - **Purpose**: Initializes the loading process.
   - **Actions**:
   - Resets internal flags (`nLoadItem`, `nReceivedLoadError`, `nReceivedLoadAbort`, `isFirstRender`).
   - Hides the drop box used for drag-and-drop file loading.

   - **`loadprogress`**:
   - **Purpose**: Updates the loading progress.
   - **Actions**: Updates the component's state to reflect the current progress of the loading process (`loadProgress`).

   - **`renderend`**:
   - **Purpose**: Indicates the end of the rendering process.
   - **Actions**:
   - Checks if it's the first render.
   - Sets the initial tool to `ZoomAndPan` or `Scroll` based on the capabilities of the DWV app.

   - **`load`**:
   - **Purpose**: Completes the loading process.
   - **Actions**:
   - Sets the DICOM metadata in the component's state (`metaData`).
   - Updates the flag indicating that data has been loaded (`dataLoaded`).

   - **`loadend`**:
   - **Purpose**: Indicates the end of the entire loading process.
   - **Actions**:
   - Checks for errors or aborts during the load.
   - Resets the load progress and shows alerts if there were errors or if the load was aborted.
   - Displays the drop box again if no items were loaded.

   - **`loaditem`**:
   - **Purpose**: Tracks the number of loaded items.
   - **Actions**: Increments the `nLoadItem` counter.

   - **`loaderror`**:
   - **Purpose**: Handles errors during the load process.
   - **Actions**:
   - Logs the error to the console.
   - Increments the `nReceivedLoadError` counter.

   - **`loadabort`**:
   - **Purpose**: Handles the load abort event.
   - **Actions**: Increments the `nReceivedLoadAbort` counter.

   2. **Keyboard and Resize Events**:
   - **`keydown`**:
   - **Purpose**: Handles keydown events.
   - **Actions**: Calls the default keydown handler of the DWV app (`app.defaultOnKeydown(event)`).

   - **`resize`**:
   - **Purpose**: Handles window resize events.
   - **Actions**: Calls the DWV app's resize handler (`app.onResize`) to adjust the viewer size accordingly.

   ### Additional Methods Used in `componentDidMount`

   - **`showDropbox(app, show)`**:
   - **Purpose**: Shows or hides the dropbox based on the `show` parameter.
   - **Actions**:
   - Adds or removes event listeners for drag-and-drop functionality on the dropbox and layer div elements.
   - Manages the visibility and content of the dropbox.

   ### Summary of Event Flow

   1. **Initialization**:
   - The `loadstart` event initializes loading flags and hides the drop box.

   2. **Progress Tracking**:
   - The `loadprogress` event updates the loading progress state.

   3. **Rendering**:
   - The `renderend` event determines and sets the initial tool after the first render.

   4. **Completion**:
   - The `load` event updates the metadata and sets the data loaded flag.
   - The `loadend` event checks for errors or aborts, resets the progress, and may show alerts and the dropbox.

   5. **Error Handling**:
   - The `loaderror` and `loadabort` events handle and log errors and aborts, updating the respective counters.

   6. **User Interaction**:
   - The `keydown` event integrates keyboard interactions with the DWV app.
   - The `resize` event adjusts the viewer size dynamically with window resizing.

   These events ensure a smooth and responsive user experience by handling the various stages of the DICOM image loading and rendering process, updating the UI, and providing feedback in case of errors.
   */
  componentDidMount() {

    // create app (dwv app (dwv.d.ts))
    const app = new App();

    // initialise app ?
    app.init({
      "dataViewConfigs": {'*': [{divId: 'layerGroup0'}]},
      "tools": this.state.tools
    });

    // load events
    let nLoadItem = null;
    let nReceivedLoadError = null;
    let nReceivedLoadAbort = null;
    let isFirstRender = null;

    app.addEventListener('loadstart', (/*event*/) => {
      // reset flags
      nLoadItem = 0;
      nReceivedLoadError = 0;
      nReceivedLoadAbort = 0;
      isFirstRender = true;
      // hide drop box
      this.showDropbox(app, false);
    });

    app.addEventListener("loadprogress", (event) => {
      this.setState({loadProgress: event.loaded});
    });

    app.addEventListener('renderend', (/*event*/) => {
      if (isFirstRender) {
        isFirstRender = false;
        // available tools
        let selectedTool = 'ZoomAndPan';
        if (app.canScroll()) {
          selectedTool = 'Scroll';
        }
        this.onChangeTool(selectedTool);
      }
    });
    app.addEventListener("load", (event) => {
      // set dicom tags
      this.setState({metaData: app.getMetaData(event.dataid)});
      // set data loaded flag
      this.setState({dataLoaded: true});
    });
    app.addEventListener('loadend', (/*event*/) => {
      if (nReceivedLoadError) {
        this.setState({loadProgress: 0});
        alert('Received errors during load. Check log for details.');
        // show drop box if nothing has been loaded
        if (!nLoadItem) {
          this.showDropbox(app, true);
        }
      }
      if (nReceivedLoadAbort) {
        this.setState({loadProgress: 0});
        alert('Load was aborted.');
        this.showDropbox(app, true);
      }
    });
    app.addEventListener('loaditem', (/*event*/) => {
      ++nLoadItem;
    });
    app.addEventListener('loaderror', (event) => {
      console.error(event.error);
      ++nReceivedLoadError;
    });
    app.addEventListener('loadabort', (/*event*/) => {
      ++nReceivedLoadAbort;
    });

    // handle key events ?
    app.addEventListener('keydown', (event) => {
      app.defaultOnKeydown(event);
    });

    // handle window resize
    window.addEventListener('resize', app.onResize);

    // store
    this.setState({dwvApp: app});

    // setup drop box
    this.setupDropbox(app);

    // possible load from location
    app.loadFromUri(window.location.href);
  }

  /**
   * Get the icon of a tool.
   *
   * @param {string} tool The tool name.
   * @returns {Icon} The associated icon.
   */
  getToolIcon = (tool) => {
    let res;
    if (tool === 'Scroll') {
      res = (<MenuIcon />);
    } else if (tool === 'ZoomAndPan') {
      res = (<SearchIcon />);
    } else if (tool === 'WindowLevel') {
      res = (<ContrastIcon />);
    } else if (tool === 'Ruler') {
      res = (<StraightenIcon />);
    } else if (tool === 'Rectangle') {
      res = (<RectangleOutlinedIcon/>);
    }

    return res;
  }

  /**
   * Handle a change tool event.
   * @param {string} tool The new tool name.
   */
  onChangeTool = (tool) => { // ruler
    if (this.state.dwvApp) {
      const real_tool = tool.split('_');
      // console.log(real_tool);

      this.setState({selectedTool: real_tool[0]});
      console.log(real_tool[0])
      this.state.dwvApp.setTool(real_tool[0]);

      if (real_tool.length > 1 && real_tool[0] === 'Draw') {
        console.log(real_tool[1]);
        this.onChangeShape(real_tool[1]);
      }

      // if (tool === 'Draw') {
      //   this.onChangeShape(this.state.tools.Draw.options[0]);
      // }
      // if (tool === "Bbox") {
      //   this.onChangeShape(this.state.tools.Draw.options[1]);
      // }
    }
  }

  /**
   * Check if a tool can be run.
   *
   * @param {string} tool The tool name.
   * @returns {boolean} True if the tool can be run.
   */
  canRunTool = (tool) => {
    let res;
    if (tool === 'Scroll') {
      res = this.state.dwvApp.canScroll();
    } else if (tool === 'WindowLevel') {
      res = this.state.dwvApp.canWindowLevel();
    } else {
      res = true;
    }
    return res;
  }

  /**
   * Toogle the viewer orientation.
   *
   */
  toggleOrientation = () => { // can be removed
    if (typeof this.state.orientation !== 'undefined') {
      if (this.state.orientation === 'axial') {
        this.state.orientation = 'coronal';
      } else if (this.state.orientation === 'coronal') {
        this.state.orientation = 'sagittal';
      } else if (this.state.orientation === 'sagittal') {
        this.state.orientation = 'axial';
      }
    } else {
      // default is most probably axial
      this.state.orientation = 'coronal';
    }
    // update data view config
    const config = {
      '*': [
        {
          divId: 'layerGroup0',
          orientation: this.state.orientation
        }
      ]
    };
    this.state.dwvApp.setDataViewConfigs(config);
    // render data
    const dataIds = this.state.dwvApp.getDataIds();
    for (const dataId of dataIds) {
      this.state.dwvApp.render(dataId);
    }
  }

  /**
   * Handle a change draw shape event.
   * @param {string} shape The new shape name.
   */
  onChangeShape = (shape) => { // ruler
    if (this.state.dwvApp) {
      this.state.dwvApp.setToolFeatures({shapeName: shape});
    }
  }

  /**
   * Handle a reset event.
   */
  onReset = () => {
    if (this.state.dwvApp) {
      this.state.dwvApp.resetDisplay();
    }
  }

  /**
   * Open the DICOM tags dialog.
   */
  handleTagsDialogOpen = () => {
    this.setState({ showDicomTags: true });
  }

  /**
   * Close the DICOM tags dialog.
   */
  handleTagsDialogClose = () => {
    this.setState({ showDicomTags: false });
  };

  // drag and drop [begin] -----------------------------------------------------

  /**
   * Setup the data load drop box: add event listeners and set initial size.
   */
  setupDropbox = (app) => {
    this.showDropbox(app, true);
  }

  /**
   * Default drag event handling.
   * @param {DragEvent} event The event to handle.
   */
  defaultHandleDragEvent = (event) => {
    // prevent default handling
    event.stopPropagation();
    event.preventDefault();
  }

  /**
   * Handle a drag over.
   * @param {DragEvent} event The event to handle.
   */
  onBoxDragOver = (event) => {
    this.defaultHandleDragEvent(event);
    // update box border
    const box = document.getElementById(this.state.dropboxDivId);
    if (box && box.className.indexOf(this.state.hoverClassName) === -1) {
        box.className += ' ' + this.state.hoverClassName;
    }
  }

  /**
   * Handle a drag leave.
   * @param {DragEvent} event The event to handle.
   */
  onBoxDragLeave = (event) => {
    this.defaultHandleDragEvent(event);
    // update box class
    const box = document.getElementById(this.state.dropboxDivId);
    if (box && box.className.indexOf(this.state.hoverClassName) !== -1) {
        box.className = box.className.replace(' ' + this.state.hoverClassName, '');
    }
  }

  /**
   * Handle a drop event.
   * @param {DragEvent} event The event to handle.
   */
  onDrop = (event) => {
    this.defaultHandleDragEvent(event);
    // load files
    this.state.dwvApp.loadFiles(event.dataTransfer.files);
  }

  /**
   * Handle a an input[type:file] change event.
   * @param event The event to handle.
   */
  onInputFile = (event) => {
    if (event.target && event.target.files) {
      this.state.dwvApp.loadFiles(event.target.files);
    }
  }

  /**
   * Show/hide the data load drop box.
   * @param show True to show the drop box.
   */
  showDropbox = (app, show) => {
    const box = document.getElementById(this.state.dropboxDivId);
    if (!box) {
      return;
    }
    const layerDiv = document.getElementById('layerGroup0');

    if (show) {
      // reset css class
      box.className = this.state.dropboxClassName + ' ' + this.state.borderClassName;
      // check content
      if (box.innerHTML === '') {
        const p = document.createElement('p');
        p.appendChild(document.createTextNode('Drag and drop data here or '));
        // input file
        const input = document.createElement('input');
        input.onchange = this.onInputFile;
        input.type = 'file';
        input.multiple = true;
        input.id = 'input-file';
        input.style.display = 'none';
        const label = document.createElement('label');
        label.htmlFor = 'input-file';
        const link = document.createElement('a');
        link.appendChild(document.createTextNode('click here'));
        link.id = 'input-file-link';
        label.appendChild(link);
        p.appendChild(input);
        p.appendChild(label);

        box.appendChild(p);
      }
      // show box
      box.setAttribute('style', 'display:initial');
      // stop layer listening
      if (layerDiv) {
        layerDiv.removeEventListener('dragover', this.defaultHandleDragEvent);
        layerDiv.removeEventListener('dragleave', this.defaultHandleDragEvent);
        layerDiv.removeEventListener('drop', this.onDrop);
      }
      // listen to box events
      box.addEventListener('dragover', this.onBoxDragOver);
      box.addEventListener('dragleave', this.onBoxDragLeave);
      box.addEventListener('drop', this.onDrop);
    } else {
      // remove border css class
      box.className = this.state.dropboxClassName;
      // remove content
      box.innerHTML = '';
      // hide box
      box.setAttribute('style', 'display:none');
      // stop box listening
      box.removeEventListener('dragover', this.onBoxDragOver);
      box.removeEventListener('dragleave', this.onBoxDragLeave);
      box.removeEventListener('drop', this.onDrop);
      // listen to layer events
      if (layerDiv) {
        layerDiv.addEventListener('dragover', this.defaultHandleDragEvent);
        layerDiv.addEventListener('dragleave', this.defaultHandleDragEvent);
        layerDiv.addEventListener('drop', this.onDrop);
      }
    }
  }

  // drag and drop [end] -------------------------------------------------------

} // DwvComponent

DwvComponent.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(DwvComponent);
