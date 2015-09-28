/* global LD2h, rdf */

$(function () {
    var prefix = "http://example.org/";
    var graphname = "http://zazuko.com/projects";
    var store = new rdf.SparqlStore({
        endpointUrl: $("#sparqlQuery").val(),
        updateUrl: $("#sparqlUpdate").val() //shouldn't be neede
    });

    LD2h.getDataGraph = function (callback) {
        store.graph(graphname, callback); //Caveat: with newer rdf-ext version the callback takes (uri,g)
    };
    $("#setEndpoints").click(function (e) {
        $("#endpointsForm").hide();
        $("#endpointsLink").show();
    });
    $("#showEndpointsConfig").click(function (e) {
        $("#endpointsLink").hide();
        $("#endpointsForm").show();
    });
    var sparqlUpdate = function(update) {
        jQuery.post($("#sparqlUpdate").val(), {update: update})
                .done(function () {
                    console.log("successfully updated");
                    window.location.reload();
                })
                .fail(function (e) {
                    console.log("error with query " + update, e);
                    alert("error (see console for details)");
                });
    }
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
                "{ <" + entryIri + ">  rdf:type  pro:Entry." +
                "<" + entryIri + ">  pro:spentTime  " + entryHours + "." +
                "<" + entryIri + "> pro:entryDate  \"" + $("#entryDate").val() + "\"^^xsd:date } \n" +
                "}";
        sparqlUpdate(update);
    });
    LD2h.expand();
});