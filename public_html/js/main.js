/* global LD2h, rdf */

$(function () {
    //by default of the html the config-sections are visible
    //the enableMainSection function switches to the main section
    var prefix = "http://example.org/";
    var graphname = "http://zazuko.com/projects";
        
    if (localStorage.getItem("sparqlQuery")) {
        $("#sparqlQuery").val(localStorage.getItem("sparqlQuery"));
    }
    if (localStorage.getItem("sparqlUpdate")) {
        $("#sparqlUpdate").val(localStorage.getItem("sparqlUpdate"));
    }
    if (localStorage.getItem("sparqlUsername")) {
        $("#sparqlUsername").val(localStorage.getItem("sparqlUsername"));
    }
    if (localStorage.getItem("sparqlPassword")) {
        $("#sparqlPassword").val(localStorage.getItem("sparqlPassword"));
    }
    var showMain = function() {    
        $("#endpointsForm").hide();
        $("#endpointsLink").show();
        $("#main").show();
        var basicAuthHeaderValue = "Basic " + btoa($("#sparqlUsername").val() + ":" + $("#sparqlPassword").val());
        var store = new rdf.SparqlStore({
                endpointUrl: $("#sparqlQuery").val(),
                updateUrl: $("#sparqlUpdate").val(), //shouldn't be needed
                request: function(method, requestUrl, headers, content, callback) {
                    var newHeaders = headers || {};
                    newHeaders["Authorization"] = basicAuthHeaderValue;
                    rdf.defaultRequest(method, requestUrl, headers, content, callback);
                }
            });
        LD2h.getDataGraph = function (callback) {
            store.graph(graphname, callback); //Caveat: with newer rdf-ext version the callback takes (uri,g)
        };
        $("#showEndpointsConfig").click(function (e) {
            localStorage.setItem("endPointsSet", false);
            window.location.reload();
            return false;
        });
        var sparqlUpdate = function(update) {
            jQuery.ajax(
                    { type: "POST",
                      url: $("#sparqlUpdate").val(), 
                      async: false,
                      headers: {
                          "Authorization": basicAuthHeaderValue
                      },
                      data: {update: update}
                  }).done(function () {
                        console.log("successfully updated");
                        window.location.reload();
                    })
                    .fail(function (e) {
                        if (e.status === 401) {
                            alert("Authentication failed, check you username and password in the SPARQL Endpoint Config");
                        } else {
                            alert("error (see console for details)");
                        }
                        console.log("error with query " + update, e);
                    });
        };
        $("#createProject").on("click", function () {
            var projectTitle = $("#projectTitle").val();
            if (projectTitle.length < 4) {
                alert("Project title too short.");
                return;
            }
            var shortName = $("#projectName").val();
            if (shortName.length < 3) {
                alert("Project short name must not be shorter than 3 characters.");
                return;
            }
            if (shortName.indexOf(' ') > -1) {
                alert("Project short name must not contain spaces.");
                return;
            }
            var projectHours = $("#projectHours").val();
            if (!projectHours) {
                projectHours = 0;
            }
            var projectIRI = prefix + "project/"+shortName;
            var update = "PREFIX dct: <http://purl.org/dc/terms/>\n" +
                    "PREFIX pro: <http://schema.zazukoians.org/projects/>\n" +
                    "PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                    "INSERT DATA\n" +
                    "{ GRAPH <" + graphname + ">\n" +
                    "{ <" + projectIRI + ">  rdf:type  pro:Project." +
                    "<" + projectIRI + ">  pro:plannedTime  " + projectHours + "." +
                    "<" + projectIRI + "> dct:title  \"" + projectTitle + "\" } \n" +
                    "}";
            sparqlUpdate(update);
        });
        $("#reportHours").on("click", function () {
            function makeid() {
                var text = "";
                var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

                for( var i=0; i < 7; i++ )
                    text += possible.charAt(Math.floor(Math.random() * possible.length));

                return text;
            };
            var entryHours = $("#entryHours").val();
            if (!entryHours) {
                alert("Must set entry hours");
                return;
            }
            var entryIri = prefix+"entry/"+makeid();
            var update = "PREFIX dct: <http://purl.org/dc/terms/>\n" +
                    "PREFIX pro: <http://schema.zazukoians.org/projects/>\n" +
                    "PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                    "PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>\n" +
                    "INSERT DATA\n" +
                    "{ GRAPH <" + graphname + ">\n" +
                    "{ <" + entryIri + ">  rdf:type  pro:Entry.\n" +
                    "<" + entryIri + ">  pro:spentTime  " + entryHours + ".\n" +
                    "<" + entryIri + ">  dct:description  \"" + $("#entryDescription").val() + "\" .\n" +
                    "<" + entryIri + ">  pro:project  <" + $("#entryProject").val() + "> .\n" +
                    "<" + entryIri + ">  pro:employee  <" + $("#entryPerson").val() + "> .\n" +
                    "<" + entryIri + ">  pro:entryDate  \"" + $("#entryDate").val() + "\"^^xsd:date } \n" +
                    "}";
            sparqlUpdate(update);
        });
        $("#createPerson").on("click", function () {
            var personIri = prefix+"employees/"+ $("#nick").val();
            var update = "PREFIX schema: <http://schema.org/>\n" +
                    "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\n" +
                    "INSERT DATA\n" +
                    "{ GRAPH <" + graphname + ">\n" +
                        "{\n" +
                            "<"+personIri + "> a schema:Person, foaf:Person;\n" +
                            "  foaf:nick \""+ $("#nick").val() + "\" ;\n" +
                            "  schema:givenName \""+ $("#givenName").val() + "\" ;\n" +
                            "  schema:familyName \""+ $("#familyName").val() + "\" ;\n" +
                            "  schema:email \""+ $("#email").val() + "\" .\n" +
                        "}\n" +
                    "}";
            sparqlUpdate(update);
        });
        LD2h.expand();
    };
    //be compatibel also with old er browsers that convert everything in localStore to String
    if (localStorage.getItem("endPointsSet") && localStorage.getItem("endPointsSet").toString() === "true") {
        showMain();
    }    
    $("#setEndpoints").click(function (e) {
        localStorage.setItem("sparqlQuery", $("#sparqlQuery").val());
        localStorage.setItem("sparqlUpdate", $("#sparqlUpdate").val());
        localStorage.setItem("sparqlUsername", $("#sparqlUsername").val());
        localStorage.setItem("sparqlPassword", $("#sparqlPassword").val());
        localStorage.setItem("endPointsSet", true);
        showMain();
    });
});