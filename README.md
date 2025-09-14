# Sean Thompson Updates to README

## The task is to take the existing application and add an interesting feature 

### Assumptions:
- Avoid cleanup.  there's code hygeine issues such as commented out code, spacing issues.  Leave those as they are out of scope
- Do not update or replace existing libraries. Task is not to refactor the codebase so leave these as is. React version is 15 so hooks are out - class components it is.
- Avoid UX enhancement as this is also out of scope.  The "End Game" button is hidden behind the footer on smaller screen resolutions, as stated previously the task is not to refactor so avoid moving the button.

### Feature:
- Added a "Rematch" button.
-- If the player is 

### List of changes:
- Added context of my additions/changes to the project to the top of the README
- Updated the gitignore to avoid committing unnecessary files to the repo
- Added a div to wrap the End Game button and the other buttons I added. Padded the bottom a bit so the user can scroll down to see the buttons which can be hidden under the footer.

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
