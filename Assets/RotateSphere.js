import System.IO; 
import System.Net;
import System.Text;
import System.Collections;
import System.IO.Ports;

var wwwPost : WWW;
var checkPostForDone : boolean = false;
var wwwList : WWW;
var checkListForDone : boolean = false;

var gridInt : int = 0; 
var checkInt : int= 0; 

static var inInsertMode : String = "Load";

static var lastTick : float = Time.time; 
static var lastKeyTick : float = Time.time;

var currentErrorString : String = "Welcome to the Sequencer";

//var stream : SerialPort = new SerialPort("COM3", 9600); //Set the port (com4) and the baud rate (9600, is standard on most devices)

static var fileList : String = "";
var fileName : String = "";

//this is the maximum number of frames allowed un a sequence
static var INDEX_MAX : int = 1500;

// this is the current frame
static var frameIndex : int = 0;

// this is the frame index before I hit play
// if it's -1 then I'm not in the play state
static var oldFrameIndex : int = -1;

// stores the highest frame the user has seen so far
// I use this to know when to copy the previous frame to the current one
static var maxIndex : int = 0;

var currentID : int = 0;
var currentName : String = "";
static var frames : Array;
static var frame;
static var debugLabel : String;
static var rowLabel = ["","","","","","","","", ""];

var patternList : Array; 
var patternListNames : String[];
var copiedFrame : Array = null;

var uisvPosition : Vector2 = Vector2.zero;

// initialization code goes outside of any functions
frames = new Array(INDEX_MAX);
for(frame in frames)
{
	frame = new int[92];
	for(item in frame)
		item = 0;
}

RenderFrame();

function Start () : void
{
	Debug.Log("Start");
	ListFiles();
//s	stream.Open(); //Open the Serial Stream.
}

// this is a public function that's called whenever a user clicks on a jet
//
// for some reason this is being called 6 times...
//
function SetJet(jetID:int, value:boolean)
{
	//	Debug.Log("frameindex" + frameIndex + " jetID:" + jetID + "=" + value);
	frames[frameIndex][jetID] = value ? 1:0;	
	UpdateRowLabel(); 
}

function OnGUI () {

	// this is my poor mans 2d representation of the sphere
	// if prints out which jets are on in rings
	// someone who wanted could make this prettier
	
	if (frames != null)
	{
		GUI.Label (Rect (10, 0, 400, 20), "frame: " + (frameIndex  +1) + " of " + (maxIndex + 1));
		for(i = 0;i<9;i++)
		{
			// Debug.Log("index=" + frameIndex + " " + i);
			GUI.Label (Rect (10, 10*(i+1), 400, 20), "ring " + i + ":" + rowLabel[i]);
		}
	}	
	
	if (currentErrorString != "")
		GUI.Label (Rect((Screen.width/2) - 120, 0, 240, 40), currentErrorString);

	//framesInt = GUI.SelectionGrid(Rect(0, 0, 180, patternListNames.length*25), gridInt, patternListNames, 1);



	var lastXPos : int = 0;
	GUI.Box(Rect(Screen.width -200, lastXPos, 200, 200), "[Controls] ver: 0.7a");
	lastXPos += 20;
	if (GUI.RepeatButton(Rect(Screen.width -200, lastXPos, 100, 20), "Prev Frame ([)"))	{
		NavigateFrame(true);
	}
	if (GUI.RepeatButton(Rect(Screen.width -100, lastXPos, 100, 20), "Next Frame (])")) {
		NavigateFrame(false);
	}
	lastXPos += 20;
	if (GUI.Button(Rect(Screen.width -200, lastXPos, 100, 20), "Hollow (.)"))	{
		var sphere = GameObject.Find("Sphere");
		sphere.renderer.enabled = ! sphere.renderer.enabled;
	}
	
		if (oldFrameIndex == -1)
	{
		if (GUI.Button(Rect(Screen.width -100, lastXPos, 100, 20), "Play"))
		{
			oldFrameIndex = frameIndex;
			GUIUtility.keyboardControl = 0;
		}
	}
	else
	{
		if (GUI.Button(Rect(Screen.width -100, lastXPos, 100, 20), "Stop"))
		{
			oldFrameIndex = -1;
			GUIUtility.keyboardControl = 0;
		}
	}

	lastXPos += 20;		
	GUI.Label (Rect(Screen.width - 200, lastXPos , 60, 20), "File Name");
	fileName = GUI.TextField (Rect (Screen.width - 140, lastXPos , 90, 20), fileName);

	if ("" != fileName)
	{
		if (GUI.Button(Rect(Screen.width -50, lastXPos, 50, 20), "Save")) {
			Debug.Log(frames.length);
			PostPattern(fileName, "" + FramesToBitMask(frames));
			GUIUtility.keyboardControl = 0;
		}
	}


	lastXPos += 20;	
	if(GUI.Button(Rect(Screen.width -200, lastXPos, 30, 20), "Ins"))
	{
		InsertFrame();
		GUIUtility.keyboardControl = 0;
	}		
	if(GUI.Button(Rect(Screen.width -170, lastXPos, 30, 20), "Clr"))
	{
		ClearFrame();
		GUIUtility.keyboardControl = 0;
	}
	if(GUI.Button(Rect(Screen.width -140, lastXPos, 30, 20), "Cut"))
	{
		CutFrame();
		GUIUtility.keyboardControl = 0;
	}
	if(GUI.Button(Rect(Screen.width -110, lastXPos, 40, 20), "Copy"))
	{
		CopyCurrentFrame();
		GUIUtility.keyboardControl = 0;
	}		
	if (null != copiedFrame)
	{
		if(GUI.Button(Rect(Screen.width -70, lastXPos, 35, 20), "Pst"))
		{
			PasteFrame();
			GUIUtility.keyboardControl = 0;
		}
		if(GUI.Button(Rect(Screen.width -35, lastXPos, 35, 20), "Mrg"))
		{
			MergeFrame();
			GUIUtility.keyboardControl = 0;
		}		
	}
	
	lastXPos += 20;
	if (GUI.Button(Rect(Screen.width -150, lastXPos, 100, 20), inInsertMode)) 
	{
		Debug.Log("in insert mode [" + inInsertMode + "]"	);
		switch (inInsertMode)
		{
			case "Insert":
				Debug.Log("Insert");				
				inInsertMode = "Merge All";
				break;
			case "Merge All":
				Debug.Log("Merge");
				inInsertMode = "Load";
				break;
			default:
				Debug.Log("Load");
				inInsertMode = "Insert";
					break;
		}	
			
		GUIUtility.keyboardControl = 0;
	}
	lastXPos += 20;

    // An absolute-positioned example: We make a scrollview that has a really large client
    // rect and put it in a small rect on the screen.
    uisvPosition= GUI.BeginScrollView (Rect(Screen.width - 200, lastXPos , 200, Screen.height - 200), uisvPosition, Rect(0, 0, 180, patternListNames.length*25+10));

	//GUI.Label(Rect(0,0,20,20), "hellow world");
	gridInt = GUI.SelectionGrid(Rect(0, 0, 180, patternListNames.length*25), gridInt, patternListNames, 1);
    
    // End the scroll view that we began above.
    GUI.EndScrollView ();
	
	if (checkPostForDone == true) 
	{
		if (wwwPost.isDone) {
			Debug.Log("Post Completed " + wwwPost.data);
			checkPostForDone = false;
			wwwPost = null;
			ListFiles();
		}
	}
	
	
	if (checkListForDone == true)
	{
		if (wwwList.isDone) {
			Debug.Log("List Completed");
			checkListForDone = false;
			fileList = wwwList.data;
			wwwList = null;
			patternList = FileListToArray(fileList);
			patternListNames = new String[patternList.length];
			for (i = 0; i < patternList.length;i++)
			{
				if (patternList[i].length > 1)
					patternListNames[i] = patternList[i][1];
			}
			
			if (patternList[0][1] == fileName)
			{
				currentName = fileName;
				currentID = int.Parse(patternList[0][0]);
			}
			// fileList is a variable that I'm using to show
			// the sequenced that folks have created
			var s : String = "";
			for (row in patternList)
			{
				if (row.length > 1)
					s += row[1] + "\n";
			}
			fileList = s; 
		}	
	}	
}


// fileio.aspx returns the entries in the following format
// 
// id!name!#.#.#|#.#.#|#.#.#
// id!name!#.#.#|#.#.#|#.#.#
// id!name!#.#.#|#.#.#|#.#.#
//
// so this function turns that into
//
// { 
//   {id, name, #.#.#|#.#.#|#.#.#}, 
//	 {id, name, #.#.#|#.#.#|#.#.#}, 
//   {id, name, #.#.#|#.#.#|#.#.#}
// }

function FileListToArray(list : String) : Array
{
	if (!list)
		return ;
		
	var tmpArray : Array = list.Split("\n"[0]);
	var str : String;
	var tmpstr : String;
	for (str in tmpArray)
	{
		str = str.Split("!"[0]);
	}

	return tmpArray;
}


function DisplayLabelRow(row:Array) : String
{
	var s : String = "";
	for (var i:int = 1;i<92;i++)
	{
		if (i < 10)
			s += i + "  ";
		else
			s += i + " ";
	}
	return s;
}

function UpdateRowLabel() :void
{
	var start:int = 0;
	var end:int = 0;
	
	var index = 0;
	
	var section : int;
	for (section = 0; section<9;section++)
	{
		switch (section)
		{
			case 0:
				start = 0;
				end = 0;
				break;
			case 1:
				start = 1;
				end = 5;
				break;
			case 2:
				start = 6;
				end = 15;
				break;
			case 3:
				start = 16;
				end = 30;
				break;
			case 4:
				start = 31;
				end = 45;
				break;
			case 5:
				start = 46;
				end = 60;
				break;
			case 6:
				start = 61;
				end = 75;
				break;
			case 7:
				start = 76;
				end = 85;
				break;
			case 8:
				start = 86;
				end = 90;
				break;
			default:
				break;
			}
		
		//Debug.Log("section " + section + " [" + start + "][" + end + "]");
		rowLabel[section] = "";
		for (var i:int = start;i<=end;i++)
		{
			rowLabel[section] += frames[frameIndex][i] + " ";
		}	
	}
}

// this takes a frame (with 92 jets) and compresses them into three 32-bit
// int seperated by periods
//
// e.g., 0.0.0
//
function FrameToBitMask(frame : int[]) : String
{
	var s : String = "";
	var bitmask : int = 0;
	var iCol : int = 0;

	for (iCol = 0;iCol < 31;iCol++)
	{
		if (frame[iCol])
			bitmask |= 1 << iCol;
	}
	s += bitmask + ".";

	bitmask = 0;
	for (iCol = 31;iCol < 61;iCol++)
	{
		if (frame[iCol])
			bitmask |= 1 << (iCol-31);
	}
	s += bitmask + ".";
	
	bitmask = 0;
	for (iCol = 61;iCol < 91;iCol++)
	{
		if (frame[iCol])
			bitmask |= 1 << (iCol -61);
	}
	s += bitmask;
	
	return s;

}

// this takes an array of frames and compresses them into a bitfield
function FramesToBitMask(frames) : String
{
	var s : String = "";
	var iFrame : int;
	
	for (iFrame = 0;iFrame <= maxIndex;iFrame++)
	{
		Debug.Log(iFrame);
		s += FrameToBitMask(frames[iFrame]);
		if (iFrame < maxIndex)
			s += "|";
	}
	return s;
}

function FramesToString(frames) : String
{
	var s : String = "";
	var column : int;
	var frame : Array;
	
	for (frame in frames)
	{
		for (column in frame)
		{
			s += column + "";
		}
		s += "|";
	}
	return s;
}

function RenderFrame()
{
	var jet : GameObject;
	UpdateRowLabel();

	for (i = 0;i<92;i++)
	{
		jet = GameObject.Find("Jet" + i);
		if (jet != null)
		{
			var child : Transform = jet.transform.Find("Flame");
			if (child != null)
			{
				for (flame in child)
					flame.renderer.enabled = frames[frameIndex][i];
			}
		}
	}
}

function CutFrame()
{
	CopyCurrentFrame();
	var i : int;
	for (i = frameIndex;i<maxIndex;i++)
		frames[i] = frames[i+1];
	frames[maxIndex] = new int[92];
	maxIndex--;
	frameIndex--;
	RenderFrame();
}

function InsertFrame()
{
	var i : int;
	for (i = maxIndex;i>=frameIndex;i--)
		frames[i+1] = frames[i];
	frames[frameIndex] = new int[92];
	maxIndex++;
	RenderFrame();

}

function ClearFrame()
{
	frames[frameIndex] = new int[92];
	RenderFrame();
}

function CopyCurrentFrame()
{
	if (null == copiedFrame)
		copiedFrame = new int[92];
	
	for(i = 0;i<frames[frameIndex].length;i++)			
		copiedFrame[i] = frames[frameIndex][i];
	RenderFrame();
}

function MergeFrame()
{
	
	for(i = 0;i<frames[frameIndex].length;i++)
	{	
		if (frames[frameIndex][i] == 1 || copiedFrame[i] == 1)
			frames[frameIndex][i] = 1;
	}
	RenderFrame();
}

function PasteFrame()
{
	
	for(i = 0;i<frames[frameIndex].length;i++)
	{	
		frames[frameIndex][i] = copiedFrame[i] ;
	}
	RenderFrame();
}

function InsertPattern(theName : String, merge : boolean)
{
	
	// look for the pattern by name in the list of all patterns
	var thePattern = FindInPattern(theName);
	if (thePattern == null)
	{
		currentErrorString = "Hmm... I couldn't find " + theName;
		return;
	}

	// load my new pattern into tmpFrames
	var tmpFrames : Array = LoadPatternIntoArray(theName);
	var newMaxIndex : int;
	if (merge == true)
	{
		if (tmpFrames.length > maxIndex)
			newMaxIndex = tmpFrames.length;
		else
			newMaxIndex = maxIndex;
	} 
	else
	{
		newMaxIndex = maxIndex + tmpFrames.length;
	}
	
	if (newMaxIndex > INDEX_MAX)
	{
		currentErrorString = "Sadly, I can't insert pattern " + theName + " because your total pattern length cannot be more than " +INDEX_MAX +".";
		return;
	}

	var tmpOldFrames : Array = new Array();
	tmpOldFrames.length = maxIndex-frameIndex;

	if (merge == true)
	{
		if (tmpFrames.length > frames.length)
			frames.length = tmpFrames.length;
	}
	else
	{
		frames.length += tmpFrames.length;		
	}

	for(i = 0;i<maxIndex - frameIndex;i++)
	{
		tmpOldFrames[i] = frames[frameIndex + i];
	}
	Debug.Log("Copied frames " + frameIndex + " to " + maxIndex);
	
	// copy the new frames in
	for(i = 0;i < tmpFrames.length;i++)
	{
		if (merge == true)
		{
			Debug.Log("In Merge");
			for(jetIndex = 0;jetIndex < 92;jetIndex++)
			{
				// Debug.Log("In Merge " + frames[i+frameIndex][jetIndex]  + ":" + tmpFrames[i][jetIndex]);
				frames[i+frameIndex][jetIndex]  = (frames[i+frameIndex][jetIndex] || tmpFrames[i][jetIndex]);
			}	
			maxIndex = newMaxIndex;
		}
		else
		{
			Debug.Log("In Insert");
			frames[i+frameIndex] = tmpFrames[i];
			maxIndex += tmpFrames.length + 1;
			for(j = 0;j < tmpOldFrames.length;j++)
				frames[i+tmpFrames.length + frameIndex+1][j] = tmpOldFrames[i][j];
		}
	}

	RenderFrame();
}

function LoadPattern(theName : String)
{
	// look for the pattern by name
	// in the list of all patterns
	var thePattern = FindInPattern(theName);
	if (thePattern == null)
	{
		currentErrorString = "Couldn't find " + theName;
		return null;
	}
	
	currentID = int.Parse(thePattern[0]);
	currentName = theName;
	
	var tmpFrames : Array = LoadPatternIntoArray(theName);
			
	frames = tmpFrames;

	// the number of filled frames is reset to the number 
	// of frames in the new sequence
	maxIndex = tmpFrames.length;
	
	// fill out the rest of the array of frames
	for(i = maxIndex;i<92;i++)
	{
		frames[i] = new int[92];
	}
	
	frameIndex = 0;
	fileName = theName;	
	RenderFrame();
		
}

function LoadPatternIntoArray(theName : String) : Array
{
	var tmpPattern : int[];

	// check to make sure the pattern exists
	var thePattern = FindInPattern(theName);
	if (thePattern == null)
		return null;
		
	// the patternlist will return an element that looks something like this
	//
	// 0.0.0|1.0.0|3.0.0
	//
	// so first I split it on the pipe to get an array of frames
	var tmpframes : Array = thePattern[2].Split("|"[0]);
	Debug.Log("Loading Frames: " + tmpframes);
	
	var i : int;	
	for (frame in tmpframes)
	{
		Debug.Log("loading Frame: " + frame);
		// a frame looks like 0.0.0 so I split on the period to get my three ints
		var tmpframe = frame.Split("."[0]);
				
		// here I'm converting from a bitmask to an array
		tmpPattern = new int[92];
		for(i = 0;i<31;i++)
			tmpPattern[i] = int.Parse(tmpframe[0]) & (1 << i) ? 1 : 0;
		for(i = 31;i<61;i++)
			tmpPattern[i] = int.Parse(tmpframe[1]) & (1 << (i-31))? 1:0;
		for(i = 61;i<91;i++)
			tmpPattern[i] = int.Parse(tmpframe[2]) & (1 << (i-61))? 1:0;			
			
		frame = tmpPattern;
	}
	
	Debug.Log("Loaded Frames: " + tmpframes);
	return tmpframes;	
}

function FindInPattern(theName : String) : Array
{
	var p : String;
	for (p in patternList)
	{
		// Debug.Log("load pattern " + p[0] + " " + p[1] + " " + p[2]);
		
		if (p.Length < 3)
			break;
		
		if(p[1] == theName)
			return p;
	}
	
	return null;

}

function PostPattern(theName : String, pattern : String)
{
	// Start a download of the given URL
	Debug.Log(theName + ": " + pattern);
	var pagesUrl : String = "http://akrasia.org/pyro/fileio.aspx?command=save&pattern=" + pattern;
	
	if (currentID == 0)
	{
		// do nothing
	}
	else if (theName == currentName)
	{
		pagesUrl += "&id=" + currentID;
	}	else
	{
		theName += "1";
		fileName = theName;
	}
	
	currentName = theName;
	pagesUrl += "&name=" + theName;
	
	    // Create a Web Form
    //var form = new WWWForm();
    //form.AddField("pattern", pattern);
	
    wwwPost = new WWW (pagesUrl);    
	checkPostForDone = true;
}

function ListFiles () {
	var pagesUrl : String = "http://akrasia.org/pyro/fileio.aspx?command=load";
	wwwList = new WWW (pagesUrl); 
	checkListForDone = true;
}

function NavigateFrame (direction : boolean) {
	var sDir = "";

	if (direction)
	{
		if (frameIndex > 0)
		{
			frameIndex--;
			sDir = "<- ";
		}
		else
		{
			frameIndex = maxIndex;
		}
	}
	else 
	{
		frameIndex++;
		sDir = "-> ";
		
		// if this is the first time I'm seeing this frame then
		// copy the last frame into this one
		if (frameIndex > maxIndex)
		{
			CopyFrame(frames[maxIndex],frames[frameIndex]);
			maxIndex = frameIndex;
		}	
	}
	
	Debug.Log(sDir + "[" +frameIndex + " of "+ maxIndex +"] " + FrameToBitMask(frames[frameIndex]));
	RenderFrame();
}


function Update () {
	var objResponse : WebResponse;
	var objRequest : WebRequest ;
	
	
	// if the oldFrameIndex isn't -1 then I'm in the play state
	// and so I'm going to loop through the animations
	if (oldFrameIndex != -1)
	{		
		if (Time.time > (lastTick + .2))
		{
			lastTick = Time.time;
			frameIndex++;
			if (frameIndex > maxIndex)
				frameIndex = 0;
				
			RenderFrame();			
		}
	}
		

   if (gridInt != checkInt) 
   {
		if ("Insert" == inInsertMode)
		{
			Debug.Log("Insert: " + gridInt + ":"+ patternListNames[gridInt]); 
			InsertPattern(patternListNames[gridInt], false);		
		}
		else if ("Load" == inInsertMode)
		{
			Debug.Log("Load" + gridInt + ":"+ patternListNames[gridInt]); 

			LoadPattern(patternListNames[gridInt]);
		}
		else if ("Merge All" == inInsertMode)
		{
			Debug.Log("Merge: " + gridInt + ":"+ patternListNames[gridInt]); 
			InsertPattern(patternListNames[gridInt], true);		
		}
		
		checkInt = gridInt; 
   } 

	if (Input.GetKey(KeyCode.LeftBracket)) {
		if(Time.time > (lastKeyTick + .2))
		{
			lastKeyTick = Time.time;
			fileName = fileName.Trim("["[0]);
			NavigateFrame(true);
		}
	}
	
	if (Input.GetKey(KeyCode.RightBracket)) {
		if(Time.time > (lastKeyTick + .2))
		{
			lastKeyTick = Time.time;
			fileName = fileName.Trim("]"[0]);
			NavigateFrame(false);
		}
	}
	
	if(Input.GetKeyDown(KeyCode.Period)) {
		fileName = fileName.Trim("."[0]);
		var sphere = GameObject.Find("Sphere");
		sphere.renderer.enabled = ! sphere.renderer.enabled;
	}
	

    // spin the object around the world origin at 20 degrees/second.
	//transform.Rotate (Input.GetAxis("Vertical"), Input.GetAxis("Horizontal") , 0, Space.Self);
	transform.RotateAround(Vector3(-85.19227,11.19896,7.82373), Vector3.up + Vector3.forward, 1* Input.GetAxis("Vertical"));
	transform.RotateAround(Vector3(-85.19227,11.19896,7.82373), Vector3.right, 1* Input.GetAxis("Horizontal"));
}

function CopyFrame(sourceFrame : int[], destFrame : int[])
{
	Debug.Log(FrameToBitMask(sourceFrame) + " " + FrameToBitMask(destFrame));
	for(i = 0; i < sourceFrame.length;i++)
		destFrame[i] = sourceFrame[i];
}


