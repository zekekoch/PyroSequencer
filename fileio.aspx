<%@ Page Language="C#" ContentType="text/plain" ResponseEncoding="iso-8859-1" debug="true" %>
<%@ Import Namespace="System.Net" %>
<%@ Import Namespace="System.IO" %>
<%@ Import Namespace="System.Xml" %>
<%@ Import Namespace="System.Web" %>
<%@ Import Namespace="System.Diagnostics" %>
<script runat="server" language="c#">
        
void Page_Load()
{
	WriteFile("test.txt");
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