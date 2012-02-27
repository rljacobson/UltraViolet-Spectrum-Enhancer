/*
	UltraViolet Spectrum Enhancer.
	Robert Jacobson
	2/26/2012: Version 2.0
*/

/* GLOBAL VARIABLE DECLARATIONS */

//Some magic numbers and defaults.
var DOM_WAIT = 200; //How many milliseconds to wait for browser to construct DOM.
var REPLYBOXHEIGHT = 500; //Height of Reply Box in px.
var hiddenListDefaults = ["Bicycle Truth"];
var alwaysHide = true; //Overwritten if already set. Otherwise, default.
var jumpToNew = false; //Overwritten if already set. Otherwise, default.
var onlyShowNew = false; //Overwritten if already set. Otherwise, default.
var trackingReplyBox = true; //Overwritten if already set. Otherwise, default.
var hiddenList;
//If the commentContainer doesn't exist, there are no comments 
//and we should stop executing the script.
var commentContainer = document.getElementById("comments");
//This guy will hold information about the comments. It will be an array of 
//objects of type comment, defined below.
var comments = new Array();

/* FUNCTION DEFINITIONS */

function retrieveLocalStorageData(){
	//We store the usernames we want to hide in an HTML5 localStorage variable.
	//We are storing/retrieving a javascript array of strings, but localStorage
	//only stores a single string variable. The "right" way to handle this problem
	//is with JSON.
	if (!localStorage.hiddenList){ //Check for existence.
		//Let's give folks a default list of characters to hide.
		localStorage.hiddenList = JSON.stringify(hiddenListDefaults);
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

	//We keep track of whether or not to only show new comments by default.
	if(!localStorage.onlyShowNew){ //Check for existence.
		//The default is to show all comments, not just new comments.
		if(onlyShowNew) localStorage.onlyShowNew = "YES";
		else localStorage.onlyShowNew = "NO";
	} else{
		if (localStorage.onlyShowNew == "NO"){
			onlyShowNew = false;
		} else if (localStorage.onlyShowNew == "YES") { //A superfluous case, but check it.
			onlyShowNew = true;
		} else { //Someone's been sleeping in my bed and she's still there!
			localStorage.onlyShowNew = "YES";
		}
	}

	//We keep track of whether or not to jump to new comments by default.
	if(!localStorage.jumpToNew){ //Check for existence.
		//The default is to NOT always jump to the new comments when the page loads.
		if(jumpToNew) localStorage.jumpToNew = "YES";
		else localStorage.jumpToNew = "NO";
	} else{
		if (localStorage.jumpToNew == "NO"){
			jumpToNew = false;
		} else if (localStorage.jumpToNew == "YES") { //A superfluous case, but check it.
			jumpToNew = true;
		} else { //Someone's been sleeping in my bed and she's still there!
			localStorage.jumpToNew = "NO"; //Reset to default.
		}
	}
	//We execute the scroll at the end of this script since we'll be changing
	//the content of the page before then.

	//We keep track of whether or not to have a tracking reply box.
	if(!localStorage.trackingReplyBox){ //Check for existence.
		//The default is to have a tracking comment box.
		if(trackingReplyBox) localStorage.trackingReplyBox = "YES";
		else localStorage.trackingReplyBox = "NO";
	} else{
		if (localStorage.trackingReplyBox == "NO"){
			trackingReplyBox = false;
		} else if (localStorage.trackingReplyBox == "YES") { //A superfluous case, but check it.
			trackingReplyBox = true;
		} else { //Someone's been sleeping in my bed and she's still there!
			localStorage.trackingReplyBox = "YES";
		}
	}
}

//Object of type comment.
function comment(idNum, username, divElement){
	this.idNum = idNum;
	this.username = username;
	this.divElement = divElement;
	this.isNew = false;
}

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

//Toggle the reply box.
function toggleReplyBox(){
    var innerReplyBox = document.getElementById("UVReplyBox");
    var replyBox = document.getElementsByClassName("box")[0];

    if(innerReplyBox.style.display=="none"){
        replyBox.style.position = "absolute"; //Stop the magic floating.
        replyBox.style.top = document.body.scrollTop + window.innerHeight - REPLYBOXHEIGHT + "px";
        innerReplyBox.style.display="block";
    } else{
        innerReplyBox.style.display="none";
        replyBox.style.top = "95%";
        replyBox.style.position = "fixed"; //Start the magic floating.
    }
}

//Returns true if elmnt is a member of array, false otherwise.
function memberOf(element, array){
	var i = 0;
	for (i=0; i < array.length; i++){
		if (element == array[i]) return true;
	}
	return false;
}

//Toggles the div to either hidden or visible.
function toggleVisibility(elementId){
    if(document.getElementById(elementId).style.display == 'none'){
      document.getElementById(elementId).style.display = 'block';
    }else{
      document.getElementById(elementId).style.display = 'none';
    }
}

//I need a bunch of helper functions for my controls.
//Save changes to the hiddenList.
function saveHiddenList(){
	//Construct an array and save it to localStorage.
	hiddenList = document.getElementById("UVtxtHiddenList").value.split("\n");
	if(hiddenList[hiddenList.length - 1] == "") hiddenList.pop();
	localStorage.hiddenList = JSON.stringify(hiddenList);
}

//User clicked the always hide checkbox.
function toggleTrackingReplyBox(){
	if(localStorage.trackingReplyBox=="NO") localStorage.trackingReplyBox = "YES";
	else localStorage.trackingReplyBox = "NO";
}

//User clicked the always hide checkbox.
function toggleAlwaysHide(){
	alwaysHide = !alwaysHide;
	if(alwaysHide) localStorage.alwaysHide = "YES";
	else localStorage.alwaysHide = "NO";
}

//User clicked the only show new checkbox.
function toggleOnlyShowNew(){
	onlyShowNew = !onlyShowNew;
	if(onlyShowNew) localStorage.onlyShowNew = "YES";
	else localStorage.onlyShowNew = "NO";
}

//User clicked the always jump to new checkbox.
function toggleJumpToNew(){
	jumpToNew = !jumpToNew;
	if(jumpToNew) localStorage.jumpToNew = "YES";
	else localStorage.jumpToNew = "NO";
}

//Expand or hide all comments on Hidden List.
function showHiddenListed(expanding){
	var j = 0;
	var isElement = false;
	var strDisplayProperty = "none";
	if(expanding) strDisplayProperty = "block";
	for(j=0; j < comments.length; j++){
		isElement = memberOf(comments[j].username, hiddenList);
		if(isElement){
			document.getElementById("UVComment" + comments[j].idNum).style.display = strDisplayProperty;
		}
	}
}

//Expand or hide all comments.
function showAllComments(expanding){
	var j = 0;
	var strDisplayProperty = "none";
	if(expanding) strDisplayProperty = "block";
	for(j=0; j < comments.length; j++){
		document.getElementById("UVComment" + comments[j].idNum).style.display = strDisplayProperty;
	}
}

//Add a username to the Hidden List.
function addUsernameToHiddenList(newUsername){
	var j = 0;
	var isElement = memberOf(newUsername, hiddenList);
	var listString = document.getElementById("UVtxtHiddenList").value;

	//Collapse all comments by that username.
	for(j=0; j < comments.length; j++){
		if(comments[j].username == newUsername){
			document.getElementById("UVComment" + comments[j].idNum).style.display = "none";
		}
	}	
	
	if(isElement) return; //User is already Hidden Listed.
	hiddenList.push(newUsername);

	//Save changes to the hiddenList in the localStorage.
	localStorage.hiddenList = JSON.stringify(hiddenList);
	
	//Update UVtxtHiddenList to reflect our changes.
	//We have to check for newline. grr...
	if(listString.length==0 | listString.charAt(listString.length - 1)=="\n"){
		document.getElementById("UVtxtHiddenList").value += newUsername;
	} else{
		document.getElementById("UVtxtHiddenList").value += ("\n" + newUsername);
	}
}

/*
	The point of addUVEventListeners() is a little technical. We write a lot of custom
	HTML to the page which has to communicate to our script. Problem is, javascript 
	that we write to the page cannot call functions in this script--at least not 
	directly. Thus we add event listeners after the fact that CAN call functions in this
	script directly. BUT we have to wait until the browser has attached to the DOM for
	all the HTML that we've written out before we can attach an event listener. 
*/
function addUVEventHandlers(){
	var i;
	var strCommentDivId;
	var strHiddenListMenuDivId;
	var strShowHideAnchorId;
	var strHiddenListXDivId;
	var splitData;

	//Hook up the comment control bar.
	for(i = 0; i < comments.length; i++){
		strCommentDivId = "UVComment" + comments[i].idNum;
		strHiddenListMenuDivId = "UVHiddenListMenu" + comments[i].idNum;
		strShowHideAnchorId = "UVShowHideAnchor" + comments[i].idNum;
		strHiddenListXDivId = "UVXDiv" + comments[i].idNum;	
		
		//Click the show/hide link.
		safeAddEventListener(strShowHideAnchorId, "click", function()
			{
				//We have set the onclick event to store info in a hidden
				//div called UVCommunicate.
				var strTemp = getInnerText( document.getElementById("UVCommunicate") );
				toggleVisibility(strTemp);
			});
		
		//Click the "X" menu to reveal the "Hide this user" option.
		safeAddEventListener(strHiddenListXDivId, "click", function()
			{
				//We have set the onclick event to store info in a hidden
				//div called UVCommunicate.
				var strTemp = getInnerText(document.getElementById("UVCommunicate"));
				toggleVisibility(strTemp);
			});
		
		//Click the "Hide this user" option.
		safeAddEventListener(strHiddenListMenuDivId, "click", function()
			{
				//We have set the onclick event to store info in a hidden
				//div called UVCommunicate. First token is username, second is strHiddenListMenuDivId.
				var strTemp = getInnerText(document.getElementById("UVCommunicate"));
				splitData = strTemp.split("?"); //Note that "?" is not allowed in usernames.
				addUsernameToHiddenList(splitData[0]);
				toggleVisibility(splitData[1]);
			});
	}
	
	//Hook up the event listeners for the Settings Menu.
	safeAddEventListener("UVTrackingReplyBox", "click", toggleTrackingReplyBox);
	safeAddEventListener("UVAlwaysHide", "click", toggleAlwaysHide);
	safeAddEventListener("UVOnlyShowNew", "click", toggleOnlyShowNew);
	safeAddEventListener("UVJumpToNew", "click", toggleJumpToNew);
	safeAddEventListener("UVSaveChanges", "click", saveHiddenList);
	
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
			saveHiddenList();
			toggleVisibility("UVControlInner");
		});
	
    if(trackingReplyBox){
		safeAddEventListener("UVShowReplyBox", "click", function()
            {
                toggleReplyBox();
            });
        document.getElementsByClassName("box")[0].style.display = "block";
    }
}

//Collect information about the comments and store it in the comments array.
function collectCommentInformation(){
	var elements;
	var i;
	var idNum;
	
	//Let us collect all of the comment id numbers which are stored in anchors.
	elements = document.getElementsByTagName("a");
	for(i=0; i < elements.length; i++){
		if(elements[i].id.match(/comment-/) == "comment-"){
			idNum = elements[i].id.match(/\d+/);
			comments.push(new comment(idNum, "", elements[i]));
		}
	}

	//Now let's get all the usernames for the comments, that is, the comment authors. 
	//They are stored in a span tag with a conveniently marked classname.
	//elements = document.getElementsByTagName("span");
	elements = document.getElementsByClassName("username");
	for(i=0; i < elements.length; i++){
		//Need to strip HTML from this username! Nonregistered users have links for names.
		//We strip HTML by using innerText/innerContent rather than innerHTML.
		comments[i].username = getInnerText(elements[i]);
		comments[i].divElement = elements[i];
	}
	//If there are no comments, do not have a tracking reply box.
	if(0==comments.length) trackingReplyBox = false;
}

//Rewrite the HTML for the comments. 
function rewriteCommentHTML(){
	//Just convenience variables.
	var strNewHTML;
	var strCommentDivId;
	var strHiddenListMenuDivId;
	var strShowHideAnchorId;
	var strHiddenListXDivId;
	var hideThisComment;
	var i;

	for(i = 0; i < comments.length; i++){
		hideThisComment = false;
		strCommentDivId = "UVComment" + comments[i].idNum;
		strHiddenListMenuDivId = "UVHiddenListMenu" + comments[i].idNum;
		strShowHideAnchorId = "UVShowHideAnchor" + comments[i].idNum;
		strHiddenListXDivId = "UVXDiv" + comments[i].idNum;
		
		//I don't think I ever use the id of this div, but whatever.
		strNewHTML = "<div id='UVCommentBar" + comments[i].idNum + "' >";
		
		//Display toggle code.
		strNewHTML += "<a href='javascript:;' id='" + strShowHideAnchorId + "' style='text-decoration:none;'";
		strNewHTML += "onclick='document.getElementById(\"UVCommunicate\").innerHTML=\"" + strCommentDivId + "\";'>+/-</a> " 
		strNewHTML += comments[i].username + "'s comment.";
		//Direct link code.
		strNewHTML += "&nbsp;&nbsp;&nbsp;<a href='";
		strNewHTML += document.URL.split("#")[0] + "#comment-" + comments[i].idNum;
		strNewHTML += "'>Direct link.</a>";
		//Hide user option. We hide this link behind a menu-type thingy.
		strNewHTML += "<div style='float:right'>";
		
		//The X menu.
		strNewHTML += "<a id='" + strHiddenListXDivId + "' href='javascript:;' style='text-decoration:none;' ";
		strNewHTML += "onclick='document.getElementById(\"UVCommunicate\").innerHTML=\"" + strHiddenListMenuDivId + "\";'>X</a>";
		
		//The hiddenList user link.
		strNewHTML += "<div id='" + strHiddenListMenuDivId + "' style='display:none;float:right;'>&nbsp;&nbsp;";
		strNewHTML += "<a href='javascript:;' onclick='document.getElementById(\"UVCommunicate\").innerHTML=\"";
		strNewHTML += comments[i].username + "?" + strHiddenListMenuDivId + "\";' style='text-decoration:none;'>";
		strNewHTML += "Hide " + comments[i].username + ".</a></div></div>";
		
		//EOL
		strNewHTML += " <br />";
		
		//Wrap comment in a hide-able div with a known id.
		strNewHTML += "<div id='" + strCommentDivId + "'";
			
		//Check if it's a new comment.
		if(comments[i].divElement.parentNode.parentNode.innerHTML.match("<span class=\"new\">New</span>")){
			comments[i].isNew = true;
		} else{
			comments[i].isNew = false;
		}

		//Check if we should hide this comment.
		//If we are only showing new comments and this comment isn't new, hide.
		if(comments[i].isNew==false & onlyShowNew) hideThisComment = true;
		//If we are hiding the Hidden List usernames and this comment is on the Hiddenlist, hide.
		if(memberOf(comments[i].username, hiddenList) & alwaysHide) hideThisComment = true;
		if(hideThisComment) strNewHTML += " style='display:none'";
		
		strNewHTML += " >";
		strNewHTML += comments[i].divElement.parentNode.parentNode.innerHTML;
		strNewHTML += "</div>";
		
		//Replace the div's innnerHTML.
		comments[i].divElement.parentNode.parentNode.innerHTML = strNewHTML;
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
	
	//Show only new comments.
	strControls += "<input type='checkbox' id='UVOnlyShowNew' value='YES'"
	if(onlyShowNew) strControls += " checked ";
	strControls += "/> Only show new comments.<br><br>";
	
	//Always jump to new comments.
	strControls += "<input type='checkbox' id='UVJumpToNew' value='YES'"
	if(jumpToNew) strControls += " checked ";
	strControls += "/> Always jump to new comments.<br><br>";
	
	//Floating "Add your comment" box.
	strControls += "<input type='checkbox' id='UVTrackingReplyBox' value='YES'"
	if("YES" == localStorage.trackingReplyBox) strControls += " checked ";
	strControls += "/> Floating Comment Box. (Takes effect on refresh.)<br><br>";
	
	//Hidden List
	strControls += "Hidden List:<br>";
	strControls += "<textarea id='UVtxtHiddenList' rows='10' cols='10' style='width:190px;border:1px solid #000000'>"; //Remember to override Spectrum's css.
	for(j = 0; j < hiddenList.length; j++){
		strControls += hiddenList[j] + "\n"
	}
	strControls += "</textarea><br>";
	strControls += "(One username per line. Things like spaces and caps matter!)<br>";
	//Save Changes.
	strControls += "<a href='javascript:;' id='UVSaveChanges' style='text-decoration:none;'>Save changes</a><br><br>";
	
	//Expand/contract various.
	strControls += "Comments on Hidden List: <br>&nbsp;&nbsp;&nbsp;&nbsp;<a id='UVShowHiddenListed' href='javascript:;' style='text-decoration:none;'>Show</a>&nbsp;-&nbsp;";
	strControls += "<a id='UVHideHiddenListed' href='javascript:;' style='text-decoration:none;'>Hide</a><br>";
	strControls += "All comments: <br>&nbsp;&nbsp;&nbsp;&nbsp;<a id='UVShowAll' href='javascript:;' style='text-decoration:none;'>Show</a>&nbsp;-&nbsp;";
	strControls += "<a id='UVHideAll' href='javascript:;' style='text-decoration:none;'>Hide</a><br>";

	//END Inner Control Box HTML
	strControls += "</div>";

	//Control Box Toggler
	strNewHTML = "";
	strNewHTML += "<div style='";
	strNewHTML += "position:fixed;"; //This is the magic property value that makes it float.
	strNewHTML += "width:30px;height:10px;left:10px;top:0px;z-index:10;";
	strNewHTML += "'>";
	strNewHTML += "<a id='UVControlMenu' href='javascript:;' style='text-align:center;text-decoration:none;color:#FFFFFF;background-color:#C0C0C0;border: 1px solid black'>&nbsp;UV&nbsp;</a> "
	strNewHTML += "</div>";
	//Control Box
	strNewHTML += "<div id='UVControl' style='";
	strNewHTML += "position:fixed;"; //This is the magic property value that makes it float.
	strNewHTML += "width:230px;height:50px;left:10px;top:20px;z-index:10;";
	strNewHTML += "'>";
	strNewHTML += strControls; //Hidden until clicked.
	strNewHTML += "</div>";

	//We also need a way to communicate betweeen the scripts on the page and this script. 
	//We do this with an invisible div.
	strNewHTML +=  "<div id='UVCommunicate' style='display:none'></div>";

	//Write out the HTML for our control box.
	commentContainer.innerHTML = commentContainer.innerHTML + strNewHTML;
}

function rewriteReplyBoxHTML(){
	//Don't change anything if the tracking control box feature is turned off.
	if(!trackingReplyBox) return;
	
	var replyBox = document.getElementsByClassName("box")[0];
	var strNewHTML;
	
	replyBox.style.display="none";
	//Set up the tracking "Add your comment" box.
	//For some reason the "Add your comment" box is the only element of class "box".
	strNewHTML = "<div id='UVReplyBoxControl' >";
	strNewHTML += "<a href='javascript:;' id='UVShowReplyBox' style='text-decoration:none;position:relative;top:-10px;'>";
	strNewHTML += "Add your comment&crarr;</a>";
	strNewHTML += "</div>";
	strNewHTML += "<div id='UVReplyBox' style='display:none'>";
	strNewHTML += replyBox.innerHTML;
	strNewHTML += "</div>";

	replyBox.innerHTML = strNewHTML;
	replyBox.style.right="0px";
	replyBox.style.position="fixed";
	replyBox.style.top="95%";
	replyBox.style.width="320px";
	replyBox.style.border="1px solid black";
	replyBox.style.zIndex="9";
}

/* CODE */

//Only do anything if there is a comments section on this page.
if(commentContainer){
	//The code has been factored into a series of functions to make this script readable.
	retrieveLocalStorageData();
	collectCommentInformation();
	rewriteCommentHTML();
	writeControlBoxHTML();
	rewriteReplyBoxHTML();
	
	//We're done changing the contents of the page. Scroll the page to new comments.
	if(jumpToNew){
		//Only try to scroll to new comments if there are in fact new comments.
		if(document.getElementById("new")) document.getElementById("new").scrollIntoView();
	}
	
	addUVEventHandlers();

}
