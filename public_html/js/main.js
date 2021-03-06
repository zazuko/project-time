/* global LD2h, rdf, allNicks */

$(function () {
    //by default of the html the config-sections are visible
    //the enableMainSection function switches to the main section
    var prefix = "https://data.zazuko.com/";
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
        var userName = $("#sparqlUsername").val();
        if (userName.length > 0) {
            var basicAuthHeaderValue = "Basic " + btoa(userName + ":" + $("#sparqlPassword").val());
        } else {
            var basicAuthHeaderValue = undefined;
        }
        var store = new SparqlStore({
                endpointUrl: $("#sparqlQuery").val(),
                updateUrl: $("#sparqlUpdate").val(), //shouldn't be needed
                request: function(method, requestUrl, headers, content, callback) {
                    var newHeaders = headers || {};
                    if (basicAuthHeaderValue) {
                        newHeaders["Authorization"] = basicAuthHeaderValue;
                    }
                    return rdf.defaultRequest(method, requestUrl, headers, content, callback);
                }
            });
        LD2h.getDataGraph = function (callback) {
            store.graph(graphname, function(uri, g) {
                callback(g);
            });
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
                      headers: $.extend({},{
                          "Authorization": basicAuthHeaderValue
                      }),
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
                    "PREFIX pro: <http://schema.zazuko.com/work/>\n" +
                    "PREFIX doap: <http://usefulinc.com/ns/doap#>\n" +
                    "PREFIX rdf:  <http://www.w3.org/1999/02/22-rdf-syntax-ns#>\n" +
                    "INSERT DATA\n" +
                    "{ GRAPH <" + graphname + ">\n" +
                    "{ <" + projectIRI + ">  rdf:type  doap:Project." +
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
                    "PREFIX pro: <http://schema.zazuko.com/work/>\n" +
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
            var personIri = prefix+"people/"+ $("#nick").val();
            var nick = $("#nick").val();
            if( /[^a-zA-Z0-9]/.test(nick) ) {
                alert('Nick contains invalid character');
                return;
             }
            if (nick.length < 3) {
                alert("Nick must be at least 3 chars");
                return;
            }
            if ((typeof allNicks !== 'undefined') && (allNicks.indexOf(nick) > -1)) {
                alert("Nick already in use");
                return;
            }
            var update = "PREFIX schema: <http://schema.org/>\n" +
                    "PREFIX foaf: <http://xmlns.com/foaf/0.1/>\n" +
                    "INSERT DATA\n" +
                    "{ GRAPH <" + graphname + ">\n" +
                        "{\n" +
                            "<"+personIri + "> a schema:Person, foaf:Person;\n" +
                            "  foaf:nick \""+ nick + "\" ;\n" +
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