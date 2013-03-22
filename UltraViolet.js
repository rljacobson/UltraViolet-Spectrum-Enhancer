// ==UserScript==
// @name          UltraViolet Spectrum Enhancer
// @namespace     RobertJacobson
// @description	  Adds features to the comments section of SpectrumMagazine.org.
// @include       http://spectrummagazine.org/*
// @include       https://spectrummagazine.org/*
// @include       http://www.spectrummagazine.org/*
// @include       https://www.spectrummagazine.org/*
// ==/UserScript==

/*
	UltraViolet Spectrum Enhancer.
	Robert Jacobson
	9/1/2012: Version 3.0
*/

/* GLOBAL VARIABLE DECLARATIONS */

var onlyOnce = 0;

//Constants
var DOM_WAIT = 200; //How many milliseconds to wait for browser to construct DOM.
var MONITOR_COMMENTS_WAIT = 5000; //Millis to wait between checking for new comments.
var CHECK_DISQUS_WAIT = 1000; //Millis to wait between checking for Disqus content.

//Disqus class names
var DSQ_POST_CLASS = "post";
var DSQ_AUTHOR_NAME_NODE_CLASS = "publisher-anchor-color";
var DSQ_THREAD_ID = "post-list";
var DSQ_COLLAPSED_CLASS = "collapsed";
var DSQ_CONTROL_BOX_LOCATION_NODE_ID = "main-nav";

//Global Variables and Their Defaults
//var hiddenList = ["Bicycle Truth"];
var hiddenList = ["Bicycle Truth"];
var alwaysHide = true; //Overwritten if already set. Otherwise, default.

//Global Variables
var checkForDisqusInterval;
var monitorCommentsInterval;



/* FUNCTION DEFINITIONS */

function retrieveLocalStorageData(){
	//We store the usernames we want to hide in an HTML5 localStorage variable.
	//We are storing/retrieving a javascript array of strings, but localStorage
	//only stores a single string variable. The "right" way to handle this problem
	//is with JSON.
	if (!localStorage.hiddenList){ //Check for existence.
		//Let's give folks a default list of characters to hide.
		localStorage.hiddenList = JSON.stringify(hiddenList);
	}
	//This is a global variable.
	hiddenList = JSON.parse(localStorage.hiddenList);

	//We keep track of whether or not to show the hiddenList by default.
	if(!localStorage.alwaysHide){ //Check for existence.
		//The default is to always hide the comments from authors on the hiddenList.
		if(alwaysHide) localStorage.alwaysHide = "YES";
		else localStorage.alwaysHide = "NO";
	} else{
		if (localStorage.alwaysHide == "NO"){
			alwaysHide = false;
		} else if (localStorage.alwaysHide == "YES") { //A superfluous case, but check it.
			alwaysHide = true;
		} else { //Someone's been sleeping in my bed and she's still there!
			localStorage.alwaysHide = "YES";
		}
	}

}


/*
 The point of safeAddEventListener() is a little technical. We write custom
 HTML to the page which has to communicate to our script. Problem is, javascript
 that we write to the page cannot call functions in this script--at least not
 directly. Thus we add event listeners after the fact that CAN call functions in this
 script directly. BUT we have to wait until the browser has attached to the DOM
 all the HTML that we've written out before we can attach an event listener.
 */
//This function waits until elementId is added to the document's
//DOM to add the event listener.
function safeAddEventListener(elementId, event, funct){
	if(document.getElementById(elementId)){
		//The dynamically created elements have been attached to the document's
		//DOM. Add the event listener.
		document.getElementById(elementId).addEventListener(event, function()
			{
				funct();
			}, false);
	} else{
		//The element isn't attached yet. Try again after DOM_WAIT milliseconds.
		setTimeout(function(){safeAddEventListener(elementId, event, funct);}, DOM_WAIT);
	}
}

//Firefox uses textContent, Safari/Chrome uses innerText. This unifies the codebase.
function getInnerText(elem){
	if(elem.innerText){
		return elem.innerText;
	}
	return elem.textContent;
}

//Returns true if element is a member of array, false otherwise.
function memberOf(element, array){
	var i = 0;
	for (i=0; i < array.length; i++){
		if (element == array[i]) return true;
	}
	return false;
}

//Toggles the display style of the element to either hidden or visible.
function toggleVisibility(elementId){
    if(document.getElementById(elementId).style.display == 'none'){
      document.getElementById(elementId).style.display = 'block';
    }else{
      document.getElementById(elementId).style.display = 'none';
    }
}

//Helper functions for controls.
//Save changes to the hiddenList.
function saveChanges(){
	//Save the Hidden List.
	//Construct an array and save it to localStorage.
	hiddenList = document.getElementById("UVtxtHiddenList").value.split("\n");
	if(hiddenList[hiddenList.length - 1] == "") hiddenList.pop();
	localStorage.hiddenList = JSON.stringify(hiddenList);
}

//User clicked the always hide checkbox.
function toggleAlwaysHide(){
	alwaysHide = !alwaysHide;
	if(alwaysHide) localStorage.alwaysHide = "YES";
	else localStorage.alwaysHide = "NO";
}

//Collapse a particular comment.
function toggleComment(comment, expanding){
    //The following is a regExp that matches the text, DSQ_COLLAPSED_CLASS.
    var patternCollapsed = /collapsed/;
    
    //patternCollapsed.test() returns true if pattern is found, false otherwise.
    var patternMatched = patternCollapsed.test(comment.className);
    
    //We only collapse comments that are uncollapsed and expand comments collapsed.
    if(!patternMatched && !expanding){
        //If the comment is not already collapsed, collapse this comment.
        comment.className += " " + DSQ_COLLAPSED_CLASS;
    } else if(patternMatched && expanding){
        //var str = comment.className;
        comment.className = comment.className.replace(patternCollapsed, '');
    }
}

//Expand or hide all comments on Hidden List.
function showHiddenListed(expanding){
    var j;
    var comments = document.getElementsByClassName(DSQ_POST_CLASS);
    var authorName;
    
	for(j=0; j < comments.length; j++){
        //Get the comment's author name.
        authorName = getInnerText(comments[j].getElementsByClassName(DSQ_AUTHOR_NAME_NODE_CLASS)[0]);
        //If the author is on the hidden list, hide/show the comment.
        if(memberOf(authorName, hiddenList)){
            toggleComment(comments[j], expanding);
		}
	}
}

//Expand or hide all comments.
function showAllComments(expanding){
	var j = 0;
    var comments = document.getElementsByClassName(DSQ_POST_CLASS);

	for(j=0; j < comments.length; j++){
		toggleComment(comments[j], expanding);
	}
}

//Add a username to the Hidden List.
function addUsernameToHiddenList(newUsername){
    var authorName;
	var j = 0;
    var comments = document.getElementsByClassName(DSQ_POST_CLASS);
    
	//Collapse all comments by that username.
	for(j=0; j < comments.length; j++){
        //Get the authorname for this comment.
        authorName = getInnerText(comments[j].getElementsByClassName(DSQ_AUTHOR_NAME_NODE_CLASS)[0]);
        
		if(authorName == newUsername){
			toggleComment(comments[j], false); //False means collapse.
		}
	}	
	
    
    //Is the new user already on the hidden list? If so, we're done.
	if(memberOf(newUsername, hiddenList)) return;
    
    //Add the new Username to the hidden list.
	hiddenList.push(newUsername);
	//Save changes to the hiddenList in the localStorage.
	localStorage.hiddenList = JSON.stringify(hiddenList);
	
	//Update UVtxtHiddenList to reflect our changes.
    var listString = document.getElementById("UVtxtHiddenList").value;
	//We have to check for newline. grr...
	if(listString.length==0 | listString.charAt(listString.length - 1)=="\n"){
		document.getElementById("UVtxtHiddenList").value += newUsername;
	} else{
		document.getElementById("UVtxtHiddenList").value += ("\n" + newUsername);
	}
}
 
//Rewrite the HTML for the comments. 
function monitorComments(){
	var authorNode;
	var authorName;
	var xNode
	var i;
	var comments = document.getElementsByClassName(DSQ_POST_CLASS);

    /*
    if(onlyOnce < 5){
        window.alert("comments found: " + comments.length);
        onlyOnce++;
    }
    */
    
	for(i = 0; i < comments.length; i++){
		//Add an X menu to each comment right before the author node.

        // commentId given by comments[i].dataset.dsqCommentId
        
		//Get the comment's author node.
		authorNode = comments[i].getElementsByClassName(DSQ_AUTHOR_NAME_NODE_CLASS)[0];
		authorName = getInnerText(authorNode);
        
        //If we have previously attached an "X" menu and hidden (or not) the comment,
        //then there is nothing to do, so continue to the next comment.
        if(0 != comments[i].getElementsByClassName("UVXButton").length) continue;
        
		//<a href='javascript:;' class='UVXButton' style='text-decoration:none;'>X</a>
		xNode = document.createElement('a');
		xNode.appendChild(document.createTextNode("X "));
		xNode.setAttribute("class", "UVXButton");
		xNode.setAttribute("href", "javascript:;");
		xNode.setAttribute("style", "text-decoration:none;");
        //xNode.setAttribute("onclick", "onclick='document.getElementById(\"UVCommunicate\").innerHTML=\"" + authorName + "\";'>");
        xNode.setAttribute("onclick", "document.getElementById(\"UVCommunicate\").innerHTML=\"" + authorName + "\";");
		//alert(\"clicked\");

        authorNode.parentNode.insertBefore(xNode, authorNode);
        
        //Click the "X" menu to add a user to the hidden list.
		//safeAddEventListener(xNode, "click", function()
        xNode.addEventListener("click", function()
                             {
                                 //We have set the onclick event to store info in a hidden
                                 //div called UVCommunicate.
                                 var strTemp = getInnerText(document.getElementById("UVCommunicate"));
                                 //Ask the user if they really want to hide the user.
                                 if(confirm("Do you really want to add " + strTemp + " to the Hidden List?")){
                                    addUsernameToHiddenList(strTemp);
                                 }
                             }, false);

		//Hide comments from authors on the Hidden List
        if(memberOf(authorName, hiddenList) && alwaysHide) toggleComment(comments[i]);
    }
}

//Construct our control box.
function writeControlBoxHTML(){
	//First, we set up the inner controls that will be invisible most of the time.
	var j = 0;
	var strControls;
	var strNewHTML;
	
	//BEGIN Inner Control Box HTML
	strControls = "<div id='UVControlInner'";
	strControls += " style='";
	strControls += "display:none;";
	strControls += "background-color:#C0C0C0;";
	strControls += "padding:16px;";
	strControls += "border:2px solid #000000' >";
	strControls += "<u><strong>UltraViolet Spectrum Settings</strong></u><br><br>";
	
	//Always hide hiddenList.
	strControls += "<input type='checkbox' id='UVAlwaysHide' value='YES'"
	if(alwaysHide) strControls += " checked ";
	strControls += "/> Always hide comments by people on my Hidden List.<br><br>";
	
	//Hidden List
	strControls += "Hidden List:";
	
	//Save Changes.
	strControls += "<div style='float:right'><a href='javascript:;' id='UVSaveChanges' style='text-decoration:none;'>Save Changes</a></div><br>";

	strControls += "<textarea id='UVtxtHiddenList' rows='7' cols='10' style='width:250px;border:1px solid #000000'>"; //Remember to override Spectrum's css.
	for(j = 0; j < hiddenList.length; j++){
		strControls += hiddenList[j] + "\n"
	}
	strControls += "</textarea><br>";
	strControls += "(One username per line. Things like spaces and caps matter!)<br><br>";
	
	//Expand/contract various.
	strControls += "Comments on Hidden List:<div style='float:right'><a id='UVShowHiddenListed' href='javascript:;' style='text-decoration:none;'>Show</a>&nbsp;-&nbsp;";
	strControls += "<a id='UVHideHiddenListed' href='javascript:;' style='text-decoration:none;'>Hide</a></div><br>";
	strControls += "All comments:<div style='float:right'><a id='UVShowAll' href='javascript:;' style='text-decoration:none;'>Show</a>&nbsp;-&nbsp;";
	strControls += "<a id='UVHideAll' href='javascript:;' style='text-decoration:none;'>Hide</a></div><br>";

	//END Inner Control Box HTML
	strControls += "</div>";

	//Control Box Toggler
	strNewHTML = "";
	strNewHTML += "<div style='";
	//strNewHTML += "position:fixed;"; //This is the magic property value that makes it float.
	//strNewHTML += "width:30px;height:10px;left:10px;top:0px;z-index:100;";
    strNewHTML += "width:30px;height:10px;z-index:1000;";
	strNewHTML += "'>";
	strNewHTML += "<a id='UVControlMenu' href='javascript:;' style='text-align:center;text-decoration:none;color:#FFFFFF;background-color:#C0C0C0;border: 1px solid black'>&nbsp;UV&nbsp;</a> "
	strNewHTML += "</div>";
	//Control Box
	strNewHTML += "<div id='UVControl' style='";
	//strNewHTML += "position:fixed;"; //This is the magic property value that makes it float.
	//strNewHTML += "width:300px;height:50px;left:10px;top:20px;z-index:100;";
    strNewHTML += "position:relative;"; //This is the magic property value that makes it float.
	strNewHTML += "width:300px;height:10px;left:0px;top:20px;z-index:1000;";

	strNewHTML += "'>";
	strNewHTML += strControls; //Hidden until clicked.
	strNewHTML += "</div>";

	//We also need a way to communicate betweeen the scripts on the page and this script. 
	//We do this with an invisible div.
	strNewHTML +=  "<div id='UVCommunicate' style='display:none'></div>";
	//strNewHTML +=  "CHICKEN: <div id='UVCommunicate'></div>";

	//Write out the HTML for our control box.
    var cbNode;
    var locationNode = document.getElementById(DSQ_CONTROL_BOX_LOCATION_NODE_ID);
    cbNode = document.createElement('div');
    cbNode.innerHTML = strNewHTML;
    locationNode.parentNode.insertBefore(cbNode, locationNode); //appendChild(cbNode);
    
    
    //Hook up the event listeners for the Settings Menu.
	safeAddEventListener("UVAlwaysHide", "click", toggleAlwaysHide);
	safeAddEventListener("UVSaveChanges", "click", saveChanges);
	
	safeAddEventListener("UVShowHiddenListed", "click", function()
                         {
                         showHiddenListed(true);
                         });
	safeAddEventListener("UVHideHiddenListed", "click", function()
                         {
                         showHiddenListed(false);
                         });
	safeAddEventListener("UVShowAll", "click", function()
                         {
                         showAllComments(true);
                         });
	safeAddEventListener("UVHideAll", "click", function()
                         {
                         showAllComments(false);
                         });
	safeAddEventListener("UVControlMenu", "click", function()
                         {
                         saveChanges();
                         toggleVisibility("UVControlInner");
                         });
    
}

//Monitors the DOM looking for an element with id=DSQ_THREAD_ID.
function checkForDisqus(){
    var commentContainer = document.getElementById(DSQ_THREAD_ID);

    //If there is Disqus content, commentContainer will not be null.
    if(null != commentContainer){

        //Stop checking.
        clearInterval(checkForDisqusInterval);
        
        retrieveLocalStorageData();
        
        writeControlBoxHTML();
        
        monitorCommentsInterval = setInterval(monitorComments, MONITOR_COMMENTS_WAIT);
    }
}



/* CODE */

/*
    Because Disqus content is loaded dynamically, we need to monitor the DOM to 
    determine when changes are made. The first change we monitor for is whether or not
    there is any Disqus content on the page. If there is Disqus content, we need to 
    enable the Control Box and begin monitoring the comments that Disqus loads. It is
    the job of checkForDisqus() to do what needs to be done if there is Disqus content.
*/
checkForDisqusInterval = setInterval(checkForDisqus, CHECK_DISQUS_WAIT);
