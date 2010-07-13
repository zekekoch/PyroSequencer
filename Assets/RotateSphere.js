import System.IO; 
import System.Net;
import System.Text;
import System.Collections;
import System.IO.Ports;

var stream : SerialPort = new SerialPort("COM3", 9600); //Set the port (com4) and the baud rate (9600, is standard on most devices)
var filePath = "testWrite.txt"; 

static var frameIndex : int = 0;

// stores the highest frame the user has seen so far
// I use this to know when to copy the previous frame to the current one
static var maxIndex : int = 0;

static var frames : Array;

static var patternChanged : boolean = false;
static var debugLabel : String;

// initialization code goes outside of any functions
frames = new Array(100);
for(frame in frames)
{
	frame = new Array(92);
	for(item in frame)
		item = 0;
}

function Start () : void
{
//s	stream.Open(); //Open the Serial Stream.
}


// this is a public function that's called whenever a user clicks on a jet
function SetJet(jetID:int, value:boolean)
{
	//Debug.Log("frameindex" + frameIndex + " jetID:" + jetID + "=" + value);
	frames[frameIndex][jetID] = value ? 1:0;	
	patternChanged = true;
}

// OnGUI is called a lot.  It doesn't make much sense to me, but this is the only place
// you can draw 2d stuff.  I need the patternChanged stuff to make sure that I don't 
// draw the ui too many times.  It doesn't seem to work very consistently yet.  I clearly 
// don't get this yet.
function OnGUI () {
	if (frames != null && patternChanged == true)
	{
		GUI.Label (Rect (10, 0, 1280, 20), "frame: " + frameIndex);
		for(i = 0;i<9;i++)
		{
			GUI.Label (Rect (10, 10*i, 1280, 20), "ring " + i + ":" + DisplayRow(frames[frameIndex], i));
		}
//		patternChanged = false;
	}
	
	//GUI.Label(new Rect(10,10,300,100), newString); //Display new values
	//s// Though, it seems that it outputs the value in percentage O-o I don't know why.

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

function DisplayRow (row:Array, section:int) : String
{
	var s : String = "";
	var start:int = 0;
	var end:int = 0;
	
	
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
	
	for (var i:int = start;i<=end;i++)
	{
		if (i < 10)
			s += row[i] + " ";
		else
			s += "" + row[i] + " ";
	}

//	stream.WriteLine(String.Format(s));
return s;
}

function RenderFrame()
{
	var jet : GameObject;
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

function PostPattern(request: String, pattern : String) : String
{
	var objResponse : WebResponse;
	var objRequest : WebRequest ;
	var sr : StreamReader;
	var sUrl : String = "";
	var data : byte[];

	sUrl = "http://unsaturated.net/pyrosphere/save_sequence.php";

	pattern = "filename=zekepattern&sequence=" + pattern + "&save=Submit";

	var encoding : ASCIIEncoding = new ASCIIEncoding();
	data = encoding.GetBytes(pattern);
	
	objRequest = System.Net.HttpWebRequest.Create(sUrl);
	objRequest.Method = "POST";
	objRequest.ContentType="text/plain";
	objRequest.ContentLength = data.Length;
	
	var newStream : Stream =objRequest.GetRequestStream();
	newStream.Write(data,0,data.Length);
	objResponse = objRequest.GetResponse();
	 
	var respStream : StreamReader = new StreamReader(objResponse.GetResponseStream(),Encoding.GetEncoding(1252));
	 
	result = respStream.ReadToEnd();
	 
	objResponse.Close();
	respStream.Close();

	Debug.Log(result + " " + result.length);
}

function SerialRead(){
	var value : String = stream.ReadLine(); //Read the information
	Debug.Log(value);
	stream.BaseStream.Flush(); //Clear the serial information so we assure we get new information.
}


function Update () {
	var objResponse : WebResponse;
	var objRequest : WebRequest ;
	var sr : StreamReader;
	
	var encoding : ASCIIEncoding = new ASCIIEncoding();
	var postData: String = "filename=testsequence1&showfile=Submit";
	var data : byte[] = encoding.GetBytes(postData);
	var enc : Encoding = Encoding.GetEncoding(1252);  // Windows default Code Page
	
	//SerialRead();
	
	if (Input.GetKeyDown(KeyCode.I))
	{
		PostPattern("save", "" + frames);
	}
	
	if (Input.GetKeyDown(KeyCode.L))
	{
		var pagesUrl : String = "http://unsaturated.net/pyrosphere/listfiles.php";
	 
		// *** Establish the request
		var pagesRequest : HttpWebRequest = WebRequest.Create(pagesUrl);		 		 
		// *** Retrieve request info headers
		var pagesResponse : HttpWebResponse = pagesRequest.GetResponse();
		 
		var pagesResponseStream : StreamReader = new StreamReader(pagesResponse.GetResponseStream(),enc);
		 
		result = pagesResponseStream.ReadToEnd();
		 
		pagesResponse.Close();
		pagesResponseStream.Close();
	
		Debug.Log(result);
	}
	
	if (Input.GetKeyDown(KeyCode.O))
	{
		objRequest = System.Net.HttpWebRequest.Create("http://unsaturated.net/pyrosphere/showfile.php?filename=sequence2&showfile=Submit");
		objRequest.Method = "POST";
		objRequest.ContentType="text/plain";
		objRequest.ContentLength = data.Length;
		var newStream : Stream =objRequest.GetRequestStream();
		newStream.Write(data,0,data.Length);
		objResponse = objRequest.GetResponse();
		 
		var respStream : StreamReader = new StreamReader(objResponse.GetResponseStream(),enc);
		 
		result = respStream.ReadToEnd();
		 
		objResponse.Close();
		respStream.Close();
	
		Debug.Log(result + result.length);
	}
	
	if (Input.GetKeyDown(KeyCode.LeftBracket))
	{
		if (frameIndex > 0)
		{
			frameIndex--;
			RenderFrame();
			patternChanged = true;
		}
	}
	else if (Input.GetKeyDown(KeyCode.RightBracket))
	{
		frameIndex++;
		
		// if this is the first time I'm seeing this frame then
		// copy the last frame into this one
		if (frameIndex > maxIndex)
		{
			maxIndex = frameIndex;
			CopyFrame(frames[maxIndex-1],frames[maxIndex]);
		}	
		RenderFrame();
		patternChanged = true;
	}
	
	if(Input.GetKeyDown(KeyCode.P))
	{
		var sphere = GameObject.Find("Sphere");
		sphere.renderer.enabled = ! sphere.renderer.enabled;
	}
	
	if (Input.GetKeyDown("r")) { 
      WriteFile(filePath); 
   } 
   if (Input.GetKeyDown("f")) { 
      ReadFile(filePath); 
   } 


    // spin the object around the world origin at 20 degrees/second.
	//transform.Rotate (Input.GetAxis("Vertical"), Input.GetAxis("Horizontal") , 0, Space.Self);
	transform.RotateAround(Vector3(-85.19227,11.19896,7.82373), Vector3.forward, 1* Input.GetAxis("Horizontal"));
	transform.RotateAround(Vector3(-85.19227,11.19896,7.82373), Vector3.right, 1* Input.GetAxis("Vertical"));
}

function CopyFrame(sourceFrame : Array, destFrame : Array)
{
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

