<%@ Page Language="C#" ContentType="text/plain" ResponseEncoding="iso-8859-1" debug="true" %>
<%@ Import Namespace="System.Net" %>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="System.Xml" %>
<%@ Import Namespace="System.Web" %>
<%@ Import Namespace="System.Data" %>
<%@ Import Namespace="System.Data.SqlClient" %>
<%@ Import Namespace="System.Diagnostics" %>
<script runat="server" language="c#">
        

protected void Page_Load(Object sender, EventArgs e)
{
	GetData();
	PostData("zeke", "0.0.0");
}

private void PostData(string name, string pattern)
{
	SqlConnection SQLConnection = new SqlConnection();
	SQLConnection.ConnectionString = "Data Source=174.36.218.228;User ID=pyro;Password=7SillyS7;Initial Catalog=pyro";
	SQLConnection.Open();

	SqlDataAdapter SQLDataAdapter = new SqlDataAdapter("select max(id) from sequence", SQLConnection);
	DataTable dtResult = new DataTable();
	SQLDataAdapter.Fill(dtResult);
	int maxID = dtResult.Rows[0]["ID"]++;
	
	SqlDataAdapter = new SqlDataAdapter("insert into sequence (id, name, pattern) values (" + maxID + ", '" + name + "','" + pattern + "')"); 
	DataTable dtResult = new DataTable();
	SQLDataAdapter.Fill(dtResult);

	// We don't need the data adapter any more
	SQLDataAdapter.Dispose();
	SQLConnection.Close();
	SQLConnection.Dispose();	
}


private void GetData()
{
	SqlConnection SQLConnection = new SqlConnection();
	SQLConnection.ConnectionString = "Data Source=174.36.218.228;User ID=pyro;Password=7SillyS7;Initial Catalog=pyro";
	SQLConnection.Open();

	SqlDataAdapter SQLDataAdapter = new SqlDataAdapter("select * from sequence", SQLConnection);
	DataTable dtResult = new DataTable();
	SQLDataAdapter.Fill(dtResult);

	// Loop through all entries
	foreach (DataRow drRow in dtResult.Rows)
	{
		Response.Write(drRow["id"].ToString() + "|" + drRow["Name"].ToString() + "|" + drRow["pattern"].ToString());
	}

	// We don't need the data adapter any more
	SQLDataAdapter.Dispose();
	SQLConnection.Close();
	SQLConnection.Dispose();
}

void WriteFile(string filepathIncludingFileName) 
{ 
   StreamWriter sw = new StreamWriter(filepathIncludingFileName); 
   sw.WriteLine("Line to write"); 
   sw.WriteLine("Another Line"); 
   sw.Flush(); 
   sw.Close(); 
} 

void ReadFile(string filepathIncludingFileName) { 
   StreamReader sr = File.OpenText(filepathIncludingFileName); 

   string input = ""; 
   while (true) { 
      input = sr.ReadLine(); 
      if (input == null) { break; } 
   } 
   sr.Close(); 
} 

</script>
<asp:Literal id="placeholder" runat="server"></asp:Literal>