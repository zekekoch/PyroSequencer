var fireJetID:String;
var id:int;

var otherScript;

function Start()
{
	otherScript = GameObject.FindWithTag("PyroSphere").GetComponent(RotateSphere);
}

function OnMouseDown () {
	//Debug.Log("Clicked FireJet");
	
	fireJetID = gameObject.name;
	id = int.Parse(fireJetID.Substring(3)); 
	
	for (var child : Transform in transform.Find("Flame"))
	{
		if (child.renderer.enabled == true)
		{
			child.renderer.enabled = false;
			otherScript.SetJet(id, false);
		}
		else
		{
			child.renderer.enabled = true;		
			otherScript.SetJet(id, true);
		}
	}
}