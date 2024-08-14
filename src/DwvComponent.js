import React from 'react';
import PropTypes from 'prop-types';
import {withStyles} from '@mui/styles';
import Typography from '@mui/material/Typography';

import Stack from '@mui/material/Stack';
import LinearProgress from '@mui/material/LinearProgress';

import Link from '@mui/material/Link';
import IconButton from '@mui/material/IconButton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select from '@mui/material/Select';
import MenuItem from "@mui/material/MenuItem"
import ButtonGroup from "@mui/material/ButtonGroup";
import Button from "@mui/material/Button";


// https://mui.com/material-ui/material-icons/
import CloseIcon from '@mui/icons-material/Close';
import RefreshIcon from '@mui/icons-material/Refresh';
import MenuIcon from '@mui/icons-material/Menu';
import ContrastIcon from '@mui/icons-material/Contrast';
import SearchIcon from '@mui/icons-material/Search';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import StraightenIcon from '@mui/icons-material/Straighten';
import CameraswitchIcon from '@mui/icons-material/Cameraswitch';
import BugReportOutlinedIcon from '@mui/icons-material/BugReportOutlined';

import RectangleOutlinedIcon from '@mui/icons-material/RectangleOutlined';
import PanoramaFishEyeIcon from '@mui/icons-material/PanoramaFishEye';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AdsClickIcon from '@mui/icons-material/AdsClick';
import ModeEditOutlineIcon from '@mui/icons-material/ModeEditOutline';
import ArrowDownwardOutlinedIcon from '@mui/icons-material/ArrowDownwardOutlined';

import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Slide from '@mui/material/Slide';
import Toolbar from '@mui/material/Toolbar';

import TagsTable from './TagsTable';

import './DwvComponent.css';
import {App, decoderScripts, getDwvVersion} from 'dwv';

// Konva for making rect when importing labels
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
          options: ['Ruler', 'Rectangle', 'Ellipse', 'Protractor', 'Roi', 'FreeHand']
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
      hoverClassName: 'hover',
      class2Id: {
        'Palm': [],
        'Finger 1': [],
        'Finger 2': [],
        'Finger 3': [],
        'Finger 4': [],
        'Finger 5': [],

        'Left Hand': [],
        'Right Hand': [],
        'Left Foot': [],
        'Right Foot': [],
        'Injured Left Foot': [],
        'Injured Right Foot': []
      },
      selectedClass: "",
      drawings: []
    };
  }waw

  render() {
    const { classes } = this.props;
    const { versions, tools, loadProgress, dataLoaded, metaData } = this.state;

    const handleToolChange = (event, newTool) => {
      if (newTool) {
        this.onChangeTool(newTool);
      }
      // console.log(JSON.parse(this.state.dwvApp.getJsonState()));
    };

    const handleImport = (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();

        reader.onload = (e) => {
          const content = e.target.result;
          console.log(content);
          this.importAnnot(content);
        };

        reader.onerror = (e) => {
          console.error('Error reading file:', e);
        };

        reader.readAsText(file);
      }
    };

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
            {this.getToolIcon(option)}
          </ToggleButton>
      );
    });

    const toolsButtons = Object.keys(tools).map( (tool) => { // bug : Draw_Ruler is not good, you should not change the name of the options of the draw key, you should handle it another way.
      if (tool !== 'Draw')
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

    const labelMenuItems = Object.keys(this.state.class2Id).map(label => {
      return(
        <MenuItem value={label} key={label} >{label}</MenuItem>
      );
    });

    const handleClassChange = (event) => {
      this.setState({selectedClass: event.target.value});
    };

    return (
      <div id="dwv">

        <LinearProgress variant="determinate" value={loadProgress} />
        <Stack direction="row" spacing={1} padding={1}
               justifyContent="center" flexWrap="wrap">
          <input
              type="file"
              id='importAnnot'
              accept='.txt'
              style={{display: "none"}}
              onChange={handleImport}
          />

          <ButtonGroup size='small'
                       variant='outlined'
                       aria-label="Import Export button group"
                       disabled={!dataLoaded}
          >
            <Button
                onClick={() => {document.getElementById("importAnnot").click();}}

            >
              <ArrowDownwardOutlinedIcon/>
            </Button>

          </ButtonGroup>

          <FormControl required disabled={!dataLoaded || this.state.selectedTool !== "Draw"}>
            <InputLabel>Class</InputLabel>
            <Select
                id='Class-Picker'
                value={this.state.selectedClass}
                label="Class"
                onChange={handleClassChange}
                autoWidth
            >
              {labelMenuItems}
            </Select>


          </FormControl>

          <ToggleButtonGroup size="small"
                             color="primary"
                             value={this.state.selectedTool}
                             exclusive
                             onChange={handleToolChange}
          >
            {toolsButtons}
          </ToggleButtonGroup>

          <ToggleButton size="small"
                        value="Test"
                        title="Test"
                        disabled={!dataLoaded}
                        onChange={this.importAnnot}
          ><BugReportOutlinedIcon/></ToggleButton>

          <ToggleButton size="small"
                        value="reset"
                        title="Reset"
                        disabled={!dataLoaded}
                        onChange={this.onReset}
          ><RefreshIcon/></ToggleButton>

          <ToggleButton size="small"
                        value="toggleOrientation"
                        title="Toggle Orientation"
                        disabled={!dataLoaded}
                        onClick={this.toggleOrientation}
          ><CameraswitchIcon/></ToggleButton>

          <ToggleButton size="small"
                        value="tags"
                        title="Tags"
                        disabled={!dataLoaded}
                        onClick={this.handleTagsDialogOpen}
          ><LibraryBooksIcon/></ToggleButton>

          {/*Tags table is a Dialog (which is a component in mui)*/}
          <Dialog
              open={this.state.showDicomTags}
              onClose={this.handleTagsDialogClose}
              TransitionComponent={TransitionUp}
          >
            <AppBar className={classes.appBar} position="sticky"> // this is the header of the dialog
              <Toolbar>
                <IconButton color="inherit" onClick={this.handleTagsDialogClose} aria-label="Close">
                  <CloseIcon/>
                </IconButton>
                <Typography variant="h6" color="inherit" className={classes.flex}>
                  DICOM Tags
                </Typography>
              </Toolbar>
            </AppBar>
            <TagsTable data={metaData}/>
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

    // handle key events
    app.addEventListener('keydown', (event) => {
      app.defaultOnKeydown(event);
    });

    // handle mouseup event for shape
    window.addEventListener('mouseup', this.updateDrawings);

    // handle delete event for shape
    app.addEventListener('keydown',this.updateDrawings);

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
    } else if (tool === 'Ellipse') {
      res = (<PanoramaFishEyeIcon/>);
    } else if (tool === 'Protractor') {
      res = (<ChevronRightIcon/>);
    } else if (tool === 'Roi') {
      res = (<AdsClickIcon/>);
    } else if (tool === 'FreeHand') {
      res = (<ModeEditOutlineIcon/>);
    }

    return res;
  }

  /**
   * Handle a change tool event.
   * @param {string} tool The new tool name.
   */
  onChangeTool = (tool) => {
    if (this.state.dwvApp) {
      // console.log(JSON.parse(this.state.dwvApp.getJsonState()));
      // console.log(this.state.drawings);

      if (this.state.tools.Draw.options.indexOf(tool) === -1) {
        this.setState({selectedTool: tool});
        this.state.dwvApp.setTool(tool);
      }
      else {
        this.setState({selectedTool: 'Draw'});
        this.state.dwvApp.setTool("Draw");
        this.onChangeShape(tool);
      }
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

  // ____Labelling____
  componentDidUpdate(prevProps, prevState, snapshot) {
    if (this.drawingsExist()) {
      // console.log(JSON.parse(this.state.dwvApp.getJsonState()));
      // console.log(this.getJSONState());
      console.log(this.state.class2Id);
      console.log(this.state.drawings);
      console.log(this.getJSONState());
      console.log('the new lgo:::::')
      console.log(this.state.dwvApp.getLayerGroupByDivId("layerGroup0").getActiveDrawLayer().getKonvaLayer().getAbsoluteScale());
      console.log('...............................')
      }


      if (prevState.drawings.length < this.state.drawings.length) {
        console.log('inside added shape in component did update');

        let selectedClass = this.state.selectedClass;
        let newShape = this.state.drawings[this.state.drawings.length - 1];
        let newShapeId = newShape.attrs.id;
        let class2Id_prev = this.state.class2Id;
        class2Id_prev[selectedClass].push(newShapeId);

        console.log(newShapeId);
        // updates text of the label attached to the shape
        // this.updateShapeLabelText(newShapeId);


        this.setState({class2Id: class2Id_prev});


      }
      else if (prevState.drawings.length > this.state.drawings.length) {
        let differId = this.getDifferId(this.state.drawings, prevState.drawings);
        console.log(differId);
        Object.keys(this.state.class2Id).forEach((label) => {
          let idx = this.state.class2Id[label].indexOf(differId);
          if (idx !== -1){
            let newClass2Id = this.state.class2Id;
            newClass2Id[label].splice(idx, 1);
            this.setState({class2Id: newClass2Id});
          }
        })
      }
      // console.log(this.state.class2Id);
      // console.log(this.state.drawings);
    }

  getJSONState = () => {
    if (this.state.dwvApp !== null) {
      return JSON.parse(this.state.dwvApp.getJsonState());
    }
    return null;
  };

  updateJSONState = (JsonState) => { // todo this need validation on the input JsonState
    this.state.dwvApp.applyJsonState(JSON.stringify(JsonState));
  };

  /**
   * This method outputs a list of shape objects
   */
  getDrawings = () => {
    if (this.drawingsExist()) {
      return this.getJSONState().drawings.children[0].children;
    }
    return null;
  };

  getDifferId = (currentDrawings, prevDrawings) => {
    let prevIds = new Set(this.getIds(prevDrawings));
    let currIds = new Set(this.getIds(currentDrawings));

    let deletedId = prevIds.difference(currIds);

    return Array.from(deletedId)[0]
  };

  /**
   * This method adds a drawing object children to the current state of the dwvApp
   * @param drawing
   * @param drawingDetail
   */
  setDrawings = (drawing, drawingDetail) => {
    return this.state.dwvApp.setDrawings(drawing, drawingDetail);
  };

  /**
   * pallete of label colors
   * @type {idx: string}
   */
  palette = {
    0: '#ffff80',
    1: "#234378",
    2: "#78235d",
    3: "#78232a",
    4: "#307823",
    5: "#237578",
    6: "#FF7810"
  };

  /**
   * This method makes a rectangle-group object and returns it (By shape object I mean the objects that are in this.state.drawings).
   * @param label{number}
   * @param xTopLeft{number}
   * @param yTopLeft{number}
   * @param width{number}
   * @param height{number}
   * @returns {any}
   * @constructor
   */
  rectShapeObjGen = (xTopLeft, yTopLeft, width, height, label) => {

    let scale = this.state.dwvApp.getLayerGroupByDivId("layerGroup0").getActiveDrawLayer().getKonvaLayer().getAbsoluteScale();
    let scaleX = 2 / scale.x;
    let scaleY = 2 / scale.y;

    return {
      "attrs": {
        "name": "rectangle-group",
        "id": crypto.randomUUID().slice(0,8),
        "draggable": true
      },
      "className": "Group",
      "children": [
        {
          "attrs": {
            "x": xTopLeft,
            "y": yTopLeft + height,
            "scaleX": scaleX,
            "scaleY": scaleY,
            "name": "label",
            'visible': false
          },
          "className": "Label",
          "children": [
            {
              "attrs": {
                "fontSize": 10,
                "fontFamily": "Verdana",
                "fill": this.palette[label],
                "padding": 3,
                "shadowColor": "#000",
                "shadowOffsetX": 0.25,
                "shadowOffsetY": 0.25,
                "name": "text",
                "text": label
              },
              "className": "Text"
            },
            {
              "attrs": {
                "fill": this.palette[label],
                "opacity": 0.2,
                "width": 58.939453125,
                "height": 16
              },
              "className": "Tag"
            }
          ]
        },
        {
          "attrs": {
            "x": xTopLeft,
            "y": yTopLeft,
            "width": width,
            "height": height,
            "stroke": this.palette[label],
            "strokeScaleEnabled": false,
            "name": "shape"
          },
          "className": "Rect"
        }
      ]
    };
  };


  /**
   * This method adds shape Objects(a list of shape Objects) to be as children of position group layer
   * @param shapeObjs{[]}
   * @returns {({children: [{children: *[], className: string, attrs: {name: string, id: string}}], className: string, attrs: {}}|{})[]}
   */
  drawingObjGen = (shapeObjs) => {
    let drawingObj = {
      "attrs": {},
      "className": "Layer",
      "children": [
        {
          "attrs": {
            "name": "position-group",
            "id": "#2-0"
          },
          "className": "Group",
          "children": []
        }
      ]
    };

    shapeObjs.forEach(shape => drawingObj.children[0].children.push(shape));

    let drawingDetailsObj = {};

    shapeObjs.forEach((shape) => {
      drawingDetailsObj[shape.attrs.id] = {
        "meta": {
          "quantification": {},
          "textExpr": shape.children[0].children[0].attrs.text
        }
      };
    })

    return [drawingObj, drawingDetailsObj];
  };

  // ____________ Import and Export Section ____________
  /**
   * This method Parse the imported text file into a 2D array (a table)
   * @param annot{string}
   * @returns {number[][]}
   */
  parseAnnot = (annot) => {
    let rows = annot.split('\n');
    rows.pop();

    for (let i = 0; i < rows.length; i++ ) {
      rows[i] = rows[i].replace('\r', '');
      rows[i] = rows[i].split(" ")

      if (rows[i].length !== 5) {
        alert(`Annotation Import Error: the row number ${i} should be exactly of length 5`)
      }

      for (let j = 0; j < rows[i].length; j++) {
        rows[i][j] = Number(rows[i][j]);
      }

    }
    console.log(rows);
    return rows;
  };

  /**
   * This method converts normalized x_center, y_center, width, height to unnormalized.
   * @param label{number[]}
   * @returns {[number,number,number,number,number]}
   */
  nxywh2xywh = (label) => {
    let imgWidth = this.getJSONState().position[0] * 2;
    let imgHeight = this.getJSONState().position[1] * 2;

    let c = label[0];
    let x = label[1] * imgWidth;
    let y = label[2] * imgHeight;
    let w = label[3] * imgWidth;
    let h = label[4] * imgHeight;

    return [c, x, y ,w, h];
  };

  /**
   * This method converts label of format x_center y_center width height to the format x_top_left y_top_left width height
   * @param label{number[]}
   * @returns {[number,number,number,number,number]}
   */
  xywh2x_ty_twh = (label) => {

    let c = label[0];
    let w = label[3];
    let h = label[4];
    let x = label[1] - parseInt(w / 2);
    let y = label[2] - parseInt(h / 2);
    console.log([c, x, y ,w, h]);

    return [c, x, y ,w, h];
  };

  importAnnot = (annot) => {
    let annotTable = this.parseAnnot(annot);
    let shapes = [];
    for (let i = 0; i < annotTable.length; i++) {
      let refinedLabel = this.nxywh2xywh(annotTable[i]);
      refinedLabel = this.xywh2x_ty_twh(refinedLabel);
      let rectObj = this.rectShapeObjGen(refinedLabel[1], refinedLabel[2], refinedLabel[3], refinedLabel[4], refinedLabel[0]);
      shapes.push(rectObj);
    }
    let [drawings, drawingDetails] = this.drawingObjGen(shapes);
    this.state.dwvApp.setDrawings(drawings, drawingDetails);
  };


  updateShapeLabelText = () => {

    // let drawings = {
    //   "attrs": {},
    //   "className": "Layer",
    //   "children": [
    //     {
    //       "attrs": {
    //         "name": "position-group",
    //         "id": "#2-0"
    //       },
    //       "className": "Group",
    //       "children": [
    //         {
    //           "attrs": {
    //             "name": "rectangle-group",
    //             "id": "z5z5aqzjpyq",
    //             "draggable": true
    //           },
    //           "className": "Group",
    //           "children": [
    //             {
    //               "attrs": {
    //                 "x": 88.22151898734178,
    //                 "y": 40.085443037974684,
    //                 "scaleX": 0.6708860759493671,// calculate this
    //                 "scaleY": 0.6708860759493671,
    //                 "name": "label",
    //                 "visible": false
    //               },
    //               "className": "Label",
    //               "children": [
    //                 {
    //                   "attrs": {
    //                     "fontSize": 10,
    //                     "fontFamily": "Verdana",
    //                     "fill": "#ffff80",
    //                     "padding": 3,
    //                     "shadowColor": "#000",
    //                     "shadowOffsetX": 0.25,
    //                     "shadowOffsetY": 0.25,
    //                     "name": "text",
    //                     "text": "Finger 1"
    //                   },
    //                   "className": "Text"
    //                 },
    //                 {
    //                   "attrs": {
    //                     "fill": "#ffff80",
    //                     "opacity": 0.2,
    //                     "width": 47.1474609375,
    //                     "height": 16
    //                   },
    //                   "className": "Tag"
    //                 }
    //               ]
    //             },
    //             {
    //               "attrs": {
    //                 "x": 88.22151898734178,
    //                 "y": 9.895569620253164,
    //                 "width": 31.196202531645568,
    //                 "height": 30.18987341772152,
    //                 "stroke": "#ffff80",
    //                 "strokeScaleEnabled": false,
    //                 "name": "shape"
    //               },
    //               "className": "Rect"
    //             }
    //           ]
    //         }
    //       ]
    //     }
    //   ]
    // };

    // Hereeeeeee , adding fetch and debuginggg
    let rectObj = this.rectShapeObjGen(50, 50, 25, 15);
    let drawings = this.drawingObjGen(rectObj);



    let drawingDetails = {};
    drawingDetails[String(rectObj.attrs.id)] =
        {
          "meta": {
            "textExpr": "HAHAHAHA",
            "quantification": {}
          }
        }


    this.state.dwvApp.setDrawings(drawings, drawingDetails);
  };

  /**
   * This method updates the drawing state.
   * @param event
   */
  updateDrawings = (event) => {
    // updating the state, when you delete a shape using delete button
    if (this.state.dwvApp && this.state.selectedTool === "Draw" && event.key === 'Delete') {
      this.setState({drawings: this.getDrawings()});
    }
    // updating the state when you add a shape or delete a shape or change a shape
    else if (this.state.dwvApp && this.state.selectedTool === "Draw") {
      this.setState({drawings: this.getDrawings()});
    }
  };

  /**
   * This method gives you the shape object (if exists) based on the input shapeId
   * @returns {-1} if it is not found | null if operation is not valid | {shape} belonging to the shape-group
   * @param shapeId
   */

  getShapeObject = (shapeId) => {
    if (this.drawingsExist()){
      let shapes = this.state.drawings;
      for (let i = 0; i < shapes.length; i++) {
        let shape = shapes[i];
        if (shape.attrs.id === shapeId) {
          return shape;
        }
      }
      return -1;
    }
  };

  /**
   * This method returns Ids of a drawing object
   * @param drawings
   * @returns {any[]}
   */
  getIds = (drawings) => {
    let Ids = new Set();
    for (let i = 0; i < drawings.length; i++){
      let drawing = drawings[i];
      Ids.add(drawing.attrs.id);
    }

    return Array.from(Ids);
  };


  /**
   * This method checks if the there is an active layer group for the app.
   * @returns {boolean}
   */
  drawingsExist = () => {
    return this.state.dwvApp !== null && this.state.dwvApp.getActiveLayerGroup() !== undefined && this.getJSONState().drawings.children.length > 0;
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
