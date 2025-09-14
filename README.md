# Sean Thompson Updates to README

## Task: Add an interesting, valuable feature to a legacy codebase without churning dependencies or refactoring 

### Scope:
- Keep depedencies and libraries as-is (React 15, Socket.io 1.4.8)
- Minimal, additive code in the existing style
- Keep UI as-is, only small additions to support the new feature.

### New Feature: Rematch with Win/Loss/Draw record

- Rematch flow (vs human):
-- Existing player matching and play until game conclusion
-- Player A clicks "Rematch" button
-- Player B "Rematch" button is removed and "Accept Rematch" appears
-- Player B clicks "Accept Rematch" and the board resets
- Rematch (vs computer): one click starts a new round.
-- Existing player matching and play until game conclusion
-- Player clicks "Rematch" button and board resets for new game automatically
- Win/Loss/Draw streaks are recorded for the current session and reset when the session ends. Displayed above the buttons.  Screenshot below.

### Files touched:
- WS/XtttGame.js
- react_ws_src/src/views/ttt/GameMain.js
- react_ws_src/src/sass/ttt.scss
- .gitignore (avoid committing build artifacts)
- README.md (explain my changes)

### List of changes:
- Added context of my additions/changes to the project to the top of the README
- Updated the gitignore to avoid committing unnecessary files to the repo
- Added a div to wrap the End Game button and the other buttons I added. Padded the bottom a bit so the user can scroll down to see the buttons which can be hidden under the footer.
- Added real-time rematch functionality using Socket.io events in the same style as the existing socket events implementation - needed to tweak the onClientDisconnect function a bit
- Implemented Win/Loss streak tracking with persistent state across rematches
- Added opponent disconnection handling to disable rematch buttons
- Buttons are conditionally shown based on game state and opponent status
- Although jest is listed as a dependency, there is no real testing of the game functionality present in the repository - only some rudimentary testing of some utility functions.  In order to properly test additional features I would have to add significant setup given the age of the project and the libraries it uses.  Given the original repo doesn't have this I have assessed it best not to add unit testing.

# Original Readme
## A simple example of a full multiplayer game web app built with React.js and Node.js stack

Major libraries used on front end:
- react
- webpack
- babel
- react-router
- ampersand
- sass
- jest

Major libraries used on server:
- node.js
- socket.io
- express

### Folder structure:
- **WS** - server side and compiled front end
- **react_ws_src** - React development source and testing

---

### View it online at 
https://x-ttt.herokuapp.com/

#### Configurable with external XML file - 
https://x-ttt.herokuapp.com/ws_conf.xml

---

##For demonstration purposes only.
