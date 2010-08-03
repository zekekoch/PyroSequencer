import System.IO; 
import System.Net;
import System.Text;
import System.Collections;
import System.IO.Ports;

var wwwPost : WWW;
var checkPostForDone : boolean = false;
var wwwList : WWW;
var checkListForDone : boolean = false;

//var stream : SerialPort = new SerialPort("COM3", 9600); //Set the port (com4) and the baud rate (9600, is standard on most devices)
var filePath = "testWrite.txt"; 

static var INDEX_MAX : int = 400;
static var frameIndex : int = 0;
static var fileList : String = "";
var fileName : String = "";

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
		GUI.Label (Rect (10, 0, 400, 20), "frame: " + frameIndex);
		for(i = 0;i<9;i++)
		{
			// Debug.Log("index=" + frameIndex + " " + i);
			GUI.Label (Rect (10, 10*(i+1), 400, 20), "ring " + i + ":" + rowLabel[i]);
		}
	}	
	
	var guiBoxRect : Rect = new Rect(Screen.width -200, 0, 200, 200);

	
	if (fileName != "")
	{
		GUI.Box(guiBoxRect, "[Controls] ver: 0.5a");
		if (GUI.Button(Rect(Screen.width -200, 20, 100, 20), "Prev Frame ([)"))	{
			NavigateFrame(true);
		}
		if (GUI.Button(Rect(Screen.width -100, 20, 100, 20), "Next Frame (])")) {
			NavigateFrame(false);
		}
		if (GUI.Button(Rect(Screen.width -200, 40, 100, 20), "Hollow (.)"))	{
			var sphere = GameObject.Find("Sphere");
			sphere.renderer.enabled = ! sphere.renderer.enabled;
		}
		if (GUI.Button(Rect(Screen.width -200, 80, 100, 20), "Save")) {
			PostPattern(fileName, "" + FramesToBitMask(frames));
			GUIUtility.keyboardControl = 0;
		}
		if (GUI.Button(Rect(Screen.width -100, 80, 100, 20), "Load")) {
			LoadPattern(fileName);
			GUIUtility.keyboardControl = 0;
		}
	} else {
		GUI.Box(guiBoxRect, "Enter Filename");	
	}
	
	GUI.Label (Rect(Screen.width - 200, 60, 100, 20), "File Name");
	fileName = GUI.TextField (Rect (Screen.width - 100, 60, 100, 20), fileName);
	
	GUI.Label (Rect(Screen.width - 200, 100, 200, 800), fileList);

	
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

function LoadPattern(theName : String)
{
	var tmpPattern : int[];

	// look for the pattern by name
	// in the list of all patterns
	thePattern = FindInPattern(theName);
	if (thePattern == null)
		return;
	
	currentID = int.Parse(thePattern[0]);
	currentName = theName;
	
	// the patternlist will return an element that looks something like this
	//
	// 0.0.0|1.0.0|3.0.0
	//
	// so first I split it on the pipe to get an array of frames
	var tmpframes : Array = thePattern[2].Split("|"[0]);
	
	var i : int;	
	var iFrame : int = 0;
	for (frame in tmpframes)
	{
		Debug.Log(frame);
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
	
		frames[iFrame] = tmpPattern;

		iFrame++;
	}
	
	// reset the max index
	frameIndex = 0;
	maxIndex = iFrame;
	
	for(i = iFrame;i<92;i++)
	{
		frames[i] = new int[92];
	}
	
	// this is just some debugging code to made sure I'm decoding the 
	// array correctly
	/*
	for (j = frameIndex;j < maxIndex;j++)
	{
	str = "";
		for (i =0;i<91;i++)
			str += frames[j][i] + ",";
		Debug.Log(str);
	}
	*/
	RenderFrame();
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
	pagesUrl += "&name=" + theName;
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
	
	if (Input.GetKeyDown(KeyCode.LeftBracket)) {
		fileName = fileName.Trim("["[0]);
		NavigateFrame(true);
	}
	
	if (Input.GetKeyDown(KeyCode.RightBracket)) {
		fileName = fileName.Trim("]"[0]);
		NavigateFrame(false);
	}
	
	if(Input.GetKeyDown(KeyCode.Period)) {
		fileName = fileName.Trim("."[0]);
		var sphere = GameObject.Find("Sphere");
		sphere.renderer.enabled = ! sphere.renderer.enabled;
	}
	

    // spin the object around the world origin at 20 degrees/second.
	//transform.Rotate (Input.GetAxis("Vertical"), Input.GetAxis("Horizontal") , 0, Space.Self);
	transform.RotateAround(Vector3(-85.19227,11.19896,7.82373), Vector3.forward, 1* Input.GetAxis("Vertical"));
	transform.RotateAround(Vector3(-85.19227,11.19896,7.82373), Vector3.right, 1* Input.GetAxis("Horizontal"));
}

function CopyFrame(sourceFrame : int[], destFrame : int[])
{
	Debug.Log(FrameToBitMask(sourceFrame) + " " + FrameToBitMask(destFrame));
	for(i = 0; i < sourceFrame.length;i++)
		destFrame[i] = sourceFrame[i];
}


function WriteFile(filepathIncludingFileName : String) 
{ 
   var sw : StreamWriter = new StreamWriter(filepathIncludingFileName); 
   sw.WriteLine("Line to write"); 
   sw.WriteLine("Another Line"); 
   sw.Flush(); 
   sw.Close(); 
} 

function ReadFile(filepathIncludingFileName : String) { 
   sr = new File.OpenText(filepathIncludingFileName); 

   input = ""; 
   while (true) { 
      input = sr.ReadLine(); 
      if (input == null) { break; } 
      Debug.Log("line="+input); 
   } 
   sr.Close(); 
} 


