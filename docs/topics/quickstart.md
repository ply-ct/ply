---
layout: topic
---
## Ply Flows Quickstart
If you want to get straight to building Ply test flows in less than 10 minutes, this guide is for you.

If you already know your way around npm and vscode, you may want to skip to [Install Ply](install-ply) 
or [VS Code Ply](vscode-ply).

## Prerequisites
1. Install Node.js:
   <https://nodejs.org/en/download/>
1. Install Visual Studio Code:
   <https://code.visualstudio.com/download>
1. Install the Ply VS Code extension:
   - Run Visual Studio Code
   - In the Activity Bar on the left, click the Extensions icon: 
     <img src="../img/extensions.png" alt="Extensions Icon" class="icon-img">
   - Search for "Ply", and click its `Install` button.

## Create a workspace folder for your Ply flows
1. Launch VS Code if not already running.
1. From the menu: File > Add Folder to Workspace..., then select and/or create a folder.
1. Click the Explorer icon in VS Code's Activity Bar:
   <img src="../img/explorer.png" alt="Explorer Icon" class="icon-img">
1. Right-click on your workspace folder, select New Folder, and create a subfolder named "flows".

## Create a new flow
1. In the Explorer tree, right-click on the "flows" folder you just created and select New File.
1. Name the file "get-movies.ply.flow" (.ply.flow is the default flowFiles extension, which can be modified in [Config](config));
1. Your newly-created flow should appear containing two steps: Start and Stop:  
   <img src="../img/get-movies-1.png" alt="get-movies 1" width="540px" style="margin-top:3px;">
1. In the Activity Bar, click on the Test Explorer icon:
   <img src="../img/test-explorer.png" alt="Text Explorer Icon" class="icon-img">
1. Expand the Flows group, and you should see get-movies.ply.flow along with its steps in the tree.

## Run your flow
1. In Ply's flow diagram toolbar (or in the Test Explorer item hover menu), click the run icon:
   <img src="../img/run.svg" alt="Run Icon" class="icon-img">  
   When prompted, select "Submit without verifying" (Submit is Ply-speak for "don't check run results").
1. To show flow/step statuses, the diagram automatically switches to Inspect mode, indicated by the check icon in the toolbar:
   <img src="../img/check.png" alt="Inspect Mode Icon" class="icon-img" style="width:22px;">
1. So far our flow doesn't really do anything interesting. However, this does illustrate a couple of points:
   - In Inspect mode, each step that executed is drawn with heavy border around it:  
   <img src="../img/get-movies-1-inspect.png" alt="get-movies 1 Inspect" width="540px" style="margin-top:3px;">
   - VS Code's output window shows what happened:
     ```
     Running flow 'get-movies.ply.flow'
     Executing step: "s1"
     Executing step: "s2"
     Finished flow: "1770df52bde"     
     ```

## Add a Request step to your flow
The idea of Ply is to test an API by submitting HTTP requests and validating results. That's where Request steps come in.
1. Switch back to Select mode by clicking on its icon in the toolbar:
   <img src="../img/select.png" alt="Select Mode Icon" class="icon-img" style="width:22px;">
1. Remove the link joining Start to Stop by selecting it and hitting the Delete key.
1. From Ply's toolbox view to the right of our diagram, drag in the step that's labeled *Request*. Position it somewhere
   between Start and Stop.
1. Double-click on this "New Request" step to rename it "Get Dracula" (it should adopt a blue background, enabling you edit its name).
1. You'll notice that Ply Configurator also popped up when you double clicked. After renaming, select "Get Dracula" again so that 
   it shows up in Configurator. Then enter this for its URL: {% include copy_to_clipboard.html text="https://ply-ct.com/movies?title=Dracula" %}  
   <img src="../img/get-dracula.png" alt="Get Dracula" width="971px" style="margin-top:3px;">  
   This points to [ply-movies](https://github.com/ply-ct/ply-movies#readme), Ply's sample API containing hundreds of horror movies
   from the 1930s.

## Draw links between flow steps
1. To draw new links, switch to Connect mode:
   <img src="../img/connect.png" alt="Connect Mode Icon" class="icon-img" style="width:22px;">  
1. Then click/drag your mouse to draw a link between Start and "Get Dracula".
1. Do the same between "Get Dracula" and Stop.
1. Switch back to Select mode, and save your flow (File > Save File, or Ctrl/Cmd-S).

## Run with expected results
TODO

<br><br><br><br>
## Next steps
### Clone the ply-demo project
1. Launch VS Code and hit Ctrl-Shift-P (Cmd-Shift-P on Mac) to open the Command Palette, and type "Git: Clone".
1. Paste the ply-demo repository URL: {% include copy_to_clipboard.html text="https://github.com/ply-ct/ply-demo.git" %}
1. Select Clone from GitHub


Next Topic: [Flows](flows)